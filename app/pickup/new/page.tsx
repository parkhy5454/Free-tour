import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCountry } from "@/lib/countries";
import { KRW_PER_UNIT, priceInKrw } from "@/lib/points";
import PickupForm from "@/components/PickupForm";

export const dynamic = "force-dynamic";

export default async function NewPickupPage({
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
      pickup: { select: { id: true } },
    },
  });

  // 본인 예약이 아니거나, 취소됐거나, 이미 신청했거나, 서비스 국가가 아니면 예약 목록으로 돌려보냅니다.
  if (!booking || booking.travelerId !== session.id) redirect("/bookings");
  if (booking.status === "CANCELLED" || booking.pickup) redirect("/bookings");
  const country = getCountry(booking.request.country);
  if (!country) redirect("/bookings");

  const sum = await prisma.pointLedger.aggregate({
    where: { userId: session.id },
    _sum: { amount: true },
  });
  const balance = Math.max(0, sum._sum.amount ?? 0);
  const priceKrw = priceInKrw(country.pickupPrice, country.currency) ?? 0;

  return (
    <main className="page-shell narrow">
      <span className="eyebrow dark">AIRPORT PICKUP</span>
      <h1>공항 픽업 신청</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        도착 후 숙소까지 전문 운송 파트너가 이동을 도와드립니다. 가이드 일정과는 별도로 진행됩니다.
      </p>
      <PickupForm
        bookingId={booking.id}
        placeLabel={`${booking.request.city}, ${booking.request.country}`}
        price={country.pickupPrice}
        currency={country.currency}
        timezoneLabel={country.timezone}
        balance={balance}
        priceKrw={priceKrw}
        krwPerUnit={KRW_PER_UNIT[country.currency] ?? 1}
      />
    </main>
  );
}
