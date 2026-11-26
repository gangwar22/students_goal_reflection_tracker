import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import db from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "ai-weekly-goal-tracker-secret-key-super-secure-2026";

export interface TokenPayload {
  userId: string;
  email: string;
  role: "student" | "admin" | "mentor";
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the authenticated user from Request (cookie or header)
 */
export async function getAuthUser(req?: NextRequest) {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      const cookieHeader = req.cookies.get("token")?.value;
      if (cookieHeader) token = cookieHeader;
    }
  }

  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get("token")?.value;
    } catch {
      // when called in non-route context
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      batchId: true,
      timezone: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;

  return user;
}

