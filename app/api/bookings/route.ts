import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const bookings = await prisma.booking.findMany({
    where: { OR: [{ travelerId: user.id }, { guide: { userId: user.id } }] },
    include: { request: { select: { city: true, country: true, startDate: true, hours: true } }, guide: { include: { user: { select: { name: true } } } }, traveler: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ bookings });
}
