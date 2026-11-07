import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cancelBookingCore } from "@/lib/bookingCancel";

// 여행자 또는 가이드가 예약을 취소합니다. 환불 금액은 취소 규정으로 계산해 기록합니다.
// 실제 환불 송금은 결제 연동 이후에 처리합니다.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { travelerId: true, guide: { select: { userId: true } } },
  });
  if (!booking) return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });

  const isTraveler = booking.travelerId === user.id;
  const isGuide = booking.guide.userId === user.id;
  if (!isTraveler && !isGuide) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const result = await cancelBookingCore(id, isGuide ? "GUIDE" : "TRAVELER");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, refundAmount: result.refundAmount, currency: result.currency });
}
