import Link from "next/link";
import { Search, Globe2, Compass, ShieldCheck, Languages, MapPin } from "lucide-react";

export default function Home() {
  return <main>
    <section className="hero">
      <div className="hero-content">
        <div className="eyebrow"><Globe2 size={15}/> LOCAL PEOPLE · GLOBAL TRAVEL</div>
        <h1>여행지를 넘어,<br/><em>현지인처럼</em> 여행하다.</h1>
        <p>전 세계 현지 가이드와 연결되어 나만의 여행을 만드세요.<br className="desktop-only"/> 원하는 여행을 요청하면 현지 전문가가 직접 제안합니다.</p>
        <div className="hero-actions"><Link className="button button-light" href="/guides"><Search size={17}/> 가이드 찾기</Link><Link className="button button-outline" href="/requests/new">맞춤 여행 요청하기</Link></div>
        <div className="hero-note"><MapPin size={15}/> 전 세계 국가 및 도시 등록 지원</div>
      </div>
      <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="globe">✦</div><div className="float-card card-a">🇰🇷 Seoul · Food walk</div><div className="float-card card-b">🇮🇹 Rome · Local history</div><div className="float-card card-c">🇯🇵 Tokyo · Photo tour</div></div>
    </section>
    <section className="section">
      <div className="section-heading"><span className="eyebrow dark">HOW FREETOUR WORKS</span><h2>여행을 만드는 새로운 방법</h2><p>정해진 패키지보다 내 취향에 맞는 현지 경험을 만나보세요.</p></div>
      <div className="feature-grid">
        <article className="feature"><div className="feature-icon"><Search/></div><h3>현지 가이드 검색</h3><p>국가, 도시, 언어, 관심 분야로 나에게 맞는 가이드를 찾아보세요.</p></article>
        <article className="feature"><div className="feature-icon"><Compass/></div><h3>맞춤 여행 요청</h3><p>원하는 일정과 예산을 등록하면 가이드가 직접 제안합니다.</p></article>
        <article className="feature"><div className="feature-icon"><Languages/></div><h3>언어 장벽 낮추기</h3><p>다국어 지원과 AI 번역을 기반으로 글로벌 소통을 준비합니다.</p></article>
        <article className="feature"><div className="feature-icon"><ShieldCheck/></div><h3>신뢰할 수 있는 연결</h3><p>가이드 정보와 활동 이력을 확인하고 안전한 여행을 계획하세요.</p></article>
      </div>
    </section>
    <section className="cta-band"><div><span className="eyebrow">BECOME A LOCAL GUIDE</span><h2>당신의 도시를 소개해 주세요.</h2><p>당신이 잘 아는 동네와 문화를 여행자에게 특별한 경험으로 만들어 주세요.</p></div><Link className="button button-light" href="/guide/join">현지 가이드로 시작하기</Link></section>
  </main>;
}
