import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const PICKUP_STATUSES = ["REQUESTED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

// 관리자: 파트너·기사 배정, 상태 변경
const adminSchema = z.object({
  status: z.enum(PICKUP_STATUSES).optional(),
  partnerId: z.string().min(1).nullable().optional(),
  driverName: z.string().trim().max(60).nullable().optional(),
  driverPhone: z.string().trim().max(30).nullable().optional(),
});

// 여행자: 신청 취소 (배정 전 또는 배정 완료 상태에서만)
const travelerSchema = z.object({ action: z.literal("cancel") });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const pickup = await prisma.pickupRequest.findUnique({
    where: { id },
    select: { id: true, bookingId: true, travelerId: true, country: true, status: true, pointsUsed: true },
  });
  if (!pickup) return NextResponse.json({ error: "픽업 신청을 찾을 수 없습니다." }, { status: 404 });

  const body = await req.json().catch(() => null);

  // 관리자 처리
  if (session.role === "ADMIN") {
    const parsed = adminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "입력값을 확인해 주세요." }, { status: 400 });
    }
    const d = parsed.data;

    if (d.partnerId) {
      const partner = await prisma.transferPartner.findUnique({
        where: { id: d.partnerId },
        select: { country: true, isActive: true },
      });
      if (!partner || !partner.isActive || partner.country !== pickup.country) {
        return NextResponse.json({ error: "해당 국가의 활성 파트너가 아닙니다." }, { status: 400 });
      }
    }

    // 파트너를 처음 배정하면 자동으로 "배정 완료"로 바꿉니다. 상태를 직접 지정하면 그 값을 우선합니다.
    const nextStatus =
      d.status ?? (d.partnerId && pickup.status === "REQUESTED" ? "ASSIGNED" : undefined);

    const updated = await updatePickup(pickup, {
      ...(d.partnerId !== undefined && { partnerId: d.partnerId }),
      ...(d.driverName !== undefined && { driverName: d.driverName || null }),
      ...(d.driverPhone !== undefined && { driverPhone: d.driverPhone || null }),
      ...(nextStatus && { status: nextStatus }),
    }, nextStatus);
    return NextResponse.json({ ok: true, pickup: updated });
  }

  // 여행자 처리 (본인 신청만)
  if (pickup.travelerId !== session.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const parsed = travelerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (pickup.status !== "REQUESTED" && pickup.status !== "ASSIGNED") {
    return NextResponse.json({ error: "진행 중이거나 완료된 픽업은 취소할 수 없습니다. 고객센터에 문의해 주세요." }, { status: 400 });
  }

  const updated = await updatePickup(pickup, { status: "CANCELLED" }, "CANCELLED");
  return NextResponse.json({ ok: true, pickup: updated });
}

// 픽업 수정. 취소로 바뀌면서 포인트를 사용했다면 같은 트랜잭션에서 환급합니다.
async function updatePickup(
  pickup: { id: string; bookingId: string; status: string; pointsUsed: number; travelerId: string },
  data: Record<string, unknown>,
  nextStatus: string | undefined
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.pickupRequest.update({
      where: { id: pickup.id },
      data,
      select: { id: true, status: true },
    });

    const becameCancelled = nextStatus === "CANCELLED" && pickup.status !== "CANCELLED";
    if (becameCancelled && pickup.pointsUsed > 0) {
      await tx.pointLedger.create({
        data: {
          userId: pickup.travelerId,
          amount: pickup.pointsUsed,
          reason: "PICKUP_REFUND",
          bookingId: pickup.bookingId,
          note: "공항 픽업 취소로 사용 포인트 환급",
        },
      });
    }
    return updated;
  });
}
