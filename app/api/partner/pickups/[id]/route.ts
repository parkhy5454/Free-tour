import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  action: z.literal("accept").optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED"]).optional(),
  driverName: z.string().trim().max(60).optional(),
  driverPhone: z.string().trim().max(30).optional(),
  vehiclePlate: z.string().trim().max(20).optional(),
  vehicleSeats: z.coerce.number().int().min(1, "탑승 가능 인원은 1명 이상입니다.").max(30).optional(),
});

// 파트너: 배정된 픽업을 수락하고, 진행 상태와 차량·기사 정보를 수정합니다.
// 여행자 연락처와 주소는 수락한 뒤에만 보이므로, 수락 전에는 진행 상태를 바꿀 수 없습니다.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const partner = await prisma.transferPartner.findUnique({
    where: { userId: session.id },
    select: { id: true, isActive: true },
  });
  if (!partner || !partner.isActive) {
    return NextResponse.json({ error: "파트너 계정이 비활성 상태입니다." }, { status: 403 });
  }

  const { id } = await params;
  const pickup = await prisma.pickupRequest.findUnique({
    where: { id },
    select: {
      id: true,
      partnerId: true,
      status: true,
      acceptedAt: true,
      passengers: true,
      vehiclePlate: true,
      vehicleSeats: true,
    },
  });
  if (!pickup || pickup.partnerId !== partner.id) {
    return NextResponse.json({ error: "배정된 픽업이 아닙니다." }, { status: 403 });
  }
  if (pickup.status === "CANCELLED" || pickup.status === "COMPLETED") {
    return NextResponse.json({ error: "종료된 픽업은 수정할 수 없습니다." }, { status: 400 });
  }

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch (e: unknown) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: message || "입력값을 확인해 주세요." }, { status: 400 });
  }

  // 수락: 배정된 픽업을 파트너가 확정합니다.
  if (data.action === "accept") {
    if (pickup.status !== "ASSIGNED") {
      return NextResponse.json({ error: "수락할 수 없는 상태입니다." }, { status: 400 });
    }
    const accepted = await prisma.pickupRequest.update({
      where: { id },
      data: { acceptedAt: new Date() },
      select: { id: true, status: true },
    });
    return NextResponse.json({ ok: true, pickup: accepted });
  }

  // 이후 항목은 수락한 뒤에만 수정할 수 있습니다.
  if (!pickup.acceptedAt) {
    return NextResponse.json({ error: "먼저 픽업을 수락해 주세요." }, { status: 400 });
  }

  // 차량 정보는 여행자가 차량을 확인하는 용도이므로, 진행 중으로 바꾸기 전에 반드시 입력해야 합니다.
  const plateAfter = data.vehiclePlate !== undefined ? data.vehiclePlate : pickup.vehiclePlate;
  const seatsAfter = data.vehicleSeats !== undefined ? data.vehicleSeats : pickup.vehicleSeats;
  if (data.status === "IN_PROGRESS") {
    if (!plateAfter) {
      return NextResponse.json({ error: "차량 번호를 입력해야 진행 중으로 바꿀 수 있습니다." }, { status: 400 });
    }
    if (!seatsAfter) {
      return NextResponse.json({ error: "탑승 가능 인원을 입력해야 진행 중으로 바꿀 수 있습니다." }, { status: 400 });
    }
    if (seatsAfter < pickup.passengers) {
      return NextResponse.json(
        { error: `이 차량은 ${seatsAfter}명까지 탑승할 수 있지만, 여행자 인원은 ${pickup.passengers}명입니다. 더 큰 차량을 배정해 주세요.` },
        { status: 400 }
      );
    }
  }
  if (data.vehicleSeats !== undefined && data.vehicleSeats < pickup.passengers) {
    return NextResponse.json(
      { error: `여행자 인원(${pickup.passengers}명)보다 탑승 가능 인원이 적습니다. 차량을 확인해 주세요.` },
      { status: 400 }
    );
  }

  const updated = await prisma.pickupRequest.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.driverName !== undefined && { driverName: data.driverName || null }),
      ...(data.driverPhone !== undefined && { driverPhone: data.driverPhone || null }),
      ...(data.vehiclePlate !== undefined && { vehiclePlate: data.vehiclePlate.toUpperCase() || null }),
      ...(data.vehicleSeats !== undefined && { vehicleSeats: data.vehicleSeats }),
    },
    select: { id: true, status: true },
  });
  return NextResponse.json({ ok: true, pickup: updated });
}
