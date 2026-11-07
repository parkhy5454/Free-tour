import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AcceptProposalButton from "@/components/AcceptProposalButton";
import DeclineProposalButton from "@/components/DeclineProposalButton";
export const dynamic="force-dynamic";
export default async function MyProposalsPage(){const user=await getSession();if(!user)redirect("/login");const proposals=await prisma.guideProposal.findMany({where:{request:{travelerId:user.id}},include:{guide:{include:{user:{select:{name:true}}}},request:true},orderBy:{createdAt:"desc"}});return <main className="page-shell"><span className="eyebrow dark">GUIDE OFFERS</span><h1>받은 가이드 견적</h1><p>마음에 드는 제안을 선택하면 예약이 생성됩니다.</p><div className="dashboard-grid">{proposals.map(p=><section className="dash-card" key={p.id}><h2>{p.request.city}, {p.request.country}</h2><b>{p.guide.user.name}</b><p>{p.message}</p><p>{p.price.toLocaleString()} {p.currency} · {p.status}</p>{p.status==="PENDING"&&p.request.status==="OPEN"?<><AcceptProposalButton proposalId={p.id}/><DeclineProposalButton proposalId={p.id}/></>:null}</section>)}</div>{proposals.length===0&&<p className="muted">아직 받은 견적이 없습니다.</p>}<Link className="text-link" href="/dashboard">대시보드로 돌아가기 →</Link></main>}
