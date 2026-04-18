import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "610-assistant-super-secret";

export interface DecodedUser {
  id: string;
  email: string;
  role: string;
  orgId: string;
}

export function getAuthUser(request: Request): DecodedUser | null {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as DecodedUser;
  } catch (err) {
    return null;
  }
}
