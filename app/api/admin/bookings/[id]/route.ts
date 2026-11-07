import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cancelBookingCore } from "@/lib/bookingCancel";

const schema = z.object({
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED"], { error: "변경할 수 없는 상태입니다." }),
});

// 관리자: 예약 상태 변경 (여행 완료 처리 → 여행자가 후기를 쓸 수 있게 됩니다)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "관리자만 이용할 수 있습니다." }, { status: 403 });

  const { id } = await params;
  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch (e: unknown) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: message || "입력값을 확인해 주세요." }, { status: 400 });
  }

  // 취소는 공통 취소 처리(환불 기록, 픽업·이동 정리, 포인트 환급)를 거칩니다.
  if (data.status === "CANCELLED") {
    const result = await cancelBookingCore(id, "ADMIN");
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, booking: { id, status: "CANCELLED" } });
  }

  const booking = await prisma.booking.findUnique({ where: { id }, select: { id: true } });
  if (!booking) return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: data.status },
    select: { id: true, status: true },
  });
  return NextResponse.json({ ok: true, booking: updated });
}
