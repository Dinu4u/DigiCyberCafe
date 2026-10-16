import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const document = await prisma.document.findFirst({ where: { id: (await context.params).id, userId } });
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return NextResponse.json(document);
}

export async function PATCH(request: Request, context: Context) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const id = (await context.params).id;
  const body = await request.json();
  const result = await prisma.document.updateMany({
    where: { id, userId },
    data: { title: body.title, templateId: body.templateId, accentColor: body.accentColor, language: body.language, content: body.content },
  });
  if (result.count === 0) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const document = await prisma.document.findFirst({ where: { id, userId } });
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return NextResponse.json(document);
}

export async function DELETE(_: Request, context: Context) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const result = await prisma.document.deleteMany({ where: { id: (await context.params).id, userId } });
  if (result.count === 0) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
