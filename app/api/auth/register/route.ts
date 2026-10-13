import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) { const { name, email, password } = await request.json(); const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : ""; if (!normalizedEmail || !password || password.length < 8) return NextResponse.json({ error: "Email and an 8-character password are required" }, { status: 400 }); const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } }); if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 }); const user = await prisma.user.create({ data: { name: typeof name === "string" ? name.trim() : null, email: normalizedEmail, passwordHash: hashPassword(password) }, select: { id: true, name: true, email: true } }); return NextResponse.json(user, { status: 201 }); }
