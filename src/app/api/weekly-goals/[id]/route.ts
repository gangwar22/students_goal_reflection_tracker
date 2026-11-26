import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getWeekBoundaries } from "@/lib/date-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goalId = params.id;
    const existing = await db.weeklyGoal.findUnique({
      where: { id: goalId },
      include: { week: true },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const { isLocked } = getWeekBoundaries(existing.week.weekStart, user.timezone);
    const body = await req.json();
    const { title, description, category, weight, reason } = body;

    if (isLocked && (!reason || !reason.trim())) {
      return NextResponse.json(
        { error: "Goal is locked. A reason is required to make edits after Monday 11:59 PM." },
        { status: 400 }
      );
    }

    const updated = await db.weeklyGoal.update({
      where: { id: goalId },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        description: description !== undefined ? description?.trim() : existing.description,
        category: category || existing.category,
        weight: weight !== undefined ? Math.max(1, Math.min(3, Number(weight))) : existing.weight,
        editedAfterLock: isLocked ? true : existing.editedAfterLock,
        editReason: isLocked ? reason.trim() : existing.editReason,
      },
    });

    if (isLocked) {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "edit_weekly_goal_after_lock",
          entity: "weekly_goal",
          entityId: goalId,
          metaJson: JSON.stringify({
            reason: reason.trim(),
            previous: { title: existing.title, weight: existing.weight },
            updated: { title: updated.title, weight: updated.weight },
          }),
        },
      });
    }

    return NextResponse.json({ goal: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goalId = params.id;
    const existing = await db.weeklyGoal.findUnique({
      where: { id: goalId },
      include: { week: true },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const { isLocked } = getWeekBoundaries(existing.week.weekStart, user.timezone);

    await db.weeklyGoal.delete({
      where: { id: goalId },
    });

    if (isLocked) {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "delete_weekly_goal_after_lock",
          entity: "weekly_goal",
          entityId: goalId,
          metaJson: JSON.stringify({ deletedTitle: existing.title }),
        },
      });
    }

    return NextResponse.json({ success: true, message: "Goal deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

