import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCountry, formatInZone } from "@/lib/countries";
import { transferPriceFor } from "@/lib/transfers";
import PickupCancelButton from "@/components/PickupCancelButton";
import PickupReportButton from "@/components/PickupReportButton";
import TransferCancelButton from "@/components/TransferCancelButton";
import CancelBookingButton from "@/components/CancelBookingButton";
import { refundAmountFor } from "@/lib/cancellation";

export const dynamic = "force-dynamic";

const PICKUP_LABEL: Record<string, string> = {
  REQUESTED: "배정 대기",
  ASSIGNED: "배정 완료",
  IN_PROGRESS: "진행 중",
  COMPLETED: "완료",
  CANCELLED: "취소됨",
};

export default async function BookingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { OR: [{ travelerId: user.id }, { guide: { userId: user.id } }] },
    include: {
      request: true,
      guide: { include: { user: true } },
      traveler: true,
      experience: { select: { title: true } },
      transfers: {
        orderBy: { rideAt: "asc" },
        select: { id: true, status: true, fromAddress: true, toAddress: true, rideAt: true, vehiclePlate: true, vehicleSeats: true, partner: { select: { name: true, phone: true } } },
      },
      review: { select: { rating: true, comment: true } },
      pickup: {
        select: {
          id: true,
          status: true,
          airport: true,
          flightNumber: true,
          arrivalAt: true,
          price: true,
          currency: true,
          driverName: true,
          driverPhone: true,
          vehiclePlate: true,
          vehicleSeats: true,
          reportedAt: true,
          partner: { select: { name: true, phone: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="page-shell">
      <div className="dashboard-head">
        <div>
          <span className="eyebrow dark">BOOKINGS</span>
          <h1>예약 관리</h1>
          <p>예약 상태와 결제 진행 상황을 확인하세요.</p>
        </div>
      </div>

      <section className="dash-card">
        {bookings.length ? (
          bookings.map((b) => {
            const isTraveler = b.travelerId === user.id;
            const country = getCountry(b.request.country);
            const canReview = isTraveler && b.status === "COMPLETED" && !b.review;
            const canRequestPickup = isTraveler && b.status !== "CANCELLED" && !b.pickup && !!country;
            const p = b.pickup;
            const pickupCancellable = p && (p.status === "REQUESTED" || p.status === "ASSIGNED");

            return (
              <div className="request-row" key={b.id} style={{ alignItems: "flex-start" }}>
                <div>
                  <b>{b.request.city}, {b.request.country}</b>
                  {b.experience && <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>체험: {b.experience.title}</p>}
                  <p className="muted">여행자: {b.traveler.name} · 가이드: {b.guide.user.name}</p>
                  <p className="muted">
                    {b.amount.toLocaleString()} {b.currency} · 플랫폼 수수료 예정 {b.platformFee.toLocaleString()} {b.currency}
                  </p>

                  {p && country && (
                    <div style={{ marginTop: 8 }}>
                      <p className="muted">
                        ✈ 공항 픽업 · {PICKUP_LABEL[p.status] ?? p.status} · {p.airport} {p.flightNumber} · 도착 {formatInZone(p.arrivalAt, country.timezone)} ({country.label} 현지 시간)
                      </p>
                      {p.partner && (
                        <p className="muted">
                          운송 파트너: {p.partner.name} ({p.partner.phone})
                          {p.driverName && ` · 기사 ${p.driverName}${p.driverPhone ? ` ${p.driverPhone}` : ""}`}{p.vehiclePlate && ` · 차량 ${p.vehiclePlate}`}{p.vehicleSeats && ` · 탑승 가능 ${p.vehicleSeats}명`}
                        </p>
                      )}
                      {isTraveler && pickupCancellable && <PickupCancelButton pickupId={p.id} />}
                      {isTraveler && p.partner && p.status !== "CANCELLED" && <PickupReportButton pickupId={p.id} reported={!!p.reportedAt} />}
                    </div>
                  )}

                  {b.review && (
                    <p className="muted">
                      ★{b.review.rating} · {b.review.comment.length > 60 ? `${b.review.comment.slice(0, 60)}…` : b.review.comment}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                    {canRequestPickup && (
                      <Link href={`/pickup/new?bookingId=${b.id}`} className="text-link">공항 픽업 신청 →</Link>
                    )}
                    {canReview && (
                      <Link href={`/reviews/new?bookingId=${b.id}`} className="text-link">후기 작성 →</Link>
                    )}
                    {b.status !== "CANCELLED" && (
                      <Link href={`/chat/${b.id}`} className="text-link">채팅 →</Link>
                    )}
                    {(b.status === "CONFIRMED" || b.status === "PENDING_PAYMENT") && (
                      <CancelBookingButton
                        bookingId={b.id}
                        currency={b.currency}
                        estimatedRefund={refundAmountFor(b.amount, b.request.startDate, isTraveler ? "TRAVELER" : "GUIDE")}
                      />
                    )}
                    {isTraveler && b.status !== "CANCELLED" && !!transferPriceFor(b.request.country) && (
                      <Link href={`/transfer/new?bookingId=${b.id}`} className="text-link">이동 신청 →</Link>
                    )}
                    {isTraveler && b.status === "COMPLETED" && (
                      <Link
                        href={`/requests/new?country=${encodeURIComponent(b.request.country)}&city=${encodeURIComponent(b.request.city)}`}
                        className="text-link"
                      >
                        같은 여행지로 다시 예약 →
                      </Link>
                    )}
                  </div>
                </div>
                {b.transfers.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    {b.transfers.map((t) => (
                      <p key={t.id} className="muted" style={{ margin: "4px 0" }}>
                        🚗 이동 · {PICKUP_LABEL[t.status] ?? t.status} · {t.fromAddress} → {t.toAddress}
                        {t.partner && ` · 업체 ${t.partner.name} (${t.partner.phone})`}
                        {t.vehiclePlate && ` · 차량 ${t.vehiclePlate}`}
                        {t.vehicleSeats && ` · 탑승 가능 ${t.vehicleSeats}명`}
                      </p>
                    ))}
                    {b.transfers.filter((t) => t.status === "REQUESTED" || t.status === "ASSIGNED").map((t) => (
                      <div key={`cancel-${t.id}`} style={{ marginTop: 2 }}>
                        <TransferCancelButton transferId={t.id} />
                      </div>
                    ))}
                  </div>
                )}
                <span>{b.status} / {b.paymentStatus}</span>
                {b.status === "CANCELLED" && (
                  <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>
                    취소 {b.cancelledBy === "GUIDE" ? "(가이드)" : b.cancelledBy === "TRAVELER" ? "(여행자)" : ""} · 환불 예정 {b.refundAmount.toLocaleString("ko-KR")} {b.currency}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p className="muted">아직 예약이 없습니다. 여행 요청에 대한 견적을 수락하면 여기에 표시됩니다.</p>
        )}
      </section>

      <p className="muted">현재 버전은 예약 및 수수료 계산 단계입니다. 실제 카드 결제·환불·가이드 지급은 PG 및 국가별 정산 계약 연동 후 활성화됩니다.</p>
    </main>
  );
}
