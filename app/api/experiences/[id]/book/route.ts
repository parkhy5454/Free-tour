import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "여행 날짜를 선택해 주세요."),
  partySize: z.coerce.number().int().min(1).max(30),
});

const PLATFORM_RATE = 0.18;

// 여행자: 체험 상품 예약. 여행 요청·견적·예약을 한 번에 만들고 바로 확정(결제 연동 전 상태)합니다.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch (e: unknown) {
    const message = e instanceof Error && "issues" in e ? (e as { issues: { message: string }[] }).issues[0]?.message : undefined;
    return NextResponse.json({ error: message || "입력값을 확인해 주세요." }, { status: 400 });
  }

  const startDate = new Date(`${data.startDate}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (Number.isNaN(startDate.getTime()) || startDate < today) {
    return NextResponse.json({ error: "오늘 이후 날짜를 선택해 주세요." }, { status: 400 });
  }

  const exp = await prisma.experience.findUnique({
    where: { id },
    select: { id: true, title: true, country: true, city: true, durationHours: true, price: true, currency: true, maxPeople: true, isActive: true, guideId: true, guide: { select: { userId: true } } },
  });
  if (!exp || !exp.isActive) return NextResponse.json({ error: "예약할 수 없는 체험입니다." }, { status: 404 });
  if (exp.guide.userId === session.id) return NextResponse.json({ error: "본인의 체험은 예약할 수 없습니다." }, { status: 400 });
  if (data.partySize > exp.maxPeople) return NextResponse.json({ error: `최대 ${exp.maxPeople}명까지 예약할 수 있습니다.` }, { status: 400 });

  const fee = Math.round(exp.price * PLATFORM_RATE);

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const request = await tx.tripRequest.create({
        data: {
          travelerId: session.id,
          country: exp.country,
          city: exp.city,
          startDate,
          hours: exp.durationHours,
          partySize: data.partySize,
          interests: [],
          details: `[체험 예약] ${exp.title}`,
          currency: exp.currency,
          status: "MATCHED",
        },
        select: { id: true },
      });
      const proposal = await tx.guideProposal.create({
        data: {
          requestId: request.id,
          guideId: exp.guideId,
          price: exp.price,
          currency: exp.currency,
          message: `체험 상품 "${exp.title}"을 고정 가격으로 예약했습니다.`,
          status: "ACCEPTED",
        },
        select: { id: true },
      });
      return tx.booking.create({
        data: {
          requestId: request.id,
          travelerId: session.id,
          guideId: exp.guideId,
          proposalId: proposal.id,
          amount: exp.price,
          currency: exp.currency,
          platformRate: PLATFORM_RATE,
          platformFee: fee,
          guidePayout: exp.price - fee,
          experienceId: exp.id,
        },
        select: { id: true },
      });
    });
    return NextResponse.json({ ok: true, bookingId: booking.id }, { status: 201 });
  } catch (e: unknown) {
    console.error("[api/experiences/book] 예약 저장 실패:", e);
    return NextResponse.json({ error: "예약 처리 중 서버 오류가 발생했습니다." }, { status: 500 });
  }
}
