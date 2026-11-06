import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
            const canReview = isTraveler && b.status !== "CANCELLED" && !b.review;
            return (
              <div className="request-row" key={b.id} style={{ alignItems: "flex-start" }}>
                <div>
                  <b>{b.request.city}, {b.request.country}</b>
                  <p className="muted">여행자: {b.traveler.name} · 가이드: {b.guide.user.name}</p>
                  <p className="muted">
                    {b.amount.toLocaleString()} {b.currency} · 플랫폼 수수료 예정 {b.platformFee.toLocaleString()} {b.currency}
                  </p>
                  {b.review && (
                    <p className="muted">
                      ★{b.review.rating} · {b.review.comment.length > 60 ? `${b.review.comment.slice(0, 60)}…` : b.review.comment}
                    </p>
                  )}
                  {canReview && (
                    <p>
                      <Link href={`/reviews/new?bookingId=${b.id}`} className="text-link">후기 작성 →</Link>
                    </p>
                  )}
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
