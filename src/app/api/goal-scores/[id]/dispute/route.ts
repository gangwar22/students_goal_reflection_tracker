import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goalScoreId = params.id;
    const { comment } = await req.json();

    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: "A comment explaining your dispute is required" }, { status: 400 });
    }

    const goalScore = await db.goalScore.findUnique({
      where: { id: goalScoreId },
      include: {
        report: true,
      },
    });

    if (!goalScore || goalScore.report.userId !== user.id) {
      return NextResponse.json({ error: "Goal score record not found" }, { status: 404 });
    }

    // Create dispute record
    const dispute = await db.dispute.create({
      data: {
        goalScoreId,
        userId: user.id,
        comment: comment.trim(),
        status: "pending",
      },
    });

    // Notify admin
    await db.notification.create({
      data: {
        userId: user.id,
        type: "alert",
        content: `Dispute filed for score: "${goalScore.reason}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dispute submitted. An academic administrator will review your evidence and comment.",
      dispute,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

