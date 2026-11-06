"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  bookingId: string;
  placeLabel: string;
  price: number;
  currency: string;
  timezoneLabel: string;
  balance: number;
  priceKrw: number; // 픽업 요금의 원화 환산액 (포인트 한도)
  krwPerUnit: number; // 현지 통화 1단위 = 몇 원 (고정 환율)
};

export default function PickupForm({
  bookingId,
  placeLabel,
  price,
  currency,
  timezoneLabel,
  balance,
  priceKrw,
  krwPerUnit,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const maxPoints = Math.min(balance, priceKrw);
  const [points, setPoints] = useState(0);
  // 사용한 포인트(원) 만큼 현지 통화 결제 금액을 차감 (올림)
  const deductLocal = Math.ceil(points / krwPerUnit);
  const payable = Math.max(0, price - deductLocal);

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
      usePoints: points,
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
        {currency !== "KRW" && (
          <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>
            {" "}(약 {priceKrw.toLocaleString("ko-KR")}원)
          </span>
        )}
      </p>

      <div style={{ marginTop: 14, padding: 14, background: "var(--paper)", borderRadius: 10 }}>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>
          보유 포인트 {balance.toLocaleString("ko-KR")}P (1P = 1원 · 사용 가능 한도 {maxPoints.toLocaleString("ko-KR")}P)
        </p>
        <label style={{ marginTop: 8 }}>
          사용할 포인트
          <input
            type="number"
            min={0}
            max={maxPoints}
            step={100}
            value={points}
            disabled={maxPoints === 0}
            onChange={(e) => {
              const v = Math.floor(Number(e.target.value) || 0);
              setPoints(Math.min(Math.max(0, v), maxPoints));
            }}
          />
        </label>
        <p style={{ margin: "8px 0 0", fontSize: 13 }}>
          결제 예정 금액: <b>{payable.toLocaleString("ko-KR")} {currency}</b>
          {points > 0 && (
            <span className="muted"> (포인트 {points.toLocaleString("ko-KR")}P 차감{currency !== "KRW" ? `, 약 ${deductLocal.toLocaleString("ko-KR")} ${currency}` : ""})</span>
          )}
        </p>
        {maxPoints === 0 && (
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 12 }}>사용할 수 있는 포인트가 없습니다.</p>
        )}
      </div>

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
        도착 시각은 공항이 있는 국가의 현지 시간 기준입니다. 항공편이 지연되면 파트너가 실시간 항공 정보를 확인해 대응합니다. 픽업을 취소하면 사용한 포인트는 돌려드립니다.
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
