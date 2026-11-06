import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("requestId");
  const proposals = await prisma.guideProposal.findMany({
    where: { request: { travelerId: user.id }, ...(requestId ? { requestId } : {}) },
    include: { guide: { include: { user: { select: { name: true } } } }, request: { select: { city: true, country: true, travelerId: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ proposals });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const parsed = z.object({ requestId: z.string().min(1), price: z.number().int().positive().max(100000000), currency: z.string().length(3), message: z.string().min(10).max(2000) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "입력값을 확인해 주세요." }, { status: 400 });
  const profile = await prisma.guideProfile.findUnique({ where: { userId: user.id } });
  if (!profile || !profile.isPublished) return NextResponse.json({ error: "공개된 가이드 프로필이 필요합니다." }, { status: 403 });
  const request = await prisma.tripRequest.findUnique({ where: { id: parsed.data.requestId } });
  if (!request || request.status !== "OPEN" || request.travelerId === user.id) return NextResponse.json({ error: "제안할 수 없는 여행 요청입니다." }, { status: 404 });
  try {
    const proposal = await prisma.guideProposal.create({ data: { ...parsed.data, guideId: profile.id } });
    return NextResponse.json({ ok: true, id: proposal.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "이미 해당 요청에 견적을 제출했거나 등록할 수 없습니다." }, { status: 409 });
  }
}
