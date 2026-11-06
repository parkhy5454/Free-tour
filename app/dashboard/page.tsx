import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
export const dynamic="force-dynamic";
export default async function Dashboard(){
 const user=await getSession(); if(!user) redirect("/login");
 let requests:any[]=[]; let profile:any=null; let guideReviews:any[]=[];
 try { requests=await prisma.tripRequest.findMany({where:{travelerId:user.id},orderBy:{createdAt:"desc"},take:10}); profile=await prisma.guideProfile.findUnique({where:{userId:user.id}});
   if(profile){ guideReviews=await prisma.review.findMany({where:{booking:{guideId:profile.id}},orderBy:{createdAt:"desc"},take:50,select:{id:true,rating:true,comment:true,createdAt:true}}); }
 } catch {}
 const reviewCount=guideReviews.length;
 const reviewAvg=reviewCount?guideReviews.reduce((s,r)=>s+r.rating,0)/reviewCount:0;
 return <main className="page-shell"><div className="dashboard-head"><div><span className="eyebrow dark">MY FREETOUR</span><h1>안녕하세요, {user.name}님</h1><p>여행과 가이드 활동을 한곳에서 관리하세요.</p></div><LogoutButton /></div><div className="dashboard-grid"><section className="dash-card"><h2>여행자 메뉴</h2><p>나만의 여행을 요청하고 현지 가이드의 제안을 받아보세요.</p><Link className="button button-primary" href="/requests/new">새 여행 요청</Link><h3 className="subheading">내 여행 요청</h3>{requests.length?requests.map(r=><div className="request-row" key={r.id}><b>{r.city}, {r.country}</b><span>{r.status}</span></div>):<p className="muted">등록된 여행 요청이 없습니다.</p>}<p><Link className="text-link" href="/my-proposals">받은 가이드 견적 확인 →</Link></p><p><Link className="text-link" href="/bookings">예약 관리 보기 →</Link></p></section><section className="dash-card"><h2>가이드 메뉴</h2><p>현지 경험을 등록하고 여행자와 연결되세요.</p>{profile?<><b>{profile.headline}</b><p className="muted">{profile.city}, {profile.country}</p><p style={{margin:"8px 0"}}><b>{reviewCount?`★ ${reviewAvg.toFixed(1)}`:"평점 없음"}</b> <span className="muted">· 후기 {reviewCount}개</span></p>{guideReviews.slice(0,3).map(r=><div className="request-row" key={r.id}><b>★{r.rating}</b><span>{r.comment.length>50?`${r.comment.slice(0,50)}…`:r.comment}</span></div>)}<Link href="/guides" className="text-link">공개 프로필 보기 →</Link></>:<Link className="button button-outline-dark" href="/guide/join">가이드 프로필 등록</Link>}<p><Link className="text-link" href="/guide/requests">여행 요청에 견적 제출 →</Link></p><p><Link className="text-link" href="/bookings">예약 및 정산 예정 내역 →</Link></p></section></div></main>;
}
