import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import {
  generateInputHash,
  generateWeeklyNarrative,
  rollUpWeeklyGoals,
  scoreDailyGoalEvidence,
  DailyScoredResult,
  GoalForScoring,
  WeeklyGoalData,
} from "@/lib/ai-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: { weekId: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const weekId = params.weekId;
    const week = await db.week.findUnique({
      where: { id: weekId },
      include: {
        goals: true,
      },
    });

    if (!week) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    // Role check: Only the student themselves, admin, or mentor can trigger analysis
    if (week.userId !== user.id && user.role !== "admin" && user.role !== "mentor") {
      return NextResponse.json({ error: "Forbidden: Cannot analyze another student's week" }, { status: 403 });
    }

    // 1. Collect weekly goals
    const weeklyGoals: WeeklyGoalData[] = week.goals.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      weight: g.weight,
    }));

    // Collect daily goals and reflections for this week (between weekStart and weekEnd)
    const dailyGoals = await db.dailyGoal.findMany({
      where: {
        userId: week.userId,
        goalDate: {
          gte: week.weekStart,
          lte: week.weekEnd,
        },
      },
      include: {
        reflection: true,
        weeklyGoal: true,
      },
      orderBy: { goalDate: "asc" },
    });

    const goalsForScoring: GoalForScoring[] = dailyGoals.map((d) => ({
      dailyGoalId: d.id,
      title: d.title,
      isExtra: d.isExtra,
      weeklyGoalId: d.weeklyGoalId,
      weeklyGoalTitle: d.weeklyGoal?.title,
      reflection: d.reflection
        ? {
            didText: d.reflection.didText,
            blockedText: d.reflection.blockedText,
            learnedText: d.reflection.learnedText,
            selfRating: d.reflection.selfRating,
          }
        : null,
    }));

    // 2. Score each daily goal using AI evidence engine
    const dailyScoresMap = new Map<string, DailyScoredResult>();
    for (const g of goalsForScoring) {
      const scored = scoreDailyGoalEvidence(g);
      dailyScoresMap.set(g.dailyGoalId, scored);
    }

    // 3 & 4. Roll up each weekly goal & Compute weekly % strictly in code
    const { rollups, breakdown, overallPercent } = rollUpWeeklyGoals(
      weeklyGoals,
      goalsForScoring,
      dailyScoresMap
    );

    // 5. Generate narrative (summary, achieved, missed with quotes, patterns, learnings, 3 suggestions)
    const narrative = await generateWeeklyNarrative({
      weekStart: week.weekStart,
      overallPercent,
      rollups,
      allDailyGoals: goalsForScoring,
    });

    // Full Report JSON contract per PRD Section 5
    const reportJson = {
      week_start: week.weekStart,
      overall_percent: overallPercent,
      breakdown,
      goals: rollups.map((r) => ({
        goal_id: r.goalId,
        title: r.title,
        score: r.rolledUpScore,
        status: r.status,
        reason: r.reason,
        weight: r.weight,
        category: r.category,
      })),
      achieved: narrative.achieved,
      missed: narrative.missed,
      patterns: narrative.patterns,
      learnings: narrative.learnings,
      next_week_suggestions: narrative.next_week_suggestions,
      summary: narrative.summary,
    };

    const inputHash = generateInputHash({
      weekStart: week.weekStart,
      goals: weeklyGoals,
      dailyCount: dailyGoals.length,
    });

    // 6. Save or update WeeklyReport in database
    const savedReport = await db.weeklyReport.create({
      data: {
        userId: week.userId,
        weekId: week.id,
        overallPercent,
        reportJson: JSON.stringify(reportJson),
        model: process.env.ANTHROPIC_API_KEY ? "claude-3-5-sonnet" : "reflection-engine-v1.2",
        promptVersion: "v1.2",
        inputHash,
        status: "done",
      },
    });

    // Update week status to analysed
    await db.week.update({
      where: { id: week.id },
      data: { status: "analysed" },
    });

    // Persist goal_scores records for individual goal disputes
    for (const d of dailyGoals) {
      const scoreObj = dailyScoresMap.get(d.id);
      if (scoreObj) {
        await db.goalScore.create({
          data: {
            dailyGoalId: d.id,
            reportId: savedReport.id,
            score: scoreObj.score,
            status: scoreObj.status,
            reason: scoreObj.reason,
            confidence: scoreObj.confidence,
          },
        });
      }
    }

    // Persist clustered weekly learnings
    for (const cluster of narrative.learnings) {
      for (const pt of cluster.points) {
        await db.learning.create({
          data: {
            userId: week.userId,
            source: "weekly",
            sourceId: savedReport.id,
            theme: cluster.theme,
            text: pt,
            tags: cluster.theme.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            date: week.weekEnd,
          },
        });
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "generate_weekly_report",
        entity: "weekly_report",
        entityId: savedReport.id,
        metaJson: JSON.stringify({
          overallPercent,
          weekStart: week.weekStart,
          goalCount: weeklyGoals.length,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      report: savedReport,
      data: reportJson,
    });
  } catch (error: any) {
    console.error("Weekly analysis error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze week" }, { status: 500 });
  }
}

