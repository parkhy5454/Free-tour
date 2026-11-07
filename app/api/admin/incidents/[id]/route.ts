import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({ note: z.string().trim().max(500).optional() });

// 관리자: 긴급 알림을 확인 처리합니다. 대응 내용을 메모로 남깁니다.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "관리자만 이용할 수 있습니다." }, { status: 403 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  const note = parsed.success ? parsed.data.note || null : null;

  const incident = await prisma.incident.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!incident) return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  if (incident.status === "RESOLVED") return NextResponse.json({ error: "이미 처리된 기록입니다." }, { status: 409 });

  await prisma.incident.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date(), adminNote: note },
  });
  return NextResponse.json({ ok: true });
}
