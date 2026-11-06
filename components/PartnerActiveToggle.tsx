"use client";

import { useState } from "react";

// 관리자: 파트너 승인/비활성 전환 버튼
export default function PartnerActiveToggle({ partnerId, isActive }: { partnerId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/transfer-partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !active }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "변경에 실패했습니다.");
        return;
      }
      setActive(!active);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="button button-outline-dark" disabled={busy} onClick={toggle} style={{ padding: "4px 10px", fontSize: 12 }}>
      {active ? "비활성으로 변경" : "승인(활성화)"}
    </button>
  );
}
