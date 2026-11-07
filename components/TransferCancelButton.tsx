"use client";

import { useState } from "react";

// 여행자: 아직 진행 전인 이동을 취소합니다.
export default function TransferCancelButton({ transferId }: { transferId: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function cancel() {
    if (!confirm("이 이동을 취소할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/transfers/${transferId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "취소에 실패했습니다.");
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) return <span className="muted" style={{ fontSize: 12 }}>취소됨</span>;
  return (
    <button className="text-link" disabled={busy} onClick={cancel} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", fontSize: 13 }}>
      {busy ? "취소 중..." : "이동 취소"}
    </button>
  );
}
