import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, createSession } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().trim().min(2, "이름은 2자 이상이어야 합니다.").max(80),
  country: z.string().trim().max(100).optional(),
  language: z.enum(["ko", "en"]),
});

// 내 정보 수정: 이름, 거주 국가, 언어만 변경 가능 (역할/이메일은 변경 불가)
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let data: z.infer<typeof updateSchema>;
  try {
    data = updateSchema.parse(await req.json());
  } catch (e: unknown) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: message || "입력값을 확인해 주세요." }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        name: data.name,
        country: data.country || null,
        language: data.language,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    // 세션 쿠키 안의 이름도 갱신
    await createSession(user);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[api/me] 내 정보 수정 실패:", e);
    return NextResponse.json({ error: "저장 중 서버 오류가 발생했습니다." }, { status: 500 });
  }
}
