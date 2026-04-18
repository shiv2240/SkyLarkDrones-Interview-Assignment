import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "610-assistant-super-secret";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.organizationId,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Create an audit log asynchronously (don't block the response)
    prisma.auditLog
      .create({
        data: {
          action: "LOGIN",
          operator: user.name,
          details: "User logged into system (Next.js API)",
          category: "AUTH",
        },
      })
      .catch((err) => console.error("Audit Log Error:", err));

    return NextResponse.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("Login API Global Error:", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
