import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ChatBox from "@/components/ChatBox";

export const dynamic = "force-dynamic";

// 예약 채팅 화면 (여행자 ↔ 배정된 가이드)
export default async function ChatPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      travelerId: true,
      status: true,
      request: { select: { city: true, country: true } },
      guide: { select: { userId: true, user: { select: { name: true } } } },
      traveler: { select: { name: true } },
    },
  });
  if (!booking) notFound();
  const isTraveler = booking.travelerId === session.id;
  const isGuide = booking.guide.userId === session.id;
  if (!isTraveler && !isGuide) notFound();

  const otherName = isTraveler ? booking.guide.user.name : booking.traveler.name;

  return (
    <main className="page-shell narrow">
      <span className="eyebrow dark">CHAT</span>
      <h1>{otherName} 님과의 대화</h1>
      <p className="muted" style={{ marginBottom: 16 }}>{booking.request.city}, {booking.request.country}</p>
      <ChatBox bookingId={booking.id} disabled={booking.status === "CANCELLED"} />
    </main>
  );
}
