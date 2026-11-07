"use client";

import { useState } from "react";

type Props = {
  transfer: {
    id: string;
    status: string;
    fromAddress: string;
    toAddress: string;
    rideLabel: string;
    passengers: number;
    luggageCount: number;
    note: string | null;
    accepted: boolean;
    vehiclePlate: string | null;
    vehicleSeats: number | null;
    driverName: string | null;
    driverPhone: string | null;
  };
};

// 파트너가 배정받은 호텔 이동 카드. 픽업과 같은 규칙으로 수락 후 진행 상태를 관리합니다.
export default function PartnerTransferRow({ transfer }: Props) {
  const [accepted, setAccepted] = useState(transfer.accepted);
  const [status, setStatus] = useState(transfer.status);
  const [driverName, setDriverName] = useState(transfer.driverName ?? "");
  const [driverPhone, setDriverPhone] = useState(transfer.driverPhone ?? "");
  const [vehiclePlate, setVehiclePlate] = useState(transfer.vehiclePlate ?? "");
  const [vehicleSeats, setVehicleSeats] = useState(transfer.vehicleSeats ? String(transfer.vehicleSeats) : "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const closed = status === "COMPLETED" || status === "CANCELLED";

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/partner/transfers/${transfer.id}`, {
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

  return (
    <div className="dash-card" style={{ marginBottom: 14 }}>
      <b>{transfer.fromAddress} → {transfer.toAddress}</b>
      <p className="muted" style={{ margin: "4px 0" }}>
        이동 {transfer.rideLabel} · 인원 {transfer.passengers}명 · 짐 {transfer.luggageCount}개
      </p>
      {transfer.note && <p className="muted" style={{ margin: "4px 0" }}>요청: {transfer.note}</p>}

      {!accepted ? (
        <button
          className="button button-primary"
          disabled={busy || closed}
          onClick={async () => {
            if (await send({ action: "accept" })) {
              setAccepted(true);
              setMsg("수락했습니다. 출발지와 도착지를 확인하고 차량 정보를 입력해 주세요.");
            }
          }}
          style={{ marginTop: 12 }}
        >
          {busy ? "처리 중..." : "이동 수락"}
        </button>
      ) : (
        <>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <label>
              진행 상태
              <select value={status} disabled={busy || closed} onChange={(e) => setStatus(e.target.value)}>
                <option value="ASSIGNED">배정 완료</option>
                <option value="IN_PROGRESS">진행 중</option>
                <option value="COMPLETED">완료</option>
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
              탑승 가능 인원 (필수)
              <input type="number" min={1} max={30} value={vehicleSeats} disabled={busy || closed} onChange={(e) => setVehicleSeats(e.target.value)} />
            </label>
            <label className="span-two">
              차량 번호 (필수)
              <input value={vehiclePlate} disabled={busy || closed} onChange={(e) => setVehiclePlate(e.target.value)} maxLength={20} />
            </label>
          </div>
          {!closed && (
            <button
              className="button button-primary"
              disabled={busy}
              onClick={async () => {
                if (await send({
                  status,
                  driverName,
                  driverPhone,
                  vehiclePlate,
                  vehicleSeats: vehicleSeats ? Number(vehicleSeats) : undefined,
                })) {
                  setMsg("저장되었습니다.");
                }
              }}
              style={{ marginTop: 12 }}
            >
              {busy ? "저장 중..." : "저장"}
            </button>
          )}
        </>
      )}
      {msg && <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>{msg}</p>}
    </div>
  );
}
