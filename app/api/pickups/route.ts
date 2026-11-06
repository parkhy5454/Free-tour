import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCountry, zonedLocalToUtc } from "@/lib/countries";

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
});

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

  try {
    const pickup = await prisma.pickupRequest.create({
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
        currency: country.currency,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: pickup.id });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "이미 픽업을 신청한 예약입니다." }, { status: 409 });
    }
    console.error("[api/pickups] 픽업 신청 저장 실패:", e);
    return NextResponse.json({ error: "픽업 신청 중 서버 오류가 발생했습니다." }, { status: 500 });
  }
}
