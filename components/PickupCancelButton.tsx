"use client";

import { useState } from "react";

export default function PickupCancelButton({ pickupId }: { pickupId: string }) {
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (!window.confirm("공항 픽업 신청을 취소할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pickups/${pickupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        location.reload();
      } else {
        window.alert(json.error || "취소에 실패했습니다.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={cancel}
      disabled={busy}
      className="text-link"
      style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "#c33" }}
    >
      {busy ? "취소 중..." : "픽업 취소"}
    </button>
  );
}
