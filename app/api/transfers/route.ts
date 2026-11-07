import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCountry, zonedLocalToUtc } from "@/lib/countries";
import { transferPriceFor } from "@/lib/transfers";
import { pickPartnerId } from "@/lib/pickupAssign";

const createSchema = z.object({
  bookingId: z.string().min(1),
  fromAddress: z.string().trim().min(5, "출발지를 정확히 입력해 주세요.").max(300),
  toAddress: z.string().trim().min(5, "도착지를 정확히 입력해 주세요.").max(300),
  rideLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "이동 일시를 입력해 주세요."),
  passengers: z.coerce.number().int().min(1).max(20),
  luggageCount: z.coerce.number().int().min(0).max(30),
  note: z.string().trim().max(500).optional(),
});

// 여행자: 예약에 대해 호텔·장소 간 이동을 신청합니다. 같은 국가의 활성 파트너에게 자동 배정됩니다.
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
    select: { id: true, travelerId: true, status: true, request: { select: { country: true } } },
  });
  if (!booking || booking.travelerId !== session.id) {
    return NextResponse.json({ error: "이동을 신청할 수 있는 예약이 아닙니다." }, { status: 403 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "취소된 예약에는 이동을 신청할 수 없습니다." }, { status: 400 });
  }

  const country = getCountry(booking.request.country);
  const fee = transferPriceFor(booking.request.country);
  if (!country || !fee) {
    return NextResponse.json({ error: "이 국가는 아직 이동 서비스를 제공하지 않습니다." }, { status: 400 });
  }

  const rideAt = zonedLocalToUtc(data.rideLocal, country.timezone);
  if (Number.isNaN(rideAt.getTime())) {
    return NextResponse.json({ error: "이동 일시를 올바르게 입력해 주세요." }, { status: 400 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const partnerId = await pickPartnerId(tx, booking.request.country);
      return tx.hotelTransfer.create({
        data: {
          bookingId: booking.id,
          travelerId: session.id,
          country: booking.request.country,
          fromAddress: data.fromAddress,
          toAddress: data.toAddress,
          rideAt,
          passengers: data.passengers,
          luggageCount: data.luggageCount,
          note: data.note || null,
          price: fee.price,
          currency: fee.currency,
          ...(partnerId && { partnerId, status: "ASSIGNED" as const }),
        },
        select: { id: true },
      });
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: unknown) {
    console.error("[api/transfers] 이동 신청 저장 실패:", e);
    return NextResponse.json({ error: "이동 신청 중 서버 오류가 발생했습니다." }, { status: 500 });
  }
}
