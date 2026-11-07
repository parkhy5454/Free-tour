import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { REPORT_LIMIT } from "@/lib/pickupAssign";

// 여행자: 배정된 파트너에 문제를 신고합니다. 한 픽업당 한 번만 가능합니다.
// 신고가 REPORT_LIMIT 이상 쌓이면 파트너는 자동으로 비활성화되어 더 이상 배정되지 않습니다.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const pickup = await prisma.pickupRequest.findUnique({
    where: { id },
    select: { id: true, travelerId: true, partnerId: true, reportedAt: true },
  });
  if (!pickup || pickup.travelerId !== session.id) {
    return NextResponse.json({ error: "신고할 수 있는 픽업이 아닙니다." }, { status: 403 });
  }
  if (!pickup.partnerId) {
    return NextResponse.json({ error: "배정된 업체가 없습니다." }, { status: 400 });
  }
  if (pickup.reportedAt) {
    return NextResponse.json({ error: "이미 신고한 픽업입니다." }, { status: 409 });
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.pickupRequest.update({ where: { id }, data: { reportedAt: new Date() } });
    const partner = await tx.transferPartner.update({
      where: { id: pickup.partnerId as string },
      data: { reportCount: { increment: 1 } },
      select: { reportCount: true },
    });
    if (partner.reportCount >= REPORT_LIMIT) {
      await tx.transferPartner.update({
        where: { id: pickup.partnerId as string },
        data: { isActive: false },
      });
    }
    return partner;
  });

  return NextResponse.json({ ok: true, suspended: result.reportCount >= REPORT_LIMIT });
}
