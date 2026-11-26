import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
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

    // PRD Privacy rule: student can never read another student's data
    if (week.userId !== user.id && user.role !== "admin" && user.role !== "mentor") {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    const report = await db.weeklyReport.findFirst({
      where: { weekId },
      orderBy: { generatedAt: "desc" },
      include: {
        goalScores: {
          include: {
            dailyGoal: true,
            disputes: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ report: null, message: "No report generated yet for this week." });
    }

    let parsedJson = null;
    try {
      parsedJson = JSON.parse(report.reportJson);
    } catch {
      parsedJson = null;
    }

    return NextResponse.json({
      report: {
        ...report,
        parsedData: parsedJson,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

