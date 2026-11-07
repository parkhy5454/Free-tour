// 예약 취소 공통 처리. 여행자·가이드·관리자 모든 취소 경로가 이 함수를 씁니다.
import { prisma } from "@/lib/prisma";
import { refundAmountFor } from "@/lib/cancellation";

export type CancelResult =
  | { ok: true; refundAmount: number; currency: string }
  | { ok: false; status: number; error: string };

export async function cancelBookingCore(bookingId: string, cancelledBy: "TRAVELER" | "GUIDE" | "ADMIN"): Promise<CancelResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      travelerId: true,
      request: { select: { startDate: true } },
      pickup: { select: { id: true, status: true, pointsUsed: true, travelerId: true } },
      transfers: { select: { id: true, status: true } },
    },
  });
  if (!booking) return { ok: false, status: 404, error: "예약을 찾을 수 없습니다." };
  if (booking.status === "CANCELLED") return { ok: false, status: 409, error: "이미 취소된 예약입니다." };
  if (booking.status === "COMPLETED") return { ok: false, status: 400, error: "완료된 여행은 취소할 수 없습니다." };

  const refund = refundAmountFor(booking.amount, booking.request.startDate, cancelledBy);

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelledBy, refundAmount: refund },
    });

    if (booking.pickup && (booking.pickup.status === "REQUESTED" || booking.pickup.status === "ASSIGNED")) {
      await tx.pickupRequest.update({ where: { id: booking.pickup.id }, data: { status: "CANCELLED" } });
      if (booking.pickup.pointsUsed > 0) {
        await tx.pointLedger.create({
          data: {
            userId: booking.pickup.travelerId,
            amount: booking.pickup.pointsUsed,
            reason: "PICKUP_REFUND",
            bookingId,
            note: "예약 취소로 픽업 사용 포인트 환급",
          },
        });
      }
    }

    const pendingTransferIds = booking.transfers.filter((t) => t.status === "REQUESTED" || t.status === "ASSIGNED").map((t) => t.id);
    if (pendingTransferIds.length) {
      await tx.hotelTransfer.updateMany({ where: { id: { in: pendingTransferIds } }, data: { status: "CANCELLED" } });
    }
  });

  return { ok: true, refundAmount: refund, currency: booking.currency };
}
