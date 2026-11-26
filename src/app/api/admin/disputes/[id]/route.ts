import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "mentor")) {
      return NextResponse.json({ error: "Forbidden: Admin or Mentor access required" }, { status: 403 });
    }

    const disputeId = params.id;
    const body = await req.json();
    const { action, overrideScore, adminNotes } = body; // action: "resolve" | "reject"

    const dispute = await db.dispute.findUnique({
      where: { id: disputeId },
      include: {
        goalScore: {
          include: {
            report: {
              include: {
                week: {
                  include: {
                    goals: true,
                  },
                },
              },
            },
            dailyGoal: true,
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (action === "reject") {
      const updatedDispute = await db.dispute.update({
        where: { id: disputeId },
        data: {
          status: "rejected",
          resolvedBy: user.name,
          resolvedAt: new Date(),
          adminNotes: adminNotes?.trim() || "Dispute reviewed and original AI score upheld.",
        },
      });

      await db.notification.create({
        data: {
          userId: dispute.userId,
          type: "alert",
          content: `Your score dispute was reviewed. Decision: Score upheld. Note: ${adminNotes || "No change made."}`,
        },
      });

      return NextResponse.json({ dispute: updatedDispute, message: "Dispute rejected" });
    }

    // Resolve with score override
    const newScore = Math.max(0, Math.min(100, Number(overrideScore)));

    // 1. Update goal score record
    let newStatus = "missed";
    if (newScore >= 80) newStatus = "achieved";
    else if (newScore >= 40) newStatus = "partial";

    await db.goalScore.update({
      where: { id: dispute.goalScoreId },
      data: {
        score: newScore,
        status: newStatus,
        reason: `[Admin Override by ${user.name}] ${dispute.goalScore.reason}`,
      },
    });

    // 2. PRD Requirement: "Admin can override score; weekly % recalculated by code"
    // Fetch all goal scores for this weekly report to recalculate weekly %
    const reportId = dispute.goalScore.reportId;
    const allScoresForReport = await db.goalScore.findMany({
      where: { reportId },
      include: { dailyGoal: true },
    });

    const weeklyGoals = dispute.goalScore.report.week.goals;
    let weightedScoreSum = 0;
    let totalWeight = 0;
    const updatedRollups: any[] = [];

    for (const wg of weeklyGoals) {
      const linkedDailyScores = allScoresForReport.filter(
        (s) => s.dailyGoal.weeklyGoalId === wg.id
      );

      let rolledScore = 0;
      let rolledStatus = "missed";
      if (linkedDailyScores.length > 0) {
        const sum = linkedDailyScores.reduce((acc, s) => acc + s.score, 0);
        rolledScore = Math.min(100, Math.round(sum / linkedDailyScores.length));
        if (rolledScore >= 80) rolledStatus = "achieved";
        else if (rolledScore >= 40) rolledStatus = "partial";
      }

      const weight = wg.weight || 1;
      weightedScoreSum += weight * rolledScore;
      totalWeight += weight;

      updatedRollups.push({
        goal_id: wg.id,
        title: wg.title,
        score: rolledScore,
        status: rolledStatus,
        weight,
        category: wg.category,
      });
    }

    const recalculatedPercent = totalWeight > 0 ? Math.round((weightedScoreSum / totalWeight) * 10) / 10 : 0;

    // Update report JSON
    let reportData: any = {};
    try {
      reportData = JSON.parse(dispute.goalScore.report.reportJson);
    } catch {}

    reportData.overall_percent = recalculatedPercent;
    reportData.breakdown = {
      formula: `Recalculated after admin override: ${recalculatedPercent}%`,
      totalWeight,
      weightedScoreSum,
      calculatedPercent: recalculatedPercent,
      steps: updatedRollups.map((r) => ({
        goalId: r.goal_id,
        title: r.title,
        weight: r.weight,
        score: r.score,
        product: r.weight * r.score,
      })),
    };
    reportData.goals = updatedRollups;

    await db.weeklyReport.update({
      where: { id: reportId },
      data: {
        overallPercent: recalculatedPercent,
        reportJson: JSON.stringify(reportData),
      },
    });

    // 3. Update dispute record
    const updatedDispute = await db.dispute.update({
      where: { id: disputeId },
      data: {
        status: "resolved",
        overrideScore: newScore,
        resolvedBy: user.name,
        resolvedAt: new Date(),
        adminNotes: adminNotes?.trim() || `Score updated to ${newScore}%. Weekly score recalculated to ${recalculatedPercent}%.`,
      },
    });

    // 4. Send student notification
    await db.notification.create({
      data: {
        userId: dispute.userId,
        type: "dispute_resolved",
        content: `Your score dispute was resolved! Score updated to ${newScore}%. Weekly total recalculated to ${recalculatedPercent}%.`,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "override_disputed_score",
        entity: "dispute",
        entityId: disputeId,
        metaJson: JSON.stringify({
          originalScore: dispute.goalScore.score,
          newScore,
          recalculatedPercent,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Dispute resolved. Score updated to ${newScore}%, weekly total recalculated to ${recalculatedPercent}%.`,
      dispute: updatedDispute,
      recalculatedPercent,
    });
  } catch (error: any) {
    console.error("Dispute resolution error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

