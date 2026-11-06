import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCountry, formatInZone } from "@/lib/countries";
import PickupCancelButton from "@/components/PickupCancelButton";

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
            const canReview = isTraveler && b.status !== "CANCELLED" && !b.review;
            const canRequestPickup = isTraveler && b.status !== "CANCELLED" && !b.pickup && !!country;
            const p = b.pickup;
            const pickupCancellable = p && (p.status === "REQUESTED" || p.status === "ASSIGNED");

            return (
              <div className="request-row" key={b.id} style={{ alignItems: "flex-start" }}>
                <div>
                  <b>{b.request.city}, {b.request.country}</b>
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
                          {p.driverName && ` · 기사 ${p.driverName}${p.driverPhone ? ` ${p.driverPhone}` : ""}`}
                        </p>
                      )}
                      {isTraveler && pickupCancellable && <PickupCancelButton pickupId={p.id} />}
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
                  </div>
                </div>
                <span>{b.status} / {b.paymentStatus}</span>
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
