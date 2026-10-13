import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  return NextResponse.json(await prisma.document.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }));
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.userId || !body.title || !body.type || !body.content) return NextResponse.json({ error: "Missing document fields" }, { status: 400 });
  const document = await prisma.document.create({ data: { userId: body.userId, title: body.title, type: body.type, templateId: body.templateId ?? "default", accentColor: body.accentColor ?? "#800000", language: body.language ?? "en", content: body.content } });
  return NextResponse.json(document, { status: 201 });
}
