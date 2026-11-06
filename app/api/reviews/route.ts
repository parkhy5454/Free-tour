import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1, "평점은 1~5점입니다.").max(5, "평점은 1~5점입니다."),
  comment: z.string().trim().min(10, "후기는 10자 이상 작성해 주세요.").max(1500, "후기는 1500자 이하로 작성해 주세요."),
});

// 여행자가 자신의 예약에 대해 후기를 작성합니다. 예약당 1개만 가능합니다.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let data: z.infer<typeof reviewSchema>;
  try {
    data = reviewSchema.parse(await req.json());
  } catch (e: unknown) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: message || "입력값을 확인해 주세요." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    select: { id: true, travelerId: true, status: true, review: { select: { id: true } } },
  });

  // 본인 예약이 아니면 존재 여부도 알려주지 않습니다.
  if (!booking || booking.travelerId !== session.id) {
    return NextResponse.json({ error: "후기를 작성할 수 있는 예약이 아닙니다." }, { status: 403 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "취소된 예약에는 후기를 작성할 수 없습니다." }, { status: 400 });
  }
  if (booking.review) {
    return NextResponse.json({ error: "이미 후기를 작성한 예약입니다." }, { status: 409 });
  }

  try {
    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        authorId: session.id,
        rating: data.rating,
        comment: data.comment,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: review.id });
  } catch (e: unknown) {
    // 동시에 두 번 제출된 경우 (bookingId unique 위반)
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "이미 후기를 작성한 예약입니다." }, { status: 409 });
    }
    console.error("[api/reviews] 후기 저장 실패:", e);
    return NextResponse.json({ error: "후기 저장 중 서버 오류가 발생했습니다." }, { status: 500 });
  }
}
