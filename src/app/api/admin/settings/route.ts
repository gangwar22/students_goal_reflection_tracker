import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    let settings = await db.systemSetting.findFirst();
    if (!settings) {
      settings = await db.systemSetting.create({
        data: {
          minWeeklyGoals: 3,
          maxWeeklyGoals: 10,
          lockTime: "Monday 23:59",
          reminderTime: "20:00",
          scoreThresholdAchieved: 80,
          scoreThresholdPartial: 40,
          promptVersion: "v1.2",
          aiProvider: "auto",
          leaderboardEnabled: true,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      minWeeklyGoals,
      maxWeeklyGoals,
      lockTime,
      reminderTime,
      scoreThresholdAchieved,
      scoreThresholdPartial,
      promptVersion,
      aiProvider,
      leaderboardEnabled,
    } = body;

    const existingSettings = await db.systemSetting.findFirst();

    let updated;
    if (existingSettings) {
      updated = await db.systemSetting.update({
        where: { id: existingSettings.id },
        data: {
          minWeeklyGoals: Number(minWeeklyGoals) || 3,
          maxWeeklyGoals: Number(maxWeeklyGoals) || 10,
          lockTime: lockTime || "Monday 23:59",
          reminderTime: reminderTime || "20:00",
          scoreThresholdAchieved: Number(scoreThresholdAchieved) || 80,
          scoreThresholdPartial: Number(scoreThresholdPartial) || 40,
          promptVersion: promptVersion || "v1.2",
          aiProvider: aiProvider || "auto",
          leaderboardEnabled: leaderboardEnabled !== undefined ? Boolean(leaderboardEnabled) : true,
        },
      });
    } else {
      updated = await db.systemSetting.create({
        data: {
          minWeeklyGoals: Number(minWeeklyGoals) || 3,
          maxWeeklyGoals: Number(maxWeeklyGoals) || 10,
          lockTime: lockTime || "Monday 23:59",
          reminderTime: reminderTime || "20:00",
          scoreThresholdAchieved: Number(scoreThresholdAchieved) || 80,
          scoreThresholdPartial: Number(scoreThresholdPartial) || 40,
          promptVersion: promptVersion || "v1.2",
          aiProvider: aiProvider || "auto",
          leaderboardEnabled: leaderboardEnabled !== undefined ? Boolean(leaderboardEnabled) : true,
        },
      });
    }

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "update_system_settings",
        entity: "system_settings",
        entityId: updated.id,
        metaJson: JSON.stringify(updated),
      },
    });

    return NextResponse.json({ settings: updated, message: "Settings saved successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

