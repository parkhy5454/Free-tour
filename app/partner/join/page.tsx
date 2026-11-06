"use client";

import { useState } from "react";
import { COUNTRIES } from "@/lib/countries";

// 누구나 픽업 파트너(운송 업체)로 신청할 수 있습니다. 신청 후 관리자 승인이 필요합니다.
export default function PartnerJoinPage() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/partner/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("파트너 신청이 접수되었습니다. 관리자 승인 후 배정 요청을 받을 수 있습니다.");
        e.currentTarget.reset();
      } else {
        setIsError(true);
        setMsg(json.error || "신청에 실패했습니다.");
      }
    } catch {
      setIsError(true);
      setMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-shell narrow">
      <div className="page-title">
        <span className="eyebrow dark">PICKUP PARTNER</span>
        <h1>픽업 파트너 신청</h1>
        <p>공항 픽업 차량과 기사를 운영하는 업체라면 누구나 신청할 수 있습니다. 승인 후 여행자의 픽업 요청을 배정받습니다.</p>
      </div>
      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          <label className="span-two">
            업체명
            <input name="name" required minLength={2} maxLength={100} placeholder="예: OO 트랜스퍼" />
          </label>
          <label>
            운영 국가
            <select name="country" required defaultValue="">
              <option value="" disabled>국가를 선택하세요</option>
              {COUNTRIES.map((c) => (
                <option key={c.name} value={c.name}>{c.label} ({c.name})</option>
              ))}
            </select>
          </label>
          <label>
            연락처
            <input name="phone" required minLength={6} maxLength={30} placeholder="예: +82 10-0000-0000" />
          </label>
          <label className="span-two">
            이메일 (선택)
            <input name="email" type="email" placeholder="contact@example.com" />
          </label>
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          차량 면허와 보험이 있는 업체만 신청해 주세요. 관리자가 확인한 뒤 승인합니다.
        </p>
        {msg && <p className={isError ? "error" : "muted"} style={{ marginTop: 12 }}>{msg}</p>}
        <button disabled={busy} className="button button-primary" style={{ marginTop: 18, width: "100%" }}>
          {busy ? "신청 중..." : "파트너 신청하기"}
        </button>
      </form>
    </main>
  );
}
