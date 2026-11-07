import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({ message: z.string().trim().max(500).optional() });

// 여행자: 긴급 알림(SOS)을 보냅니다. 관리자 "사고" 탭에 기록되고, 가이드에게는 채팅으로 알려집니다.
// 경찰·구급대를 직접 부르지는 않습니다. 긴급 번호는 화면에서 직접 걸어야 합니다.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, status: true, travelerId: true, guide: { select: { userId: true } } },
  });
  if (!booking || booking.travelerId !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "취소된 예약입니다." }, { status: 400 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  const note = parsed.success && parsed.data.message ? parsed.data.message : null;

  await prisma.$transaction(async (tx) => {
    await tx.incident.create({
      data: { bookingId: id, reporterId: user.id, type: "SOS", message: note, status: "OPEN" },
    });
    // 가이드에게 채팅으로 바로 알림
    await tx.message.create({
      data: {
        bookingId: id,
        senderId: user.id,
        body: `[긴급 알림 SOS] 여행자가 도움을 요청했습니다.${note ? ` 내용: ${note}` : ""} 가능하면 바로 연락해 주세요.`,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
