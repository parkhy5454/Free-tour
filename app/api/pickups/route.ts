import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCountry, zonedLocalToUtc } from "@/lib/countries";
import { priceInKrw } from "@/lib/points";
import { pickPartnerId } from "@/lib/pickupAssign";
import { partnerFeeSplit } from "@/lib/fees";

const createSchema = z.object({
  bookingId: z.string().min(1),
  airport: z.string().trim().min(2, "공항을 입력해 주세요.").max(100),
  flightNumber: z.string().trim().min(2, "항공편 번호를 입력해 주세요.").max(20),
  // datetime-local 입력값: "YYYY-MM-DDTHH:mm" (도착 국가의 현지 시각)
  arrivalLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "도착 일시를 입력해 주세요."),
  passengers: z.coerce.number().int().min(1, "인원은 1명 이상입니다.").max(20),
  luggageCount: z.coerce.number().int().min(0).max(30),
  pickupAddress: z.string().trim().min(5, "픽업 장소(호텔 주소 등)를 입력해 주세요.").max(300),
  note: z.string().trim().max(500).optional(),
  usePoints: z.coerce.number().int().min(0, "사용할 포인트는 0 이상이어야 합니다.").optional(),
});

// 트랜잭션 안에서 발생한 검증 오류 (사용자에게 그대로 보여 줌)
class PointError extends Error {}

// 여행자가 자신의 예약에 공항 픽업을 신청합니다. 예약당 1건만 가능합니다.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let data: z.infer<typeof createSchema>;
  try {
    data = createSchema.parse(await req.json());
  } catch (e: unknown) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: message || "입력값을 확인해 주세요." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    select: {
      id: true,
      travelerId: true,
      status: true,
      request: { select: { country: true } },
      pickup: { select: { id: true } },
    },
  });

  if (!booking || booking.travelerId !== session.id) {
    return NextResponse.json({ error: "픽업을 신청할 수 있는 예약이 아닙니다." }, { status: 403 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "취소된 예약에는 픽업을 신청할 수 없습니다." }, { status: 400 });
  }
  if (booking.pickup) {
    return NextResponse.json({ error: "이미 픽업을 신청한 예약입니다." }, { status: 409 });
  }

  const country = getCountry(booking.request.country);
  if (!country) {
    return NextResponse.json({ error: "이 국가는 아직 공항 픽업 서비스를 제공하지 않습니다." }, { status: 400 });
  }

  const arrivalAt = zonedLocalToUtc(data.arrivalLocal, country.timezone);
  if (Number.isNaN(arrivalAt.getTime())) {
    return NextResponse.json({ error: "도착 일시를 올바르게 입력해 주세요." }, { status: 400 });
  }

  const requestedPoints = data.usePoints ?? 0;

  try {
    const pickup = await prisma.$transaction(async (tx) => {
      // 보유 포인트는 트랜잭션 안에서 다시 계산합니다.
      const sum = await tx.pointLedger.aggregate({ where: { userId: session.id }, _sum: { amount: true } });
      const balance = sum._sum.amount ?? 0;

      if (requestedPoints > 0) {
        if (requestedPoints > balance) {
          throw new PointError(`보유 포인트(${balance.toLocaleString("ko-KR")}P)를 초과해서 사용할 수 없습니다.`);
        }
        // 한도: 픽업 요금의 원화 환산액 (고정 환율 기준)
        const priceKrw = priceInKrw(country.pickupPrice, country.currency);
        if (priceKrw === null) {
          throw new PointError("이 통화는 아직 포인트 환율이 설정되지 않았습니다.");
        }
        if (requestedPoints > priceKrw) {
          throw new PointError(`포인트는 픽업 요금(약 ${priceKrw.toLocaleString("ko-KR")}원)을 넘을 수 없습니다.`);
        }
      }

      // 같은 국가의 활성 파트너가 있으면 자동 배정합니다 (배정 대상 수락은 파트너가 합니다).
      const partnerId = await pickPartnerId(tx, country.name);

      const created = await tx.pickupRequest.create({
        data: {
          bookingId: booking.id,
          travelerId: session.id,
          country: country.name,
          airport: data.airport,
          flightNumber: data.flightNumber.toUpperCase(),
          arrivalAt,
          passengers: data.passengers,
          luggageCount: data.luggageCount,
          pickupAddress: data.pickupAddress,
          note: data.note || null,
          price: country.pickupPrice,
          ...partnerFeeSplit(country.pickupPrice),
          currency: country.currency,
          pointsUsed: requestedPoints,
          ...(partnerId && { partnerId, status: "ASSIGNED" as const }),
        },
        select: { id: true },
      });

      if (requestedPoints > 0) {
        await tx.pointLedger.create({
          data: {
            userId: session.id,
            amount: -requestedPoints,
            reason: "PICKUP_PAYMENT",
            bookingId: booking.id,
            note: `공항 픽업 요금 사용 (${country.label})`,
          },
        });
      }
      return created;
    });

    return NextResponse.json({ ok: true, id: pickup.id });
  } catch (e: unknown) {
    if (e instanceof PointError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "이미 픽업을 신청한 예약입니다." }, { status: 409 });
    }
    console.error("[api/pickups] 픽업 신청 저장 실패:", e);
    return NextResponse.json({ error: "픽업 신청 중 서버 오류가 발생했습니다." }, { status: 500 });
  }
}
