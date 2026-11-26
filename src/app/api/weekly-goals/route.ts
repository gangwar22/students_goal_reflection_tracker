import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getWeekBoundaries } from "@/lib/date-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const weekId = searchParams.get("weekId");

    const where: any = { userId: user.id };
    if (weekId) where.weekId = weekId;

    const goals = await db.weeklyGoal.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        dailyGoals: {
          include: {
            reflection: true,
          },
        },
      },
    });

    return NextResponse.json({ goals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, description, category, weight, weekId, reason } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { weekStart, weekEnd, isLocked } = getWeekBoundaries(undefined, user.timezone);

    // Get target week
    let targetWeekId = weekId;
    if (!targetWeekId) {
      let currentWeek = await db.week.findUnique({
        where: {
          userId_weekStart: {
            userId: user.id,
            weekStart,
          },
        },
      });
      if (!currentWeek) {
        currentWeek = await db.week.create({
          data: {
            userId: user.id,
            weekStart,
            weekEnd,
            status: isLocked ? "locked" : "open",
          },
        });
      }
      targetWeekId = currentWeek.id;
    }

    // Check count of goals for week
    const currentGoalsCount = await db.weeklyGoal.count({
      where: { weekId: targetWeekId },
    });

    const settings = await db.systemSetting.findFirst();
    const maxGoals = settings?.maxWeeklyGoals || 10;
    if (currentGoalsCount >= maxGoals) {
      return NextResponse.json(
        { error: `Maximum of ${maxGoals} weekly goals reached for this week` },
        { status: 400 }
      );
    }

    // Check if locked
    if (isLocked && (!reason || !reason.trim())) {
      return NextResponse.json(
        { error: "The week is locked (after Monday 11:59 PM). A reason is required to add or modify goals." },
        { status: 400 }
      );
    }

    const numericWeight = Math.max(1, Math.min(3, Number(weight) || 1));

    const goal = await db.weeklyGoal.create({
      data: {
        weekId: targetWeekId,
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "Technical",
        weight: numericWeight,
        editedAfterLock: isLocked,
        editReason: isLocked ? reason.trim() : null,
      },
    });

    if (isLocked) {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "create_weekly_goal_after_lock",
          entity: "weekly_goal",
          entityId: goal.id,
          metaJson: JSON.stringify({ reason: reason.trim(), title: goal.title }),
        },
      });
    }

    return NextResponse.json({ goal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

