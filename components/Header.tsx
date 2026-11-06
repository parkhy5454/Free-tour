import Link from "next/link";
export function Header() {
  return <header className="header"><Link href="/" className="brand"><span className="brand-mark">F</span><span>FreeTour</span></Link>
    <nav><Link href="/guides">현지 가이드</Link><Link href="/requests/new">여행 요청</Link><Link href="/guide/join">가이드 등록</Link><Link href="/login" className="nav-cta">로그인</Link></nav>
  </header>;
}
