import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, MapPin, Languages } from "lucide-react";

export const dynamic = "force-dynamic";
export default async function Guides({ searchParams }: { searchParams: Promise<{ city?: string; country?: string }> }) {
  const params = await searchParams;
  let guides: any[] = [];
  let dbReady = true;
  try {
    guides = await prisma.guideProfile.findMany({
      where: { isPublished: true, ...(params.city ? { city: { contains: params.city, mode: "insensitive" } } : {}),
        ...(params.country ? { country: { contains: params.country, mode: "insensitive" } } : {}) },
      include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 60
    });
  } catch { dbReady = false; }
  return <main className="page-shell"><div className="page-title"><span className="eyebrow dark">DISCOVER LOCAL EXPERTS</span><h1>현지 가이드 찾기</h1><p>여행할 도시를 선택하고 나만의 현지 경험을 찾아보세요.</p></div>
    <form className="search-panel" action="/guides"><label><span>국가</span><input name="country" placeholder="예: South Korea" defaultValue={params.country}/></label><label><span>도시</span><input name="city" placeholder="예: Seoul" defaultValue={params.city}/></label><button className="button button-primary"><Search size={17}/> 검색</button></form>
    {!dbReady && <p className="notice">데이터베이스 연결 후 가이드 목록이 표시됩니다.</p>}
    {guides.length ? <div className="guide-grid">{guides.map(g => <article className="guide-card" key={g.id}><div className="avatar">{g.user.name.slice(0,1)}</div><div className="guide-location"><MapPin size={14}/>{g.city}, {g.country}</div><h3>{g.user.name}</h3><strong>{g.headline}</strong><p>{g.bio}</p><div className="tag-row">{g.specialties.slice(0,3).map((x:string)=><span className="tag" key={x}>{x}</span>)}</div><div className="guide-bottom"><span><Languages size={14}/> {g.languages.join(", ")}</span><b>{g.hourlyRate.toLocaleString()} {g.currency}/시간</b></div></article>)}</div> : <div className="empty-state"><div className="empty-icon">✦</div><h3>첫 번째 현지 가이드를 기다리고 있어요.</h3><p>가이드로 등록하고 전 세계 여행자와 만나보세요.</p><Link href="/guide/join" className="button button-primary">가이드 등록하기</Link></div>}
  </main>;
}
