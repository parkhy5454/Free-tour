"use client";

import { useState } from "react";

const OPTIONS = [
  { value: "CONFIRMED", label: "확정" },
  { value: "COMPLETED", label: "여행 완료" },
  { value: "CANCELLED", label: "취소" },
];

// 관리자 예약 목록에서 상태를 바꾸는 선택 상자
export default function BookingStatusSelect({ bookingId, status }: { bookingId: string; status: string }) {
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    if (next === value) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "상태 변경에 실패했습니다.");
        return;
      }
      setValue(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select value={value} disabled={busy} onChange={(e) => change(e.target.value)}>
      {value === "PENDING_PAYMENT" && <option value="PENDING_PAYMENT">결제 대기</option>}
      {value === "REFUNDED" && <option value="REFUNDED">환불</option>}
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
