import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({ action: z.literal("cancel") });

// 여행자: 아직 진행 전인 이동을 취소합니다.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const transfer = await prisma.hotelTransfer.findUnique({ where: { id }, select: { id: true, travelerId: true, status: true } });
  if (!transfer || transfer.travelerId !== session.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  if (transfer.status !== "REQUESTED" && transfer.status !== "ASSIGNED") {
    return NextResponse.json({ error: "진행 중이거나 완료된 이동은 취소할 수 없습니다." }, { status: 400 });
  }
  await prisma.hotelTransfer.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ ok: true });
}
