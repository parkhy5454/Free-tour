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
    accepted: boolean;
    driverName: string | null;
    driverPhone: string | null;
    vehiclePlate: string | null;
    vehicleSeats: number | null;
  };
};

const STATUS_OPTIONS = [
  { value: "ASSIGNED", label: "배정 완료" },
  { value: "IN_PROGRESS", label: "진행 중" },
  { value: "COMPLETED", label: "완료" },
];

// 배정된 픽업 카드. 수락 전에는 여행자 주소를 볼 수 없고, 수락 후에 진행 상태와 차량 정보를 입력합니다.
export default function PartnerPickupRow({ pickup }: Props) {
  const [accepted, setAccepted] = useState(pickup.accepted);
  const [status, setStatus] = useState(pickup.status);
  const [driverName, setDriverName] = useState(pickup.driverName ?? "");
  const [driverPhone, setDriverPhone] = useState(pickup.driverPhone ?? "");
  const [vehiclePlate, setVehiclePlate] = useState(pickup.vehiclePlate ?? "");
  const [vehicleSeats, setVehicleSeats] = useState(pickup.vehicleSeats ? String(pickup.vehicleSeats) : "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const closed = status === "COMPLETED" || status === "CANCELLED";

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/partner/pickups/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || "저장에 실패했습니다.");
        return false;
      }
      return true;
    } catch {
      setMsg("네트워크 오류가 발생했습니다.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (await send({ action: "accept" })) {
      setAccepted(true);
      setMsg("수락했습니다. 여행자 주소를 확인하고 차량 정보를 입력해 주세요.");
    }
  }

  async function save() {
    if (await send({
      status,
      driverName,
      driverPhone,
      vehiclePlate,
      vehicleSeats: vehicleSeats ? Number(vehicleSeats) : undefined,
    })) {
      setMsg("저장되었습니다.");
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

      {!accepted ? (
        <button className="button button-primary" disabled={busy || closed} onClick={accept} style={{ marginTop: 12 }}>
          {busy ? "처리 중..." : "픽업 수락"}
        </button>
      ) : (
        <>
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
            <label>
              기사 연락처
              <input value={driverPhone} disabled={busy || closed} onChange={(e) => setDriverPhone(e.target.value)} maxLength={30} />
            </label>
            <label>
              차량 탑승 가능 인원 (필수)
              <input type="number" min={1} max={30} value={vehicleSeats} disabled={busy || closed} onChange={(e) => setVehicleSeats(e.target.value)} />
            </label>
            <label className="span-two">
              차량 번호 (필수)
              <input value={vehiclePlate} disabled={busy || closed} onChange={(e) => setVehiclePlate(e.target.value)} maxLength={20} placeholder="예: 12가 3456" />
            </label>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            여행자 요청 인원은 {pickup.passengers}명입니다. 탑승 가능 인원이 이보다 적으면 진행할 수 없습니다. 차량 번호와 탑승 인원을 입력해야 "진행 중"으로 바꿀 수 있습니다.
          </p>
          {!closed && (
            <button className="button button-primary" disabled={busy} onClick={save} style={{ marginTop: 12 }}>
              {busy ? "저장 중..." : "저장"}
            </button>
          )}
        </>
      )}
      {msg && <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>{msg}</p>}
    </div>
  );
}
