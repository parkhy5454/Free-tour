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
  vehicleSeats: z.coerce.number().int().min(1).max(30).optional(),
});

// 파트너: 배정된 이동을 수락하고 진행 상태와 차량·기사 정보를 수정합니다. (픽업과 같은 규칙)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const partner = await prisma.transferPartner.findUnique({ where: { userId: session.id }, select: { id: true, isActive: true } });
  if (!partner || !partner.isActive) return NextResponse.json({ error: "파트너 계정이 비활성 상태입니다." }, { status: 403 });

  const { id } = await params;
  const transfer = await prisma.hotelTransfer.findUnique({
    where: { id },
    select: { id: true, partnerId: true, status: true, acceptedAt: true, passengers: true, vehiclePlate: true, vehicleSeats: true },
  });
  if (!transfer || transfer.partnerId !== partner.id) {
    return NextResponse.json({ error: "배정된 이동이 아닙니다." }, { status: 403 });
  }
  if (transfer.status === "CANCELLED" || transfer.status === "COMPLETED") {
    return NextResponse.json({ error: "종료된 이동은 수정할 수 없습니다." }, { status: 400 });
  }

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch (e: unknown) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: message || "입력값을 확인해 주세요." }, { status: 400 });
  }

  if (data.action === "accept") {
    if (transfer.status !== "ASSIGNED") return NextResponse.json({ error: "수락할 수 없는 상태입니다." }, { status: 400 });
    await prisma.hotelTransfer.update({ where: { id }, data: { acceptedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  if (!transfer.acceptedAt) return NextResponse.json({ error: "먼저 이동을 수락해 주세요." }, { status: 400 });

  const plateAfter = data.vehiclePlate !== undefined ? data.vehiclePlate : transfer.vehiclePlate;
  const seatsAfter = data.vehicleSeats !== undefined ? data.vehicleSeats : transfer.vehicleSeats;
  if (data.vehicleSeats !== undefined && data.vehicleSeats < transfer.passengers) {
    return NextResponse.json({ error: `이동 인원(${transfer.passengers}명)보다 탑승 가능 인원이 적습니다.` }, { status: 400 });
  }
  if (data.status === "IN_PROGRESS") {
    if (!plateAfter) return NextResponse.json({ error: "차량 번호를 입력해야 진행 중으로 바꿀 수 있습니다." }, { status: 400 });
    if (!seatsAfter) return NextResponse.json({ error: "탑승 가능 인원을 입력해야 진행 중으로 바꿀 수 있습니다." }, { status: 400 });
    if (seatsAfter < transfer.passengers) return NextResponse.json({ error: "탑승 가능 인원이 이동 인원보다 적습니다." }, { status: 400 });
  }

  const updated = await prisma.hotelTransfer.update({
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
  return NextResponse.json({ ok: true, transfer: updated });
}
