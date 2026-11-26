import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const level = searchParams.get("level"); // "daily", "weekly", "monthly", or null for all
    const search = searchParams.get("search"); // tag or text filter
    const studentId = searchParams.get("studentId");

    const targetUserId = (user.role === "admin" && studentId) ? studentId : user.id;

    const where: any = { userId: targetUserId };
    if (level && ["daily", "weekly", "monthly"].includes(level)) {
      where.source = level;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { text: { contains: q } },
        { theme: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    const learnings = await db.learning.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ learnings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { text, theme, tags, date, source } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Learning text is required" }, { status: 400 });
    }

    const learning = await db.learning.create({
      data: {
        userId: user.id,
        source: source || "daily",
        theme: theme || "General Insight",
        text: text.trim(),
        tags: tags || "self-learning",
        date: date || new Date().toISOString().substring(0, 10),
      },
    });

    return NextResponse.json({ learning });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

