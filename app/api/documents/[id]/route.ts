import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Context) { return NextResponse.json(await prisma.document.findUniqueOrThrow({ where: { id: (await context.params).id } })); }
export async function PATCH(request: Request, context: Context) { const id = (await context.params).id; const body = await request.json(); const document = await prisma.document.update({ where: { id }, data: { title: body.title, templateId: body.templateId, accentColor: body.accentColor, language: body.language, content: body.content } }); return NextResponse.json(document); }
export async function DELETE(_: Request, context: Context) { await prisma.document.delete({ where: { id: (await context.params).id } }); return new Response(null, { status: 204 }); }
