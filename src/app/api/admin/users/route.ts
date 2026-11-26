import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAuthUser, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const users = await db.user.findMany({
      include: {
        batch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        batchName: u.batch?.name || "Unassigned",
        batchId: u.batchId,
        isActive: u.isActive,
        timezone: u.timezone,
        createdAt: u.createdAt,
      })),
    });
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
    const { name, email, password, role, batchId } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: role || "student",
        batchId: batchId || null,
        timezone: "Asia/Kolkata",
      },
    });

    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, isActive, newPassword, role, batchId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const data: any = {};
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (role) data.role = role;
    if (batchId !== undefined) data.batchId = batchId || null;
    if (newPassword && newPassword.trim().length >= 6) {
      data.passwordHash = await hashPassword(newPassword.trim());
    }

    const updated = await db.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isActive: updated.isActive,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

