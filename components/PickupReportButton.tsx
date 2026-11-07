"use client";

import { useState } from "react";

// 여행자: 배정된 업체에 문제를 신고합니다 (한 픽업당 한 번).
export default function PickupReportButton({ pickupId, reported }: { pickupId: string; reported: boolean }) {
  const [done, setDone] = useState(reported);
  const [busy, setBusy] = useState(false);

  async function report() {
    if (!confirm("배정된 업체에 문제를 신고할까요? 신고는 취소할 수 없습니다.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pickups/${pickupId}/report`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "신고에 실패했습니다.");
        return;
      }
      setDone(true);
      if (json.suspended) alert("신고가 접수되었습니다. 이 업체는 누적 신고로 배정이 중단되었습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <span className="muted" style={{ fontSize: 13 }}>신고 접수됨</span>;
  return (
    <button className="text-link" disabled={busy} onClick={report} style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}>
      {busy ? "신고 중..." : "업체 문제 신고"}
    </button>
  );
}
