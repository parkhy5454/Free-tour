"use client";

import { useState } from "react";

// 예약 취소 버튼. 예상 환불액을 확인받은 뒤 취소합니다.
export default function CancelBookingButton({ bookingId, estimatedRefund, currency }: { bookingId: string; estimatedRefund: number; currency: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function cancel() {
    const refundText = `${estimatedRefund.toLocaleString("ko-KR")} ${currency}`;
    if (!confirm(`예약을 취소할까요?\n예상 환불 금액: ${refundText}\n(실제 환불은 결제 연동 이후 처리됩니다.)`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "취소에 실패했습니다.");
        return;
      }
      setDone(true);
      alert(`예약이 취소되었습니다. 환불 예정 금액: ${Number(json.refundAmount).toLocaleString("ko-KR")} ${json.currency}`);
      location.reload();
    } finally {
      setBusy(false);
    }
  }

  if (done) return <span className="muted" style={{ fontSize: 13 }}>취소됨</span>;
  return (
    <button className="text-link" disabled={busy} onClick={cancel} style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}>
      {busy ? "취소 중..." : "예약 취소"}
    </button>
  );
}
