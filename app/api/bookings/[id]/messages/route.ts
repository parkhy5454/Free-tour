import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// 예약의 여행자와 가이드만 접근할 수 있도록 확인합니다.
async function loadParticipantBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, travelerId: true, guide: { select: { userId: true } } },
  });
  if (!booking) return null;
  const isParticipant = booking.travelerId === userId || booking.guide.userId === userId;
  return isParticipant ? booking : null;
}

// 메시지 목록. after(ISO 시각)를 주면 그 이후 메시지만 돌려줍니다 (폴링용).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const booking = await loadParticipantBooking(id, user.id);
  if (!booking) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const after = new URL(req.url).searchParams.get("after");
  const afterDate = after ? new Date(after) : null;
  const messages = await prisma.message.findMany({
    where: { bookingId: id, ...(afterDate && !Number.isNaN(afterDate.getTime()) && { createdAt: { gt: afterDate } }) },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, body: true, senderId: true, createdAt: true },
  });
  return NextResponse.json({ messages, me: user.id });
}

const postSchema = z.object({ text: z.string().trim().min(1, "메시지를 입력해 주세요.").max(1000) });

// 메시지 보내기
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const booking = await loadParticipantBooking(id, user.id);
  if (!booking) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  if (booking.status === "CANCELLED") return NextResponse.json({ error: "취소된 예약은 채팅할 수 없습니다." }, { status: 400 });

  let data: z.infer<typeof postSchema>;
  try {
    data = postSchema.parse(await req.json());
  } catch (e: unknown) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: message || "메시지를 확인해 주세요." }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { bookingId: id, senderId: user.id, body: data.text },
    select: { id: true, body: true, senderId: true, createdAt: true },
  });
  return NextResponse.json({ ok: true, message });
}
