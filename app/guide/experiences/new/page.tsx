"use client";

import { useState } from "react";
import Link from "next/link";

// 가이드: 체험 상품 등록
export default function NewExperiencePage() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("체험이 등록되었습니다.");
        e.currentTarget.reset();
      } else {
        setIsError(true);
        setMsg(json.error || "등록에 실패했습니다.");
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
        <span className="eyebrow dark">LOCAL EXPERIENCE</span>
        <h1>체험 상품 등록</h1>
        <p>등록한 체험은 현지 체험 목록에 바로 올라갑니다. 도시와 국가는 가이드 프로필 기준입니다.</p>
      </div>
      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          <label className="span-two">
            체험 이름
            <input name="title" required minLength={3} maxLength={100} placeholder="예: 새벽 츠키지 시장 투어" />
          </label>
          <label className="span-two">
            체험 설명
            <textarea name="description" required minLength={20} maxLength={1500} rows={5} placeholder="무엇을 하고, 무엇을 먹고, 어떤 점이 특별한지 적어 주세요." />
          </label>
          <label>
            소요 시간 (시간)
            <input name="durationHours" type="number" min={1} max={12} defaultValue={2} required />
          </label>
          <label>
            최대 인원
            <input name="maxPeople" type="number" min={1} max={30} defaultValue={4} required />
          </label>
          <label className="span-two">
            가격 (원)
            <input name="price" type="number" min={1000} required placeholder="예: 80000" />
          </label>
        </div>
        {msg && <p className={isError ? "error" : "muted"} style={{ marginTop: 12 }}>{msg}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Link href="/dashboard" className="button button-outline-dark" style={{ flex: 1 }}>대시보드</Link>
          <button disabled={busy} className="button button-primary" style={{ flex: 2 }}>
            {busy ? "등록 중..." : "체험 등록"}
          </button>
        </div>
      </form>
    </main>
  );
}
