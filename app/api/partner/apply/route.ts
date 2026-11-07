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
  businessNumber: z.string().trim().min(5, "사업자등록번호를 입력해 주세요.").max(30),
  licenseNumber: z.string().trim().min(3, "운송 면허 번호를 입력해 주세요.").max(50),
  vehiclePlates: z
    .array(z.string().trim().min(2).max(20))
    .min(1, "차량 번호를 한 대 이상 입력해 주세요.")
    .max(30),
  agreeTerms: z.literal(true, { error: "약관에 동의해 주세요." }),
});

// 로그인한 누구나 파트너로 바로 등록됩니다 (관리자 승인 없음).
// 대신 사업자·면허·차량 정보와 약관 동의를 받고, 신고가 쌓이면 자동으로 배정이 중단됩니다.
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
    return NextResponse.json({ error: "이미 파트너로 등록되어 있습니다." }, { status: 409 });
  }

  const plates = data.vehiclePlates.map((p) => p.toUpperCase());

  try {
    const partner = await prisma.transferPartner.create({
      data: {
        name: data.name,
        country: data.country,
        phone: data.phone,
        email: data.email || null,
        userId: session.id,
        businessNumber: data.businessNumber,
        licenseNumber: data.licenseNumber,
        vehiclePlates: plates,
        termsAgreedAt: new Date(),
        isActive: true, // 승인 절차 없이 바로 활성화
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: partner.id });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "이미 파트너로 등록되어 있습니다." }, { status: 409 });
    }
    console.error("[api/partner/apply] 등록 저장 실패:", e);
    return NextResponse.json({ error: "등록 처리 중 서버 오류가 발생했습니다." }, { status: 500 });
  }
}
