import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { COUNTRY_NAMES } from "@/lib/countries";

const schema = z.object({
  name: z.string().trim().min(2, "업체명을 입력해 주세요.").max(100),
  country: z.enum(COUNTRY_NAMES, { error: "운송 서비스를 제공하는 국가를 선택해 주세요." }),
  phone: z.string().trim().min(6, "연락처를 입력해 주세요.").max(30),
  email: z.string().trim().email("이메일 형식이 올바르지 않습니다.").optional().or(z.literal("")),
});

// 누구나 로그인 후 픽업 파트너(운송 업체)에 신청할 수 있습니다.
// 신청은 "승인 대기" 상태로 들어가고, 관리자가 승인해야 배정 대상이 됩니다.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인 후 신청해 주세요." }, { status: 401 });

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch (e: unknown) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: message || "입력값을 확인해 주세요." }, { status: 400 });
  }

  const existing = await prisma.transferPartner.findUnique({ where: { userId: session.id }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "이미 파트너 신청을 하셨습니다." }, { status: 409 });
  }

  try {
    const partner = await prisma.transferPartner.create({
      data: {
        name: data.name,
        country: data.country,
        phone: data.phone,
        email: data.email || null,
        userId: session.id,
        isActive: false, // 관리자 승인 전까지 비활성
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: partner.id });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "이미 파트너 신청을 하셨습니다." }, { status: 409 });
    }
    console.error("[api/partner/apply] 신청 저장 실패:", e);
    return NextResponse.json({ error: "신청 처리 중 서버 오류가 발생했습니다." }, { status: 500 });
  }
}
