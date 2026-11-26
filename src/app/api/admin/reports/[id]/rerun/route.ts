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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "mentor")) {
      return NextResponse.json({ error: "Forbidden: Admin or Mentor access required" }, { status: 403 });
    }

    const reportId = params.id;
    const existingReport = await db.weeklyReport.findUnique({
      where: { id: reportId },
      include: {
        week: {
          include: {
            goals: true,
          },
        },
      },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const week = existingReport.week;

    // Collect daily goals
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

    const weeklyGoals: WeeklyGoalData[] = week.goals.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      weight: g.weight,
    }));

    const dailyScoresMap = new Map<string, DailyScoredResult>();
    for (const g of goalsForScoring) {
      const scored = scoreDailyGoalEvidence(g);
      dailyScoresMap.set(g.dailyGoalId, scored);
    }

    const { rollups, breakdown, overallPercent } = rollUpWeeklyGoals(
      weeklyGoals,
      goalsForScoring,
      dailyScoresMap
    );

    const narrative = await generateWeeklyNarrative({
      weekStart: week.weekStart,
      overallPercent,
      rollups,
      allDailyGoals: goalsForScoring,
    });

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
      rerunAt: new Date().toISOString(),
    });

    // Update report
    const updated = await db.weeklyReport.update({
      where: { id: reportId },
      data: {
        overallPercent,
        reportJson: JSON.stringify(reportJson),
        status: "done",
        inputHash,
        generatedAt: new Date(),
      },
    });

    // Delete existing goal scores for this report and repopulate
    await db.goalScore.deleteMany({ where: { reportId } });
    for (const d of dailyGoals) {
      const scoreObj = dailyScoresMap.get(d.id);
      if (scoreObj) {
        await db.goalScore.create({
          data: {
            dailyGoalId: d.id,
            reportId: updated.id,
            score: scoreObj.score,
            status: scoreObj.status,
            reason: scoreObj.reason,
            confidence: scoreObj.confidence,
          },
        });
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "rerun_weekly_analysis",
        entity: "weekly_report",
        entityId: reportId,
        metaJson: JSON.stringify({ recalculatedPercent: overallPercent }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Analysis rerun successfully. Recalculated score: ${overallPercent}%`,
      report: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

