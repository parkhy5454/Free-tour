import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const createSchema = z.object({
  title: z.string().trim().min(3, "체험 이름은 3자 이상 입력해 주세요.").max(100),
  description: z.string().trim().min(20, "체험 설명은 20자 이상 입력해 주세요.").max(1500),
  durationHours: z.coerce.number().int().min(1).max(12),
  price: z.coerce.number().int().min(1000, "가격은 1,000원 이상입니다.").max(100000000),
  maxPeople: z.coerce.number().int().min(1).max(30),
});

// 가이드: 체험 상품 등록 (도시·국가는 가이드 프로필 기준)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const guide = await prisma.guideProfile.findUnique({ where: { userId: session.id }, select: { id: true, country: true, city: true } });
  if (!guide) return NextResponse.json({ error: "가이드 프로필을 먼저 등록해 주세요." }, { status: 403 });

  let data: z.infer<typeof createSchema>;
  try {
    data = createSchema.parse(await req.json());
  } catch (e: unknown) {
    const message = e instanceof Error && "issues" in e ? (e as { issues: { message: string }[] }).issues[0]?.message : undefined;
    return NextResponse.json({ error: message || "입력값을 확인해 주세요." }, { status: 400 });
  }

  const exp = await prisma.experience.create({
    data: { ...data, guideId: guide.id, country: guide.country, city: guide.city },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: exp.id });
}

// 공개 목록: 판매 중인 체험만
export async function GET() {
  const experiences = await prisma.experience.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, city: true, country: true, durationHours: true, price: true, currency: true, guide: { select: { user: { select: { name: true } } } } },
  });
  return NextResponse.json({ experiences });
}
