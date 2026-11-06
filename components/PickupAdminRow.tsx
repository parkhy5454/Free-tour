"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "REQUESTED", label: "배정 대기" },
  { value: "ASSIGNED", label: "배정 완료" },
  { value: "IN_PROGRESS", label: "진행 중" },
  { value: "COMPLETED", label: "완료" },
  { value: "CANCELLED", label: "취소" },
];

export type AdminPickupView = {
  id: string;
  travelerName: string;
  travelerEmail: string;
  country: string;
  airport: string;
  flightNumber: string;
  arrivalLabel: string;
  passengers: number;
  luggageCount: number;
  pickupAddress: string;
  note: string | null;
  price: string;
  status: string;
  partnerId: string | null;
  driverName: string | null;
  driverPhone: string | null;
};

export type AdminPartnerOption = { id: string; name: string; phone: string };

export default function PickupAdminRow({
  pickup,
  partners,
}: {
  pickup: AdminPickupView;
  partners: AdminPartnerOption[];
}) {
  const [status, setStatus] = useState(pickup.status);
  const [partnerId, setPartnerId] = useState(pickup.partnerId ?? "");
  const [driverName, setDriverName] = useState(pickup.driverName ?? "");
  const [driverPhone, setDriverPhone] = useState(pickup.driverPhone ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/pickups/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 상태를 직접 바꾼 경우에만 보냅니다. 파트너만 배정하면 서버가 "배정 완료"로 바꿉니다.
          ...(status !== pickup.status && { status }),
          partnerId: partnerId || null,
          driverName: driverName.trim() || null,
          driverPhone: driverPhone.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("저장됨");
        location.reload();
      } else {
        setMsg(json.error || "저장 실패");
      }
    } catch {
      setMsg("네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr>
      <td>
        {pickup.travelerName}
        <div className="muted" style={{ fontSize: 11 }}>{pickup.travelerEmail}</div>
      </td>
      <td>{pickup.country}</td>
      <td>
        {pickup.airport}
        <div className="muted" style={{ fontSize: 11 }}>{pickup.flightNumber}</div>
      </td>
      <td>{pickup.arrivalLabel}</td>
      <td>{pickup.passengers}명 / 짐 {pickup.luggageCount}개</td>
      <td className="wrap">
        {pickup.pickupAddress}
        {pickup.note && <div className="muted" style={{ fontSize: 11 }}>메모: {pickup.note}</div>}
      </td>
      <td>{pickup.price}</td>
      <td>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ fontSize: 12, padding: 6 }}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </td>
      <td>
        <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} style={{ fontSize: 12, padding: 6, maxWidth: 160 }}>
          <option value="">미배정</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </td>
      <td>
        <input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="기사 이름" style={{ fontSize: 12, padding: 6, width: 110 }} />
      </td>
      <td>
        <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="기사 연락처" style={{ fontSize: 12, padding: 6, width: 130 }} />
      </td>
      <td>
        <button type="button" onClick={save} disabled={busy} className="button button-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
          {busy ? "저장 중" : "저장"}
        </button>
        {msg && <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{msg}</div>}
      </td>
    </tr>
  );
}
