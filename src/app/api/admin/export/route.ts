import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "mentor")) {
      return NextResponse.json({ error: "Forbidden: Admin or Mentor access required" }, { status: 403 });
    }

    const students = await db.user.findMany({
      where: { role: "student" },
      include: {
        batch: true,
        weeklyReports: {
          orderBy: { generatedAt: "desc" },
          take: 1,
        },
        dailyGoals: {
          include: {
            reflection: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Generate CSV lines
    const headers = [
      "Student ID",
      "Name",
      "Email",
      "Batch",
      "Latest Weekly %",
      "Total Daily Goals",
      "Reflections Logged",
      "Status",
      "Created At",
    ];

    const rows = students.map((s) => {
      const latestReport = s.weeklyReports[0];
      const percent = latestReport ? latestReport.overallPercent : "N/A";
      const totalDaily = s.dailyGoals.length;
      const reflected = s.dailyGoals.filter((d) => d.reflection !== null).length;

      return [
        `"${s.id}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.email}"`,
        `"${(s.batch?.name || "Unassigned").replace(/"/g, '""')}"`,
        `"${percent}"`,
        `"${totalDaily}"`,
        `"${reflected}"`,
        `"${s.isActive ? "Active" : "Inactive"}"`,
        `"${s.createdAt.toISOString()}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="student_cohort_export_${new Date().toISOString().substring(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

