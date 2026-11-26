import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Per security best practices, return success message even if user not found
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, password reset instructions have been sent.",
      demoNote: user ? "For demo: you can login with 'student123' or contact the admin." : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

