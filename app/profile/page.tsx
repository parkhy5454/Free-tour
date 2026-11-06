import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/ProfileForm";
import LogoutButton from "@/components/LogoutButton";
import { POINT_RULES, POINT_REASON_LABEL } from "@/lib/points";
import { completedTripCount, tierForTrips, nextTierInfo } from "@/lib/membership";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  TRAVELER: "여행자",
  GUIDE: "현지 가이드",
  ADMIN: "관리자",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { guideProfile: true },
  });
  if (!user) redirect("/login");

  const tripCount = await completedTripCount(user.id);
  const tier = tierForTrips(tripCount);
  const nextTier = nextTierInfo(tripCount);

  const [pointSum, pointHistory] = await Promise.all([
    prisma.pointLedger.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
    prisma.pointLedger.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const balance = pointSum._sum.amount ?? 0;

  return (
    <main className="page-shell">
      <span className="eyebrow dark">MY PROFILE</span>
      <h1>내 정보</h1>

      <div className="dashboard-grid">
        <section className="dash-card">
          <h2>기본 정보</h2>
          <p>
            <b>이메일</b> <span className="muted">{user.email}</span>
          </p>
          <p>
            <b>가입 유형</b> <span className="muted">{ROLE_LABEL[user.role] ?? user.role}</span>
          </p>
          <p>
            <b>가입일</b>{" "}
            <span className="muted">{user.createdAt.toLocaleDateString("ko-KR")}</span>
          </p>
          <div style={{ marginTop: 24 }}>
            <ProfileForm
              initial={{
                name: user.name,
                country: user.country ?? "",
                language: user.language === "en" ? "en" : "ko",
              }}
            />
          </div>
        </section>

        <section className="dash-card">
          <h2>활동</h2>
          {user.guideProfile ? (
            <>
              <b>{user.guideProfile.headline}</b>
              <p className="muted">
                {user.guideProfile.city}, {user.guideProfile.country}
              </p>
              <Link href="/guides" className="text-link">
                공개 프로필 보기 →
              </Link>
            </>
          ) : (
            <p>
              현지 가이드로 활동하고 싶다면{" "}
              <Link href="/guide/join" className="text-link">
                가이드 프로필 등록 →
              </Link>
            </p>
          )}
          <p>
            <Link href="/dashboard" className="text-link">
              대시보드로 이동 →
            </Link>
          </p>
          <p>
            <Link href="/bookings" className="text-link">
              예약 내역 보기 →
            </Link>
          </p>
          {user.role === "ADMIN" && (
            <p>
              <Link href="/admin" className="text-link">
                관리자 페이지 →
              </Link>
            </p>
          )}
          <div style={{ marginTop: 24 }}>
            <LogoutButton />
          </div>
        </section>
      </div>

      <section className="dash-card" style={{ marginTop: 20 }}>
        <h2>멤버십</h2>
        <p style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", margin: "8px 0 4px" }}>
          {tier.name} 등급
        </p>
        <p className="muted">
          완료된 여행 {tripCount}회
          {nextTier
            ? ` · ${nextTier.next.name} 등급까지 ${nextTier.remaining}회 남았습니다.`
            : " · 최고 등급입니다."}
        </p>
        <p className="muted" style={{ fontSize: 13 }}>
          등급이 높을수록 후기 적립 포인트가 늘어납니다. (현재 후기 적립 {Math.round(POINT_RULES.REVIEW_REWARD * tier.reviewMultiplier).toLocaleString("ko-KR")}P)
        </p>
      </section>

      <section className="dash-card" style={{ marginTop: 20 }}>
        <h2>포인트</h2>
        <p style={{ fontSize: 28, fontWeight: 800, color: "var(--navy)", margin: "8px 0 4px" }}>
          {balance.toLocaleString("ko-KR")} P
        </p>
        <p className="muted">후기를 작성하면 {POINT_RULES.REVIEW_REWARD.toLocaleString("ko-KR")}P가 적립됩니다. 포인트 사용처는 준비 중입니다.</p>

        <div style={{ marginTop: 16 }}>
          {pointHistory.length === 0 ? (
            <p className="muted">적립 내역이 없습니다.</p>
          ) : (
            pointHistory.map((h) => (
              <div className="request-row" key={h.id}>
                <span>{POINT_REASON_LABEL[h.reason] ?? h.reason}</span>
                <b>{h.amount > 0 ? "+" : ""}{h.amount.toLocaleString("ko-KR")}P</b>
                <span className="muted">{h.createdAt.toLocaleDateString("ko-KR")}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
