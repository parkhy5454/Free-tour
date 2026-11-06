import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReviewForm from "@/components/ReviewForm";

export const dynamic = "force-dynamic";

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { bookingId } = await searchParams;
  if (!bookingId) redirect("/bookings");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      request: { select: { city: true, country: true } },
      guide: { include: { user: { select: { name: true } } } },
      review: { select: { id: true } },
    },
  });

  // 본인 예약이 아니거나, 취소됐거나, 이미 후기가 있으면 예약 목록으로 돌려보냅니다.
  if (!booking || booking.travelerId !== session.id) redirect("/bookings");
  if (booking.status === "CANCELLED" || booking.review) redirect("/bookings");

  return (
    <main className="page-shell narrow">
      <span className="eyebrow dark">REVIEW</span>
      <h1>여행 후기 작성</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        솔직한 후기는 다른 여행자와 가이드 모두에게 도움이 됩니다.
      </p>
      <ReviewForm
        bookingId={booking.id}
        guideName={booking.guide.user.name}
        place={`${booking.request.city}, ${booking.request.country}`}
      />
    </main>
  );
}
