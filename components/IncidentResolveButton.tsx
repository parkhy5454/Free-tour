"use client";

import { useState } from "react";

// 관리자: 긴급 알림을 확인 처리하고 메모를 남깁니다.
export default function IncidentResolveButton({ incidentId }: { incidentId: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function resolve() {
    const note = prompt("대응 내용을 간단히 남겨 주세요 (선택)") ?? "";
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "처리에 실패했습니다.");
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) return <span>처리됨</span>;
  return (
    <button className="button button-outline-dark" disabled={busy} onClick={resolve} style={{ padding: "4px 10px", fontSize: 12 }}>
      {busy ? "처리 중" : "확인 처리"}
    </button>
  );
}
