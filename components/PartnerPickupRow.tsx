"use client";

import { useState } from "react";

type Props = {
  pickup: {
    id: string;
    status: string;
    airport: string;
    flightNumber: string;
    arrivalLabel: string;
    passengers: number;
    luggageCount: number;
    pickupAddress: string;
    note: string | null;
    driverName: string | null;
    driverPhone: string | null;
  };
};

const STATUS_OPTIONS = [
  { value: "ASSIGNED", label: "배정 완료" },
  { value: "IN_PROGRESS", label: "진행 중" },
  { value: "COMPLETED", label: "완료" },
];

// 파트너가 배정받은 픽업의 상태와 기사 정보를 수정하는 카드
export default function PartnerPickupRow({ pickup }: Props) {
  const [status, setStatus] = useState(pickup.status);
  const [driverName, setDriverName] = useState(pickup.driverName ?? "");
  const [driverPhone, setDriverPhone] = useState(pickup.driverPhone ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const closed = status === "COMPLETED" || status === "CANCELLED";

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/partner/pickups/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, driverName, driverPhone }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || "저장에 실패했습니다.");
        return;
      }
      setMsg("저장되었습니다.");
    } catch {
      setMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dash-card" style={{ marginBottom: 14 }}>
      <b>{pickup.airport} · {pickup.flightNumber}</b>
      <p className="muted" style={{ margin: "4px 0" }}>
        도착 {pickup.arrivalLabel} · 인원 {pickup.passengers}명 · 짐 {pickup.luggageCount}개
      </p>
      <p style={{ margin: "4px 0" }}>📍 {pickup.pickupAddress}</p>
      {pickup.note && <p className="muted" style={{ margin: "4px 0" }}>요청: {pickup.note}</p>}

      <div className="form-grid" style={{ marginTop: 12 }}>
        <label>
          진행 상태
          <select value={status} disabled={busy || closed} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label>
          기사 이름
          <input value={driverName} disabled={busy || closed} onChange={(e) => setDriverName(e.target.value)} maxLength={60} />
        </label>
        <label className="span-two">
          기사 연락처
          <input value={driverPhone} disabled={busy || closed} onChange={(e) => setDriverPhone(e.target.value)} maxLength={30} />
        </label>
      </div>

      {!closed && (
        <button className="button button-primary" disabled={busy} onClick={save} style={{ marginTop: 12 }}>
          {busy ? "저장 중..." : "저장"}
        </button>
      )}
      {msg && <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>{msg}</p>}
    </div>
  );
}
