import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getWeekBoundaries } from "@/lib/date-utils";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { goalId, targetWeekId } = await req.json();
    if (!goalId) {
      return NextResponse.json({ error: "goalId is required" }, { status: 400 });
    }

    const sourceGoal = await db.weeklyGoal.findUnique({
      where: { id: goalId },
    });

    if (!sourceGoal || sourceGoal.userId !== user.id) {
      return NextResponse.json({ error: "Source goal not found" }, { status: 404 });
    }

    const { weekStart, weekEnd } = getWeekBoundaries(undefined, user.timezone);

    let weekId = targetWeekId;
    if (!weekId) {
      const currentWeek = await db.week.upsert({
        where: {
          userId_weekStart: {
            userId: user.id,
            weekStart,
          },
        },
        update: {},
        create: {
          userId: user.id,
          weekStart,
          weekEnd,
          status: "open",
        },
      });
      weekId = currentWeek.id;
    }

    // Create carried-forward goal
    const newGoal = await db.weeklyGoal.create({
      data: {
        weekId,
        userId: user.id,
        title: sourceGoal.title,
        description: sourceGoal.description ? `${sourceGoal.description} (Carried forward)` : "Carried forward from previous week",
        category: sourceGoal.category,
        weight: sourceGoal.weight,
        isCarriedForward: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Goal carried forward successfully into current week",
      goal: newGoal,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

