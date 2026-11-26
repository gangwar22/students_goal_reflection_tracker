import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "mentor")) {
      return NextResponse.json({ error: "Forbidden: Admin or Mentor access required" }, { status: 403 });
    }

    const batches = await db.batch.findMany({
      include: {
        users: {
          where: { role: "student" },
          include: {
            weeklyReports: {
              orderBy: { generatedAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const batchStats = batches.map((b) => {
      const studentCount = b.users.length;
      let scoreSum = 0;
      let scoredStudentsCount = 0;

      for (const st of b.users) {
        const rep = st.weeklyReports[0];
        if (rep) {
          scoreSum += rep.overallPercent;
          scoredStudentsCount++;
        }
      }

      const avgPercent = scoredStudentsCount > 0 ? Math.round(scoreSum / scoredStudentsCount) : 0;

      return {
        id: b.id,
        name: b.name,
        startDate: b.startDate,
        endDate: b.endDate,
        studentCount,
        averagePercent: avgPercent,
      };
    });

    return NextResponse.json({ batches: batchStats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "mentor")) {
      return NextResponse.json({ error: "Forbidden: Admin or Mentor access required" }, { status: 403 });
    }

    const { name, startDate, endDate } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Batch name is required" }, { status: 400 });
    }

    const batch = await db.batch.create({
      data: {
        name: name.trim(),
        startDate: new Date(startDate || new Date()),
        endDate: new Date(endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
      },
    });

    return NextResponse.json({ batch });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

