import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { countryLabel } from "@/lib/countries";
import ExperienceBookForm from "@/components/ExperienceBookForm";

export const dynamic = "force-dynamic";

export default async function ExperienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exp = await prisma.experience.findUnique({
    where: { id },
    include: { guide: { include: { user: { select: { name: true } } } } },
  });
  if (!exp || !exp.isActive) notFound();

  return (
    <main className="page-shell narrow">
      <span className="eyebrow dark">LOCAL EXPERIENCE</span>
      <h1>{exp.title}</h1>
      <p className="muted">{exp.city}, {countryLabel(exp.country)} · {exp.durationHours}시간 · 최대 {exp.maxPeople}명 · 가이드 {exp.guide.user.name}</p>
      <p style={{ whiteSpace: "pre-wrap", margin: "18px 0" }}>{exp.description}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)" }}>
        {exp.price.toLocaleString("ko-KR")} {exp.currency}
      </p>
      <ExperienceBookForm experienceId={exp.id} maxPeople={exp.maxPeople} />
    </main>
  );
}
