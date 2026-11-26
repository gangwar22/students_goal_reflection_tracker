import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  // Logout endpoint
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("token");
  return response;
}

