import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { TRAVELER: "여행자", GUIDE: "가이드", ADMIN: "관리자" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const [users, guides, requests, bookings, totals, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.guideProfile.count(),
    prisma.tripRequest.count(),
    prisma.booking.count(),
    prisma.booking.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { amount: true, platformFee: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, email: true, role: true, country: true, createdAt: true },
    }),
  ]);

  return (
    <main className="page-shell">
      <span className="eyebrow dark">ADMIN CONSOLE</span>
      <h1>FreeTour 운영 대시보드</h1>

      <div className="dashboard-grid">
        <section className="dash-card"><h2>회원</h2><h1>{users}</h1></section>
        <section className="dash-card"><h2>가이드</h2><h1>{guides}</h1></section>
        <section className="dash-card"><h2>여행 요청</h2><h1>{requests}</h1></section>
        <section className="dash-card"><h2>예약</h2><h1>{bookings}</h1></section>
      </div>

      <section className="dash-card">
        <h2>거래 집계</h2>
        <p>예약 총액: {(totals._sum.amount || 0).toLocaleString()}</p>
        <p>예상 플랫폼 수수료: {(totals._sum.platformFee || 0).toLocaleString()}</p>
        <p className="muted">결제 완료 매출이 아닌 예약 생성 기준 집계입니다.</p>
      </section>

      <section className="dash-card">
        <h2>최근 가입 회원 (최대 20명)</h2>
        {recentUsers.length === 0 && <p className="muted">가입한 회원이 없습니다.</p>}
        {recentUsers.map((u) => (
          <div className="request-row" key={u.id}>
            <b>{u.name}</b>
            <span>{u.email}</span>
            <span>{ROLE_LABEL[u.role] ?? u.role}</span>
            <span>{u.country ?? "-"}</span>
            <span className="muted">{u.createdAt.toLocaleDateString("ko-KR")}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
