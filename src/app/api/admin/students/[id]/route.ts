import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "mentor")) {
      return NextResponse.json({ error: "Forbidden: Admin or Mentor access required" }, { status: 403 });
    }

    const studentId = params.id;
    const student = await db.user.findUnique({
      where: { id: studentId },
      include: {
        batch: true,
        weeks: {
          orderBy: { weekStart: "desc" },
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
            reports: {
              orderBy: { generatedAt: "desc" },
            },
          },
        },
        monthlyReports: {
          orderBy: { month: "desc" },
        },
        learnings: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Log admin view audit
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "view_student_detail",
        entity: "user",
        entityId: studentId,
        metaJson: JSON.stringify({ studentEmail: student.email }),
      },
    });

    return NextResponse.json({ student });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

