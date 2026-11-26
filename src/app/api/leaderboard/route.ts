import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await db.systemSetting.findFirst();
    // Check if leaderboard is enabled by admin
    if (settings && !settings.leaderboardEnabled && user.role !== "admin") {
      return NextResponse.json({
        enabled: false,
        message: "Cohort leaderboard is currently hidden by administration.",
        leaderboard: [],
      });
    }

    const students = await db.user.findMany({
      where: { role: "student", isActive: true },
      include: {
        batch: true,
        weeklyReports: {
          orderBy: { generatedAt: "desc" },
          take: 4,
        },
        dailyGoals: {
          orderBy: { goalDate: "desc" },
          take: 14,
          include: { reflection: true },
        },
      },
    });

    const leaderboard = students.map((s) => {
      // Calculate consistency: percentage of days with reflections
      const totalDaily = s.dailyGoals.length;
      const reflectedCount = s.dailyGoals.filter((d) => d.reflection !== null).length;
      const consistencyScore = totalDaily > 0 ? Math.round((reflectedCount / totalDaily) * 100) : 0;

      // Average score
      let avgScore = 0;
      if (s.weeklyReports.length > 0) {
        const sum = s.weeklyReports.reduce((acc, r) => acc + r.overallPercent, 0);
        avgScore = Math.round(sum / s.weeklyReports.length);
      }

      // Reflection streak
      let streak = 0;
      for (const dg of s.dailyGoals) {
        if (dg.reflection) streak++;
        else break;
      }

      // Composite rank score = 50% consistency + 50% achievement score
      const rankScore = Math.round(consistencyScore * 0.5 + avgScore * 0.5);

      return {
        id: s.id,
        name: s.name,
        batchName: s.batch?.name || "General",
        consistencyScore,
        avgScore,
        streak,
        rankScore,
      };
    });

    // Sort by rankScore descending
    leaderboard.sort((a, b) => b.rankScore - a.rankScore);

    return NextResponse.json({
      enabled: settings?.leaderboardEnabled ?? true,
      leaderboard,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

