import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { refundAmountFor } from "@/lib/cancellation";

// 예약 취소. 여행자 또는 가이드가 취소할 수 있고, 환불 금액은 취소 규정으로 계산해 기록합니다.
// 실제 환불 송금은 결제 연동 이후에 처리합니다.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      travelerId: true,
      guide: { select: { userId: true } },
      request: { select: { startDate: true } },
      pickup: { select: { id: true, status: true, pointsUsed: true, travelerId: true } },
      transfers: { select: { id: true, status: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });

  const isTraveler = booking.travelerId === user.id;
  const isGuide = booking.guide.userId === user.id;
  if (!isTraveler && !isGuide) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  if (booking.status === "CANCELLED") return NextResponse.json({ error: "이미 취소된 예약입니다." }, { status: 409 });
  if (booking.status === "COMPLETED") return NextResponse.json({ error: "완료된 여행은 취소할 수 없습니다." }, { status: 400 });

  const cancelledBy = isGuide ? "GUIDE" : "TRAVELER";
  const refund = refundAmountFor(booking.amount, booking.request.startDate, cancelledBy);

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelledBy, refundAmount: refund },
    });

    // 함께 신청된 픽업: 진행 전이면 취소하고, 사용한 포인트는 환급
    if (booking.pickup && (booking.pickup.status === "REQUESTED" || booking.pickup.status === "ASSIGNED")) {
      await tx.pickupRequest.update({ where: { id: booking.pickup.id }, data: { status: "CANCELLED" } });
      if (booking.pickup.pointsUsed > 0) {
        await tx.pointLedger.create({
          data: {
            userId: booking.pickup.travelerId,
            amount: booking.pickup.pointsUsed,
            reason: "PICKUP_REFUND",
            bookingId: id,
            note: "예약 취소로 픽업 사용 포인트 환급",
          },
        });
      }
    }

    // 함께 신청된 이동: 진행 전이면 취소
    const pendingTransferIds = booking.transfers.filter((t) => t.status === "REQUESTED" || t.status === "ASSIGNED").map((t) => t.id);
    if (pendingTransferIds.length) {
      await tx.hotelTransfer.updateMany({ where: { id: { in: pendingTransferIds } }, data: { status: "CANCELLED" } });
    }
  });

  return NextResponse.json({ ok: true, refundAmount: refund, currency: booking.currency });
}
