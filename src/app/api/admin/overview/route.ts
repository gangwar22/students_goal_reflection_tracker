import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getWeekBoundaries } from "@/lib/date-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "mentor")) {
      return NextResponse.json({ error: "Forbidden: Admin or Mentor access required" }, { status: 403 });
    }

    const { weekStart, weekEnd } = getWeekBoundaries();

    // Total students
    const totalStudents = await db.user.count({
      where: { role: "student" },
    });

    // Students active this week (have at least one daily goal or reflection this week)
    const activeStudentIds = await db.dailyGoal.findMany({
      where: {
        goalDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    const activeThisWeekCount = activeStudentIds.length;

    // Reports generated and failed
    const generatedReportsCount = await db.weeklyReport.count({
      where: { status: "done" },
    });
    const failedReportsCount = await db.weeklyReport.count({
      where: { status: "failed" },
    });

    // Average weekly %
    const reportsThisWeek = await db.weeklyReport.findMany({
      where: {
        week: {
          weekStart,
        },
      },
      select: { overallPercent: true },
    });

    let avgWeeklyPercent = 0;
    if (reportsThisWeek.length > 0) {
      const sum = reportsThisWeek.reduce((acc, r) => acc + r.overallPercent, 0);
      avgWeeklyPercent = Math.round(sum / reportsThisWeek.length);
    }

    // Reflection completion rate: daily goals with reflection vs total daily goals
    const totalDailyGoalsThisWeek = await db.dailyGoal.count({
      where: {
        goalDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    const totalReflectedThisWeek = await db.reflection.count({
      where: {
        dailyGoal: {
          goalDate: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      },
    });

    const reflectionCompletionRate = totalDailyGoalsThisWeek > 0
      ? Math.round((totalReflectedThisWeek / totalDailyGoalsThisWeek) * 100)
      : 0;

    // Open disputes count
    const pendingDisputesCount = await db.dispute.count({
      where: { status: "pending" },
    });

    // Recent reports feed
    const recentReports = await db.weeklyReport.findMany({
      take: 6,
      orderBy: { generatedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        week: true,
      },
    });

    return NextResponse.json({
      metrics: {
        totalStudents,
        activeThisWeek: activeThisWeekCount,
        averageWeeklyPercent: avgWeeklyPercent,
        reflectionCompletionRate,
        reportsGenerated: generatedReportsCount,
        reportsFailed: failedReportsCount,
        pendingDisputes: pendingDisputesCount,
        currentWeek: `${weekStart} to ${weekEnd}`,
      },
      recentReports,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

