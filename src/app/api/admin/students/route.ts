import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getTodayString } from "@/lib/date-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "mentor")) {
      return NextResponse.json({ error: "Forbidden: Admin or Mentor access required" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const batchId = searchParams.get("batch");
    const riskOnly = searchParams.get("risk") === "true";
    const searchQuery = searchParams.get("q") || "";

    const todayStr = getTodayString();

    const where: any = { role: "student" };
    if (batchId) where.batchId = batchId;
    if (searchQuery.trim()) {
      where.OR = [
        { name: { contains: searchQuery.trim() } },
        { email: { contains: searchQuery.trim() } },
      ];
    }

    const students = await db.user.findMany({
      where,
      include: {
        batch: true,
        weeklyReports: {
          orderBy: { generatedAt: "desc" },
          take: 3,
        },
        dailyGoals: {
          orderBy: { goalDate: "desc" },
          take: 7,
          include: {
            reflection: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const studentRows = students.map((s) => {
      // Latest weekly %
      const latestReport = s.weeklyReports[0];
      const weeklyPercent = latestReport ? Math.round(latestReport.overallPercent) : null;

      // Past 2 weeks reports
      const past2Reports = s.weeklyReports.slice(0, 2);
      const lowScoresFor2Weeks =
        past2Reports.length >= 2 &&
        past2Reports.every((r) => r.overallPercent < 40);

      // Check last active date
      const lastDaily = s.dailyGoals[0];
      const lastActiveDate = lastDaily ? lastDaily.goalDate : null;

      // Inactivity days calculation
      let inactiveDays = 999;
      if (lastActiveDate) {
        const lastDate = new Date(lastActiveDate);
        const today = new Date(todayStr);
        inactiveDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Reflection streak: count consecutive daily goals with reflections
      let streak = 0;
      for (const dg of s.dailyGoals) {
        if (dg.reflection) {
          streak++;
        } else {
          break;
        }
      }

      // PRD Section 7 At-risk criteria:
      // "Students with weekly % below 40 for 2 weeks, or no entries for 3 days"
      const isAtRisk =
        (weeklyPercent !== null && weeklyPercent < 40) ||
        lowScoresFor2Weeks ||
        inactiveDays >= 3;

      let riskReason = "";
      if (lowScoresFor2Weeks) {
        riskReason = "Weekly % below 40 for 2 consecutive weeks";
      } else if (weeklyPercent !== null && weeklyPercent < 40) {
        riskReason = "Weekly % below 40%";
      } else if (inactiveDays >= 3) {
        riskReason = `No entries for ${inactiveDays >= 999 ? 'ever' : `${inactiveDays} days`}`;
      }

      // Calculate approximate monthly %
      let monthlyPercent: number | null = null;
      if (s.weeklyReports.length > 0) {
        const sum = s.weeklyReports.reduce((acc, r) => acc + r.overallPercent, 0);
        monthlyPercent = Math.round(sum / s.weeklyReports.length);
      }

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        batchName: s.batch?.name || "Unassigned",
        weeklyPercent,
        monthlyPercent,
        streak,
        lastActive: lastActiveDate || "Never",
        inactiveDays,
        isAtRisk,
        riskReason,
        isActive: s.isActive,
      };
    });

    const filtered = riskOnly ? studentRows.filter((s) => s.isAtRisk) : studentRows;

    return NextResponse.json({ students: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

