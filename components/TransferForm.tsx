"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  bookingId: string;
  placeLabel: string;
  price: number;
  currency: string;
  timezoneLabel: string;
};

// 이동 신청 폼. 요금은 국가별 고정 요금입니다.
export default function TransferForm({ bookingId, placeLabel, price, currency, timezoneLabel }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          fromAddress: fd.get("fromAddress"),
          toAddress: fd.get("toAddress"),
          rideLocal: fd.get("rideLocal"),
          passengers: fd.get("passengers"),
          luggageCount: fd.get("luggageCount"),
          note: fd.get("note") || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        location.href = "/bookings";
        return;
      }
      setError(json.error || "이동 신청에 실패했습니다.");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <p className="muted" style={{ margin: 0 }}>{placeLabel}</p>
      <p style={{ margin: "8px 0 0", fontWeight: 700 }}>
        이동 요금: {price.toLocaleString("ko-KR")} {currency}
      </p>

      <div className="form-grid" style={{ marginTop: 22 }}>
        <label className="span-two">
          출발지 (호텔 주소 등)
          <textarea name="fromAddress" required minLength={5} maxLength={300} rows={2} />
        </label>
        <label className="span-two">
          도착지
          <textarea name="toAddress" required minLength={5} maxLength={300} rows={2} />
        </label>
        <label>
          이동 일시 ({timezoneLabel})
          <input name="rideLocal" type="datetime-local" required />
        </label>
        <label>
          인원
          <input name="passengers" type="number" min={1} max={20} defaultValue={1} required />
        </label>
        <label>
          짐 개수
          <input name="luggageCount" type="number" min={0} max={30} defaultValue={0} required />
        </label>
        <label className="span-two">
          요청 사항 (선택)
          <textarea name="note" maxLength={500} rows={2} />
        </label>
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        이동 시각은 현지 시간 기준입니다. 결제 연동 전이므로 요금은 결제되지 않고 예약 기록으로만 남습니다.
      </p>

      {error && <p className="error">{error}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <Link href="/bookings" className="button button-outline-dark" style={{ flex: 1 }}>취소</Link>
        <button disabled={busy} className="button button-primary" style={{ flex: 2 }}>
          {busy ? "신청 중..." : "이동 신청"}
        </button>
      </div>
    </form>
  );
}
