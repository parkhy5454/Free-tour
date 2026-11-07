import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { countryLabel } from "@/lib/countries";
import { EXPERIENCE_CATEGORIES, categoryLabel } from "@/lib/experiences";

export const dynamic = "force-dynamic";

// 현지 체험 상품 목록
export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selected = EXPERIENCE_CATEGORIES.some((c) => c.value === category) ? category : undefined;

  const experiences = await prisma.experience.findMany({
    where: { isActive: true, ...(selected && { category: selected }) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { guide: { include: { user: { select: { name: true } } } } },
  });

  return (
    <main className="page-shell">
      <div className="page-title">
        <span className="eyebrow dark">LOCAL EXPERIENCES</span>
        <h1>현지 체험</h1>
        <p>현지 가이드가 직접 올린 체험 상품입니다. 가격은 고정이며 바로 예약할 수 있습니다.</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <Link href="/experiences" className={selected ? "button button-outline-dark" : "button button-primary"}>전체</Link>
        {EXPERIENCE_CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/experiences?category=${c.value}`}
            className={selected === c.value ? "button button-primary" : "button button-outline-dark"}
          >
            {c.label}
          </Link>
        ))}
      </div>
      {experiences.length === 0 ? (
        <p className="muted">아직 등록된 체험이 없습니다.</p>
      ) : (
        <div className="dashboard-grid">
          {experiences.map((e) => (
            <Link key={e.id} href={`/experiences/${e.id}`} className="dash-card" style={{ display: "block" }}>
              <span className="muted" style={{ fontSize: 12 }}>{categoryLabel(e.category)}</span>
              <b style={{ display: "block" }}>{e.title}</b>
              <p className="muted" style={{ margin: "6px 0" }}>
                {e.city}, {countryLabel(e.country)} · {e.durationHours}시간 · 최대 {e.maxPeople}명
              </p>
              <p style={{ margin: 0 }}>
                <b>{e.price.toLocaleString("ko-KR")} {e.currency}</b>
                <span className="muted"> · 가이드 {e.guide.user.name}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
