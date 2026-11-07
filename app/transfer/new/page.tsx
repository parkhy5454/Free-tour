import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCountry } from "@/lib/countries";
import { transferPriceFor } from "@/lib/transfers";
import TransferForm from "@/components/TransferForm";

export const dynamic = "force-dynamic";

// 여행 중 호텔·장소 간 이동 신청
export default async function NewTransferPage({
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
    include: { request: { select: { city: true, country: true } } },
  });
  if (!booking || booking.travelerId !== session.id || booking.status === "CANCELLED") redirect("/bookings");

  const country = getCountry(booking.request.country);
  const fee = transferPriceFor(booking.request.country);
  if (!country || !fee) redirect("/bookings");

  return (
    <main className="page-shell narrow">
      <span className="eyebrow dark">IN-TRIP TRANSFER</span>
      <h1>이동 신청</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        호텔이나 여행지 사이를 이동할 때 차량과 기사를 배정해 드립니다. 가이드 일정과는 별도로 진행됩니다.
      </p>
      <TransferForm
        bookingId={booking.id}
        placeLabel={`${booking.request.city}, ${booking.request.country}`}
        price={fee.price}
        currency={fee.currency}
        timezoneLabel={country.timezone}
      />
    </main>
  );
}
