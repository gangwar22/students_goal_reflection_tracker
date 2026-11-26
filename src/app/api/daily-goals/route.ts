import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getTodayString } from "@/lib/date-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date") || getTodayString(user.timezone);

    const dailyGoals = await db.dailyGoal.findMany({
      where: {
        userId: user.id,
        goalDate: date,
      },
      include: {
        weeklyGoal: {
          select: {
            id: true,
            title: true,
            category: true,
            weight: true,
          },
        },
        reflection: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ date, dailyGoals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, weeklyGoalId, isExtra, goalDate } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // PRD Key acceptance criteria:
    // "A daily goal cannot be saved without a linked weekly goal or an explicit 'extra' flag."
    const isExplicitExtra = Boolean(isExtra);

    if (!isExplicitExtra && !weeklyGoalId) {
      return NextResponse.json(
        {
          error:
            "A daily goal cannot be saved without a linked weekly goal or an explicit 'extra' flag.",
        },
        { status: 400 }
      );
    }

    if (weeklyGoalId) {
      const weeklyGoal = await db.weeklyGoal.findUnique({
        where: { id: weeklyGoalId },
      });
      if (!weeklyGoal || weeklyGoal.userId !== user.id) {
        return NextResponse.json(
          { error: "Linked weekly goal does not exist or does not belong to you." },
          { status: 400 }
        );
      }
    }

    const targetDate = goalDate || getTodayString(user.timezone);

    const newDailyGoal = await db.dailyGoal.create({
      data: {
        userId: user.id,
        weeklyGoalId: isExplicitExtra ? null : weeklyGoalId,
        isExtra: isExplicitExtra,
        title: title.trim(),
        goalDate: targetDate,
      },
      include: {
        weeklyGoal: true,
        reflection: true,
      },
    });

    return NextResponse.json({ dailyGoal: newDailyGoal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

