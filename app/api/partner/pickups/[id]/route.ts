import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  status: z.enum(["IN_PROGRESS", "COMPLETED"]).optional(),
  driverName: z.string().trim().max(60).optional(),
  driverPhone: z.string().trim().max(30).optional(),
});

// 파트너: 본인 업체에 배정된 픽업의 진행 상태와 기사 정보를 수정합니다.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const partner = await prisma.transferPartner.findUnique({
    where: { userId: session.id },
    select: { id: true, isActive: true },
  });
  if (!partner || !partner.isActive) {
    return NextResponse.json({ error: "승인된 파트너만 이용할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const pickup = await prisma.pickupRequest.findUnique({
    where: { id },
    select: { id: true, partnerId: true, status: true },
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

  const updated = await prisma.pickupRequest.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.driverName !== undefined && { driverName: data.driverName || null }),
      ...(data.driverPhone !== undefined && { driverPhone: data.driverPhone || null }),
    },
    select: { id: true, status: true },
  });
  return NextResponse.json({ ok: true, pickup: updated });
}
