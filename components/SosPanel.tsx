"use client";

import { useState } from "react";
import { EMERGENCY_NUMBERS } from "@/lib/emergency";

type Props = {
  bookingId: string;
  countryName: string;
  countryLabel: string;
  partner: { name: string; phone: string } | null;
};

// 여행자 긴급 패널: 긴급 번호 바로 걸기 + 가이드·업체에 SOS 알림 보내기
export default function SosPanel({ bookingId, countryName, countryLabel, partner }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const numbers = EMERGENCY_NUMBERS[countryName];

  async function send() {
    if (!confirm("긴급 알림(SOS)을 보낼까요? 가이드와 관리자에게 바로 전달됩니다.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "전송에 실패했습니다.");
        return;
      }
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="button"
        style={{ background: "#b91c1c", color: "#fff", padding: "6px 12px", fontSize: 12 }}
      >
        🆘 긴급 도움
      </button>
    );
  }

  return (
    <div className="form-card" style={{ marginTop: 10, borderColor: "#b91c1c" }}>
      <b>긴급 도움</b>
      <p className="muted" style={{ fontSize: 12, margin: "4px 0 10px" }}>
        위급한 상황이면 먼저 현지 긴급 번호로 전화하세요. 앱은 긴급 출동을 대신하지 않습니다.
      </p>

      {numbers ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <a href={`tel:${numbers.police}`} className="button button-outline-dark">경찰 {numbers.police}</a>
          <a href={`tel:${numbers.ambulance}`} className="button button-outline-dark">구급 {numbers.ambulance}</a>
        </div>
      ) : (
        <p className="muted" style={{ fontSize: 13 }}>{countryLabel}의 긴급 번호가 등록되어 있지 않습니다. 현지 대사관 번호를 확인해 주세요.</p>
      )}

      {partner && (
        <p style={{ fontSize: 13, margin: "0 0 12px" }}>
          배정 업체: {partner.name} · <a href={`tel:${partner.phone}`} className="text-link">{partner.phone}</a>
        </p>
      )}

      {sent ? (
        <p style={{ fontSize: 13 }}>긴급 알림을 보냈습니다. 가이드와 관리자가 확인합니다.</p>
      ) : (
        <>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="상황을 짧게 적어 주세요 (선택)"
            style={{ width: "100%" }}
          />
          <button onClick={send} disabled={busy} className="button" style={{ background: "#b91c1c", color: "#fff", marginTop: 8, width: "100%" }}>
            {busy ? "전송 중..." : "긴급 알림(SOS) 보내기"}
          </button>
        </>
      )}
    </div>
  );
}

