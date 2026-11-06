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

export default function PickupForm({ bookingId, placeLabel, price, currency, timezoneLabel }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      bookingId,
      airport: fd.get("airport"),
      flightNumber: fd.get("flightNumber"),
      arrivalLocal: fd.get("arrivalLocal"),
      passengers: fd.get("passengers"),
      luggageCount: fd.get("luggageCount"),
      pickupAddress: fd.get("pickupAddress"),
      note: fd.get("note") || undefined,
    };
    try {
      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        location.href = "/bookings";
        return;
      }
      setError(json.error || "픽업 신청에 실패했습니다.");
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
        픽업 요금: {price.toLocaleString("ko-KR")} {currency}
      </p>

      <div className="form-grid" style={{ marginTop: 22 }}>
        <label className="span-two">
          공항
          <input name="airport" required minLength={2} maxLength={100} placeholder="예: Narita (NRT) / Incheon (ICN)" />
        </label>
        <label>
          항공편 번호
          <input name="flightNumber" required minLength={2} maxLength={20} placeholder="예: KE123" />
        </label>
        <label>
          도착 일시 ({timezoneLabel})
          <input name="arrivalLocal" type="datetime-local" required />
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
          픽업 장소 (호텔 주소 등)
          <textarea name="pickupAddress" required minLength={5} maxLength={300} rows={3} placeholder="숙소 이름과 주소를 정확히 적어 주세요." />
        </label>
        <label className="span-two">
          요청 사항 (선택)
          <textarea name="note" maxLength={500} rows={2} placeholder="유아 카시트, 짐이 많음 등" />
        </label>
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        도착 시각은 공항이 있는 국가의 현지 시간 기준입니다. 항공편이 지연되면 파트너가 실시간 항공 정보를 확인해 대응합니다.
      </p>

      {error && <p className="error">{error}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <Link href="/bookings" className="button button-outline-dark" style={{ flex: 1 }}>취소</Link>
        <button disabled={busy} className="button button-primary" style={{ flex: 2 }}>
          {busy ? "신청 중..." : "픽업 신청"}
        </button>
      </div>
    </form>
  );
}
