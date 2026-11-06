import Link from "next/link";
import { getSession } from "@/lib/auth";

export async function Header() {
  const session = await getSession();

  return (
    <header className="header">
      <Link href="/" className="brand">
        <span className="brand-mark">F</span>
        <span>FreeTour</span>
      </Link>
      <nav>
        <Link href="/guides">현지 가이드</Link>
        <Link href="/requests/new">여행 요청</Link>
        <Link href="/guide/join">가이드 등록</Link>
        {session ? (
          <>
            {session.role === "ADMIN" && <Link href="/admin">관리자</Link>}
            <Link href="/profile">내 정보</Link>
            <Link href="/dashboard" className="nav-cta">대시보드</Link>
          </>
        ) : (
          <Link href="/login" className="nav-cta">로그인</Link>
        )}
      </nav>
    </header>
  );
}
