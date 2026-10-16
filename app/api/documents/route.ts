import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const requestedUserId = new URL(request.url).searchParams.get("userId");
  if (requestedUserId && requestedUserId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(await prisma.document.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json();
  if (body.userId && body.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!body.title || !body.type || !body.content) return NextResponse.json({ error: "Missing document fields" }, { status: 400 });

  const document = await prisma.document.create({ data: { userId, title: body.title, type: body.type, templateId: body.templateId ?? "default", accentColor: body.accentColor ?? "#800000", language: body.language ?? "en", content: body.content } });
  return NextResponse.json(document, { status: 201 });
}
