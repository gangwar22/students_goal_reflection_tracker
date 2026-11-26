import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getWeekBoundaries } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { weekStart, weekEnd, isLocked, hoursUntilLock } = getWeekBoundaries(
      undefined,
      user.timezone || "Asia/Kolkata"
    );

    // Find or create current week record for this user
    let week = await db.week.findUnique({
      where: {
        userId_weekStart: {
          userId: user.id,
          weekStart,
        },
      },
      include: {
        goals: {
          orderBy: { createdAt: "asc" },
          include: {
            dailyGoals: {
              include: {
                reflection: true,
              },
            },
          },
        },
        reports: {
          orderBy: { generatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!week) {
      week = await db.week.create({
        data: {
          userId: user.id,
          weekStart,
          weekEnd,
          status: isLocked ? "locked" : "open",
        },
        include: {
          goals: {
            include: {
              dailyGoals: {
                include: {
                  reflection: true,
                },
              },
            },
          },
          reports: true,
        },
      });
    }

    // Check system settings for goal limits
    const settings = await db.systemSetting.findFirst();

    return NextResponse.json({
      week,
      isLocked,
      hoursUntilLock,
      limits: {
        min: settings?.minWeeklyGoals || 3,
        max: settings?.maxWeeklyGoals || 10,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /weeks/current:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

