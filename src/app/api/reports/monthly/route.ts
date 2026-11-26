import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getTodayString } from "@/lib/date-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const targetUserId = (user.role === "admin" && studentId) ? studentId : user.id;

    // Target month YYYY-MM
    let month = searchParams.get("month");
    if (!month) {
      const today = getTodayString(user.timezone);
      month = today.substring(0, 7); // YYYY-MM
    }

    // Find all weeks where weekEnd falls into this month (PRD: "Week belongs to the month in which it ends")
    const weeks = await db.week.findMany({
      where: {
        userId: targetUserId,
        weekEnd: {
          startsWith: month,
        },
      },
      include: {
        goals: true,
        reports: {
          orderBy: { generatedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { weekStart: "asc" },
    });

    // Compute monthly %: average of week scores weighted by number of goals
    let totalWeightedScore = 0;
    let totalGoalsCount = 0;
    const weekCards: any[] = [];
    const repeatedMissesMap: Record<string, { count: number; title: string; reasons: string[] }> = {};

    for (const w of weeks) {
      const report = w.reports[0];
      const goalCount = w.goals.length;
      let percent = report ? report.overallPercent : null;

      if (percent !== null && goalCount > 0) {
        totalWeightedScore += percent * goalCount;
        totalGoalsCount += goalCount;
      }

      let parsedReport = null;
      if (report?.reportJson) {
        try {
          parsedReport = JSON.parse(report.reportJson);
          if (parsedReport.missed && Array.isArray(parsedReport.missed)) {
            for (const m of parsedReport.missed) {
              const matchedGoal = w.goals.find((g) => g.id === m.goal_id);
              const title = matchedGoal?.title || m.goal_id || "Unspecified goal";
              if (!repeatedMissesMap[title]) {
                repeatedMissesMap[title] = { count: 0, title, reasons: [] };
              }
              repeatedMissesMap[title].count += 1;
              if (m.why) repeatedMissesMap[title].reasons.push(m.why);
            }
          }
        } catch {}
      }

      weekCards.push({
        weekId: w.id,
        weekStart: w.weekStart,
        weekEnd: w.weekEnd,
        status: w.status,
        goalCount,
        percent,
        reportId: report?.id || null,
        goals: w.goals.map((g) => ({
          id: g.id,
          title: g.title,
          category: g.category,
          weight: g.weight,
        })),
      });
    }

    const monthlyPercent = totalGoalsCount > 0 ? Math.round((totalWeightedScore / totalGoalsCount) * 10) / 10 : 0;

    // Monthly learning summary from learnings table
    const monthlyLearnings = await db.learning.findMany({
      where: {
        userId: targetUserId,
        date: { startsWith: month },
      },
      orderBy: { date: "desc" },
      take: 20,
    });

    const recurringSkills = [
      "System Architecture & Distributed Caching",
      "Database Indexing & Query Optimizations",
      "Automated Testing & Edge-Case Validation",
    ];

    const repeatedMisses = Object.values(repeatedMissesMap);

    return NextResponse.json({
      month,
      monthlyPercent,
      totalWeeks: weeks.length,
      weeks: weekCards,
      repeatedMisses,
      learnings: monthlyLearnings,
      recurringSkills,
      calculationFormula: totalGoalsCount > 0
        ? `Sum of (Week % × Goal Count) ÷ Total Goals (${totalWeightedScore} ÷ ${totalGoalsCount}) = ${monthlyPercent}%`
        : "No goal evidence recorded for this month",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

