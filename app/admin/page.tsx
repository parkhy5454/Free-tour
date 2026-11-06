import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "../admin-table.css";

export const dynamic = "force-dynamic";

const LIMIT = 200;

const TABS = [
  { key: "overview", label: "개요" },
  { key: "users", label: "회원" },
  { key: "guides", label: "가이드" },
  { key: "requests", label: "여행 요청" },
  { key: "proposals", label: "제안" },
  { key: "bookings", label: "예약" },
  { key: "reviews", label: "리뷰" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const ROLE_LABEL: Record<string, string> = { TRAVELER: "여행자", GUIDE: "가이드", ADMIN: "관리자" };

const fmtDate = (d: Date | null | undefined) =>
  d ? d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "short" }) : "-";

const fmtMoney = (n: number | null | undefined, currency = "KRW") =>
  `${(n ?? 0).toLocaleString("ko-KR")} ${currency}`;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const { tab } = await searchParams;
  const active: TabKey = TABS.some((t) => t.key === tab) ? (tab as TabKey) : "overview";

  let body: React.ReactNode;

  if (active === "overview") {
    const [users, guides, requests, proposals, bookings, reviews, totals, paid] = await Promise.all([
      prisma.user.count(),
      prisma.guideProfile.count(),
      prisma.tripRequest.count(),
      prisma.guideProposal.count(),
      prisma.booking.count(),
      prisma.review.count(),
      prisma.booking.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { amount: true, platformFee: true, guidePayout: true },
      }),
      prisma.booking.count({ where: { paymentStatus: "PAID" } }),
    ]);

    body = (
      <>
        <div className="kpi-grid">
          <div className="kpi"><span>회원</span><b>{users}</b></div>
          <div className="kpi"><span>가이드 프로필</span><b>{guides}</b></div>
          <div className="kpi"><span>여행 요청</span><b>{requests}</b></div>
          <div className="kpi"><span>가이드 제안</span><b>{proposals}</b></div>
          <div className="kpi"><span>예약</span><b>{bookings}</b></div>
          <div className="kpi"><span>결제 완료 예약</span><b>{paid}</b></div>
          <div className="kpi"><span>리뷰</span><b>{reviews}</b></div>
        </div>
        <section className="dash-card">
          <h2>거래 집계 (취소 제외)</h2>
          <p>예약 총액: {fmtMoney(totals._sum.amount)}</p>
          <p>예상 플랫폼 수수료: {fmtMoney(totals._sum.platformFee)}</p>
          <p>가이드 정산 예정액: {fmtMoney(totals._sum.guidePayout)}</p>
          <p className="admin-note">
            결제 연동 전이므로 예약 생성 기준 집계입니다. 실제 결제 완료 매출이 아닙니다.
          </p>
        </section>
      </>
    );
  }

  if (active === "users") {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      include: { guideProfile: { select: { id: true } } },
    });
    body = (
      <TableWrap caption={`회원 ${rows.length}명 (최신순, 최대 ${LIMIT}명)`}>
        <thead>
          <tr><th>이름</th><th>이메일</th><th>역할</th><th>국가</th><th>언어</th><th>가이드</th><th>가입일</th></tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td><span className="admin-badge">{ROLE_LABEL[u.role] ?? u.role}</span></td>
              <td>{u.country ?? "-"}</td>
              <td>{u.language}</td>
              <td>{u.guideProfile ? "있음" : "-"}</td>
              <td>{fmtDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    );
  }

  if (active === "guides") {
    const rows = await prisma.guideProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { proposals: true, bookings: true } },
      },
    });
    body = (
      <TableWrap caption={`가이드 ${rows.length}명 (최신순)`}>
        <thead>
          <tr><th>가이드</th><th>이메일</th><th>도시</th><th>헤드라인</th><th>시간당 요금</th><th>공개</th><th>제안</th><th>예약</th><th>등록일</th></tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.id}>
              <td>{g.user.name}</td>
              <td>{g.user.email}</td>
              <td>{g.city}, {g.country}</td>
              <td className="wrap">{g.headline}</td>
              <td>{fmtMoney(g.hourlyRate, g.currency)}</td>
              <td>{g.isPublished ? "공개" : "비공개"}</td>
              <td>{g._count.proposals}</td>
              <td>{g._count.bookings}</td>
              <td>{fmtDate(g.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    );
  }

  if (active === "requests") {
    const rows = await prisma.tripRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      include: {
        traveler: { select: { name: true, email: true } },
        _count: { select: { proposals: true } },
        booking: { select: { id: true } },
      },
    });
    body = (
      <TableWrap caption={`여행 요청 ${rows.length}건 (최신순)`}>
        <thead>
          <tr><th>여행자</th><th>이메일</th><th>도시</th><th>시작일</th><th>시간</th><th>인원</th><th>예산</th><th>상태</th><th>제안</th><th>예약</th><th>요청일</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.traveler.name}</td>
              <td>{r.traveler.email}</td>
              <td>{r.city}, {r.country}</td>
              <td>{fmtDate(r.startDate)}</td>
              <td>{r.hours}시간</td>
              <td>{r.partySize}명</td>
              <td>{r.budget != null ? fmtMoney(r.budget, r.currency) : "-"}</td>
              <td><span className="admin-badge">{r.status}</span></td>
              <td>{r._count.proposals}</td>
              <td>{r.booking ? "있음" : "-"}</td>
              <td>{fmtDate(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    );
  }

  if (active === "proposals") {
    const rows = await prisma.guideProposal.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      include: {
        guide: { include: { user: { select: { name: true } } } },
        request: { select: { city: true, country: true } },
        booking: { select: { id: true } },
      },
    });
    body = (
      <TableWrap caption={`가이드 제안 ${rows.length}건 (최신순)`}>
        <thead>
          <tr><th>가이드</th><th>여행지</th><th>제안 가격</th><th>상태</th><th>메시지</th><th>예약</th><th>제안일</th></tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>{p.guide.user.name}</td>
              <td>{p.request.city}, {p.request.country}</td>
              <td>{fmtMoney(p.price, p.currency)}</td>
              <td><span className="admin-badge">{p.status}</span></td>
              <td className="wrap">{p.message}</td>
              <td>{p.booking ? "있음" : "-"}</td>
              <td>{fmtDate(p.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    );
  }

  if (active === "bookings") {
    const rows = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      include: {
        traveler: { select: { name: true, email: true } },
        guide: { include: { user: { select: { name: true } } } },
        request: { select: { city: true, country: true, startDate: true } },
        review: { select: { id: true, rating: true } },
      },
    });
    body = (
      <TableWrap caption={`예약 ${rows.length}건 (최신순)`}>
        <thead>
          <tr><th>예약일</th><th>여행자</th><th>이메일</th><th>가이드</th><th>여행지</th><th>여행일</th><th>금액</th><th>플랫폼 수수료</th><th>가이드 정산</th><th>예약 상태</th><th>결제 상태</th><th>리뷰</th></tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id}>
              <td>{fmtDate(b.createdAt)}</td>
              <td>{b.traveler.name}</td>
              <td>{b.traveler.email}</td>
              <td>{b.guide.user.name}</td>
              <td>{b.request.city}, {b.request.country}</td>
              <td>{fmtDate(b.request.startDate)}</td>
              <td>{fmtMoney(b.amount, b.currency)}</td>
              <td>{fmtMoney(b.platformFee, b.currency)}</td>
              <td>{fmtMoney(b.guidePayout, b.currency)}</td>
              <td><span className="admin-badge">{b.status}</span></td>
              <td><span className="admin-badge">{b.paymentStatus}</span></td>
              <td>{b.review ? `★${b.review.rating}` : "-"}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    );
  }

  if (active === "reviews") {
    const rows = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      include: {
        author: { select: { name: true } },
        booking: { select: { id: true, amount: true, currency: true } },
      },
    });
    body = (
      <TableWrap caption={`리뷰 ${rows.length}건 (최신순)`}>
        <thead>
          <tr><th>작성자</th><th>평점</th><th>내용</th><th>예약 금액</th><th>작성일</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.author.name}</td>
              <td>★{r.rating}</td>
              <td className="wrap">{r.comment}</td>
              <td>{fmtMoney(r.booking.amount, r.booking.currency)}</td>
              <td>{fmtDate(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    );
  }

  return (
    <main className="page-shell">
      <Link href="/settings" className="text-link">← 설정으로</Link>
      <span className="eyebrow dark" style={{ display: "block", marginTop: 16 }}>ADMIN CONSOLE</span>
      <h1>관리자 대시보드</h1>

      <nav className="admin-tabs" aria-label="관리자 메뉴">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "overview" ? "/admin" : `/admin?tab=${t.key}`}
            className={`admin-tab${t.key === active ? " active" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {body}
    </main>
  );
}

function TableWrap({
  caption,
  children,
}: {
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="admin-note" style={{ marginBottom: 10 }}>{caption}</p>
      <div className="admin-table-wrap">
        <table className="admin-table">{children}</table>
      </div>
    </section>
  );
}
