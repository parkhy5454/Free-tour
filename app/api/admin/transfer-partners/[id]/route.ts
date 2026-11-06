import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({ isActive: z.boolean() });

// 관리자: 파트너 승인(활성) 또는 비활성 처리
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "관리자만 이용할 수 있습니다." }, { status: 403 });

  const { id } = await params;
  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const partner = await prisma.transferPartner.findUnique({ where: { id }, select: { id: true } });
  if (!partner) return NextResponse.json({ error: "파트너를 찾을 수 없습니다." }, { status: 404 });

  await prisma.transferPartner.update({ where: { id }, data: { isActive: data.isActive } });
  return NextResponse.json({ ok: true });
}
