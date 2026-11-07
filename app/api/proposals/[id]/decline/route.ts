import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// 여행자: 받은 가이드 견적을 거절합니다. 대기 중인 견적만 거절할 수 있습니다.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const proposal = await prisma.guideProposal.findUnique({
    where: { id },
    select: { id: true, status: true, request: { select: { travelerId: true } } },
  });
  if (!proposal || proposal.request.travelerId !== user.id) {
    return NextResponse.json({ error: "견적을 찾을 수 없습니다." }, { status: 404 });
  }
  if (proposal.status !== "PENDING") {
    return NextResponse.json({ error: "이미 처리된 견적입니다." }, { status: 409 });
  }

  await prisma.guideProposal.update({ where: { id }, data: { status: "DECLINED" } });
  return NextResponse.json({ ok: true });
}
