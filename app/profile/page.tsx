import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/ProfileForm";
import LogoutButton from "@/components/LogoutButton";

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
    </main>
  );
}
