import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { COUNTRY_NAMES } from "@/lib/countries";

const splitList = (value: string) => value.split(",").map((x) => x.trim()).filter(Boolean);

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "먼저 회원가입 또는 로그인해 주세요." }, { status: 401 });

  try {
    const d = z.object({
      headline: z.string().min(4).max(120),
      bio: z.string().min(20).max(3000),
      country: z.enum(COUNTRY_NAMES, { error: "지원하지 않는 국가입니다. 목록에서 선택해 주세요." }),
      city: z.string().min(2),
      languages: z.string(),
      specialties: z.string(),
      hourlyRate: z.coerce.number().int().positive(),
      currency: z.string().length(3),
      phone: z.string().trim().min(6, "연락처를 입력해 주세요.").max(30),
    }).parse(await req.json());

    const data = {
      headline: d.headline,
      bio: d.bio,
      country: d.country,
      city: d.city,
      hourlyRate: d.hourlyRate,
      currency: d.currency,
      phone: d.phone,
      languages: splitList(d.languages),
      specialties: splitList(d.specialties),
    };

    const profile = await prisma.guideProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });

    // 여행자만 가이드로 승격합니다. 관리자 권한이 가이드로 덮어써지지 않도록 조건을 둡니다.
    await prisma.user.updateMany({
      where: { id: user.id, role: "TRAVELER" },
      data: { role: "GUIDE" },
    });

    return NextResponse.json({ ok: true, id: profile.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.issues?.[0]?.message || "프로필을 등록하지 못했습니다." }, { status: 400 });
  }
}
