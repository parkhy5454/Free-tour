import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const isAdmin = session.role === "ADMIN";

  return (
    <main className="page-shell narrow">
      <span className="eyebrow dark">SETTINGS</span>
      <h1>설정</h1>
      <p className="muted">{session.name}님 · {session.email}</p>

      <div style={{ display: "grid", gap: 16, marginTop: 28 }}>
        <Link href="/profile" className="dash-card" style={{ display: "block" }}>
          <b>내 정보</b>
          <p className="muted" style={{ margin: "6px 0 0" }}>이름, 거주 국가, 언어를 수정합니다.</p>
        </Link>

        <Link href="/dashboard" className="dash-card" style={{ display: "block" }}>
          <b>대시보드</b>
          <p className="muted" style={{ margin: "6px 0 0" }}>내 여행 요청과 가이드 활동을 확인합니다.</p>
        </Link>

        <Link href="/partner" className="dash-card" style={{ display: "block" }}>
          <b>파트너 센터</b>
          <p className="muted" style={{ margin: "6px 0 0" }}>픽업 운송 업체로 신청하고, 배정된 픽업을 관리합니다.</p>
        </Link>

        {isAdmin && (
          <Link href="/admin" className="dash-card" style={{ display: "block" }}>
            <b>관리자 대시보드</b>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              회원, 가이드, 여행 요청, 제안, 예약, 리뷰를 모두 확인합니다.
            </p>
          </Link>
        )}

        <div className="dash-card">
          <b>계정</b>
          <div style={{ marginTop: 14 }}>
            <LogoutButton />
          </div>
        </div>
      </div>
    </main>
  );
}
