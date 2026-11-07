"use client";

import { useState } from "react";
import Link from "next/link";
import { COUNTRIES } from "@/lib/countries";

// 누구나 바로 픽업 파트너로 등록됩니다. 사업자·면허·차량 정보와 약관 동의가 필요합니다.
export default function PartnerJoinPage() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      country: fd.get("country"),
      phone: fd.get("phone"),
      email: fd.get("email") || "",
      businessNumber: fd.get("businessNumber"),
      licenseNumber: fd.get("licenseNumber"),
      vehiclePlates: String(fd.get("vehiclePlates") || "")
        .split(/[,\n]/)
        .map((v) => v.trim())
        .filter(Boolean),
      agreeTerms: fd.get("agreeTerms") === "on" ? true : false,
    };
    try {
      const res = await fetch("/api/partner/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
      } else {
        setMsg(json.error || "등록에 실패했습니다.");
      }
    } catch {
      setMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="page-shell narrow">
        <span className="eyebrow dark">PICKUP PARTNER</span>
        <h1>파트너 등록이 완료되었습니다</h1>
        <p>이제 여행자의 픽업이 자동으로 배정됩니다. 배정된 픽업은 파트너 센터에서 수락해 주세요.</p>
        <Link href="/partner" className="button button-primary" style={{ marginTop: 16 }}>파트너 센터로 이동</Link>
      </main>
    );
  }

  return (
    <main className="page-shell narrow">
      <div className="page-title">
        <span className="eyebrow dark">PICKUP PARTNER</span>
        <h1>픽업 파트너 등록</h1>
        <p>공항 픽업 차량과 기사를 운영하는 업체라면 바로 등록해 배정을 받을 수 있습니다.</p>
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
          <label>
            사업자등록번호
            <input name="businessNumber" required minLength={5} maxLength={30} placeholder="000-00-00000" />
          </label>
          <label>
            운송 면허 번호
            <input name="licenseNumber" required minLength={3} maxLength={50} />
          </label>
          <label className="span-two">
            이메일 (선택)
            <input name="email" type="email" placeholder="contact@example.com" />
          </label>
          <label className="span-two">
            운행 차량 번호 (쉼표 또는 줄바꿈으로 구분)
            <textarea name="vehiclePlates" required rows={3} placeholder="12가 3456, 34나 7788" />
          </label>
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 14, fontSize: 13 }}>
          <input type="checkbox" name="agreeTerms" required style={{ width: "auto", marginTop: 3 }} />
          <span>
            파트너 약관에 동의합니다. 픽업 운송 중 발생한 사고와 분쟁에 대한 책임은 운송 업체에 있으며, 여행자의 개인정보는 배정된 픽업 처리 목적에만 사용합니다.
          </span>
        </label>

        {msg && <p className="error" style={{ marginTop: 12 }}>{msg}</p>}
        <button disabled={busy} className="button button-primary" style={{ marginTop: 18, width: "100%" }}>
          {busy ? "등록 중..." : "파트너로 등록하기"}
        </button>
      </form>
    </main>
  );
}
