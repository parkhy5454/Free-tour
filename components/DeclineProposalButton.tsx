"use client";

import { useState } from "react";

// 여행자: 가이드 견적 거절 버튼
export default function DeclineProposalButton({ proposalId }: { proposalId: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function decline() {
    if (!confirm("이 견적을 거절할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/decline`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "거절에 실패했습니다.");
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="muted" style={{ fontSize: 13 }}>거절한 견적입니다.</p>;
  return (
    <button className="button button-outline-dark" disabled={busy} onClick={decline} style={{ marginTop: 10 }}>
      {busy ? "처리 중..." : "견적 거절"}
    </button>
  );
}
