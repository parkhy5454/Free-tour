import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { id } = await params;
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const proposal = await tx.guideProposal.findUnique({ where: { id }, include: { request: true } });
      if (!proposal || proposal.request.travelerId !== user.id) throw new Error("NOT_FOUND");
      if (proposal.status !== "PENDING" || proposal.request.status !== "OPEN") throw new Error("NOT_OPEN");
      const fee = Math.round(proposal.price * 0.18);
      const created = await tx.booking.create({ data: {
        requestId: proposal.requestId, travelerId: user.id, guideId: proposal.guideId,
        proposalId: proposal.id, amount: proposal.price, currency: proposal.currency,
        platformRate: 0.18, platformFee: fee, guidePayout: proposal.price - fee
      } });
      await tx.guideProposal.update({ where: { id }, data: { status: "ACCEPTED" } });
      await tx.guideProposal.updateMany({ where: { requestId: proposal.requestId, id: { not: id }, status: "PENDING" }, data: { status: "DECLINED" } });
      await tx.tripRequest.update({ where: { id: proposal.requestId }, data: { status: "MATCHED" } });
      return created;
    });
    return NextResponse.json({ ok: true, bookingId: booking.id, paymentStatus: booking.paymentStatus, message: "예약이 생성되었습니다. 실제 결제 연동 전이므로 결제 완료 상태는 아닙니다." }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "ERROR";
    const status = message === "NOT_FOUND" ? 404 : message === "NOT_OPEN" ? 409 : 400;
    return NextResponse.json({ error: status === 404 ? "견적을 찾을 수 없습니다." : "이미 처리된 여행 요청입니다." }, { status });
  }
}
