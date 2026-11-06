import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await getSession(); if (!user) redirect("/login"); if (user.role !== "ADMIN") redirect("/dashboard");
  const [users, guides, requests, bookings, totals] = await Promise.all([
    prisma.user.count(), prisma.guideProfile.count(), prisma.tripRequest.count(), prisma.booking.count(),
    prisma.booking.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { amount: true, platformFee: true } })
  ]);
  return <main className="page-shell"><span className="eyebrow dark">ADMIN CONSOLE</span><h1>FreeTour 운영 대시보드</h1><div className="dashboard-grid"><section className="dash-card"><h2>회원</h2><h1>{users}</h1></section><section className="dash-card"><h2>가이드</h2><h1>{guides}</h1></section><section className="dash-card"><h2>여행 요청</h2><h1>{requests}</h1></section><section className="dash-card"><h2>예약</h2><h1>{bookings}</h1></section></div><section className="dash-card"><h2>거래 집계</h2><p>예약 총액: {(totals._sum.amount || 0).toLocaleString()}</p><p>예상 플랫폼 수수료: {(totals._sum.platformFee || 0).toLocaleString()}</p><p className="muted">결제 완료 매출이 아닌 예약 생성 기준 집계입니다.</p></section></main>;
}
