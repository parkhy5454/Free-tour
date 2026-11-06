"use client";
import { useState } from "react";
export default function AcceptProposalButton({ proposalId }: { proposalId: string }) {
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function accept(){setBusy(true);setError("");const res=await fetch(`/api/proposals/${proposalId}/accept`,{method:"POST"});const data=await res.json();setBusy(false);if(res.ok)location.href="/bookings";else setError(data.error||"예약을 생성하지 못했습니다.");}
  return <><button className="button button-primary" onClick={accept} disabled={busy}>{busy?"처리 중...":"이 견적 선택하기"}</button>{error&&<p className="notice">{error}</p>}</>;
}
