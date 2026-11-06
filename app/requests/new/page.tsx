"use client";
import { useState } from "react";
import { COUNTRIES } from "@/lib/countries";

export default function NewRequest() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    const j = await res.json();
    setBusy(false);
    if (res.ok) {
      setMsg("여행 요청이 등록되었습니다. 가이드의 제안을 기다려 주세요.");
      e.currentTarget.reset();
    } else {
      setMsg(j.error || "로그인 후 이용해 주세요.");
    }
  }

  return (
    <main className="page-shell narrow">
      <div className="page-title">
        <span className="eyebrow dark">CREATE YOUR EXPERIENCE</span>
        <h1>맞춤 여행 요청</h1>
        <p>원하는 여행을 설명하면 현지 가이드가 일정과 가격을 제안합니다.</p>
      </div>
      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          <label>
            국가
            <select name="country" required defaultValue="">
              <option value="" disabled>국가를 선택하세요</option>
              {COUNTRIES.map((c) => (
                <option key={c.name} value={c.name}>{c.label} ({c.name})</option>
              ))}
            </select>
          </label>
          <label>도시<input name="city" required placeholder="Tokyo"/></label>
          <label>여행 시작일<input name="startDate" type="date" required/></label>
          <label>
            이용 시간
            <select name="hours">
              <option value="1">1시간</option>
              <option value="2">2시간</option>
              <option value="4">4시간</option>
              <option value="8">8시간</option>
            </select>
          </label>
          <label>인원<input name="partySize" type="number" min="1" defaultValue="1"/></label>
          <label>예산 (선택)<input name="budget" type="number" min="0" placeholder="예: 150000"/></label>
          <label>
            통화
            <select name="currency">
              <option>KRW</option>
              <option>USD</option>
              <option>EUR</option>
              <option>JPY</option>
            </select>
          </label>
          <label>관심 분야<input name="interests" placeholder="Food, Culture, Shopping"/></label>
          <label className="span-two">
            원하는 여행 설명
            <textarea name="details" required minLength={10} rows={5} placeholder="가고 싶은 장소, 선호하는 일정, 특별히 원하는 경험을 적어 주세요."/>
          </label>
        </div>
        <button disabled={busy} className="button button-primary full">{busy ? "등록 중..." : "여행 요청 등록"}</button>
        {msg && <p className="notice">{msg}</p>}
      </form>
    </main>
  );
}
