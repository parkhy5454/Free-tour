import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { COUNTRY_NAMES } from "@/lib/countries";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
  if (session.role !== "ADMIN") return { error: NextResponse.json({ error: "관리자만 이용할 수 있습니다." }, { status: 403 }) };
  return { session };
}

// 픽업 파트너(운송 업체) 목록
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const partners = await prisma.transferPartner.findMany({ orderBy: [{ country: "asc" }, { name: "asc" }] });
  return NextResponse.json({ partners });
}

const createSchema = z.object({
  name: z.string().trim().min(2, "업체명을 입력해 주세요.").max(100),
  country: z.enum(COUNTRY_NAMES, { error: "지원하는 국가를 선택해 주세요." }),
  phone: z.string().trim().min(6, "연락처를 입력해 주세요.").max(30),
  email: z.string().trim().email("이메일 형식이 올바르지 않습니다.").optional().or(z.literal("")),
});

// 픽업 파트너 등록
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let data: z.infer<typeof createSchema>;
  try {
    data = createSchema.parse(await req.json());
  } catch (e: unknown) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: message || "입력값을 확인해 주세요." }, { status: 400 });
  }

  const partner = await prisma.transferPartner.create({
    data: {
      name: data.name,
      country: data.country,
      phone: data.phone,
      email: data.email || null,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: partner.id });
}
