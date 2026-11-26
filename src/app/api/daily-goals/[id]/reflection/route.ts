import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isWithinBackfillWindow as checkBackfillDate } from "@/lib/date-utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dailyGoalId = params.id;
    const dailyGoal = await db.dailyGoal.findUnique({
      where: { id: dailyGoalId },
      include: { reflection: true },
    });

    if (!dailyGoal || dailyGoal.userId !== user.id) {
      return NextResponse.json({ error: "Daily goal not found" }, { status: 404 });
    }

    // PRD Rule: "A reflection can be written for today or backfilled up to 48 hours."
    const backfillCheck = checkBackfillDate(dailyGoal.goalDate, user.timezone);
    if (!backfillCheck.allowed) {
      return NextResponse.json(
        {
          error: `Backfill window expired. Reflections can only be logged for today or within the past 48 hours (this goal is from ${dailyGoal.goalDate}, ${backfillCheck.hoursAgo} hours ago).`,
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { didText, blockedText, learnedText, selfRating } = body;

    const cleanDid = (didText || "").trim().slice(0, 2000);
    const cleanBlocked = (blockedText || "").trim().slice(0, 2000);
    const cleanLearned = (learnedText || "").trim().slice(0, 2000);
    const rating = selfRating ? Math.max(1, Math.min(5, Number(selfRating))) : null;

    const totalLength = cleanDid.length + cleanBlocked.length + cleanLearned.length;
    let warning: string | null = null;

    // PRD Acceptance criteria:
    // "A reflection shorter than 20 characters shows a warning, because the AI cannot judge it fairly."
    if (totalLength < 20) {
      warning = "Warning: Reflection is shorter than 20 characters. The AI may flag this as low confidence or insufficient evidence.";
    }

    const reflection = await db.reflection.upsert({
      where: { dailyGoalId },
      update: {
        didText: cleanDid,
        blockedText: cleanBlocked,
        learnedText: cleanLearned,
        selfRating: rating,
        submittedAt: new Date(),
      },
      create: {
        dailyGoalId,
        didText: cleanDid,
        blockedText: cleanBlocked,
        learnedText: cleanLearned,
        selfRating: rating,
        submittedAt: new Date(),
      },
    });

    // If student wrote something in 'what I learned', automatically record into learnings timeline
    if (cleanLearned.length >= 10) {
      await db.learning.create({
        data: {
          userId: user.id,
          source: "daily",
          sourceId: dailyGoalId,
          theme: "Daily Reflection",
          text: cleanLearned,
          tags: "daily, reflection",
          date: dailyGoal.goalDate,
        },
      });
    }

    return NextResponse.json({
      reflection,
      warning,
      message: "Reflection saved successfully",
    });
  } catch (error: any) {
    console.error("Error saving reflection:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

