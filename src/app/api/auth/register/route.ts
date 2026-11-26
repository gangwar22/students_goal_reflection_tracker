import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, batchId } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Default batch if not provided
    let assignedBatchId = batchId;
    if (!assignedBatchId) {
      const defaultBatch = await db.batch.findFirst();
      if (defaultBatch) assignedBatchId = defaultBatch.id;
    }

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: "student", // Strictly student role for self sign-up per PRD Section 2
        batchId: assignedBatchId,
        timezone: "Asia/Kolkata",
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: "student",
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        batchId: user.batchId,
        timezone: user.timezone,
      },
      token,
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}

