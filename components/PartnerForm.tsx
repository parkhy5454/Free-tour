"use client";

import { useState } from "react";
import { COUNTRIES } from "@/lib/countries";

export default function PartnerForm() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/transfer-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          country: fd.get("country"),
          phone: fd.get("phone"),
          email: fd.get("email") || "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("파트너가 등록되었습니다.");
        location.reload();
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
    <form onSubmit={submit}>
      <div className="form-grid">
        <label>
          업체명
          <input name="name" required minLength={2} maxLength={100} placeholder="예: OO 공항 픽업" />
        </label>
        <label>
          국가
          <select name="country" required defaultValue="">
            <option value="" disabled>국가 선택</option>
            {COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>{c.label} ({c.name})</option>
            ))}
          </select>
        </label>
        <label>
          연락처
          <input name="phone" required minLength={6} maxLength={30} placeholder="+82-10-0000-0000" />
        </label>
        <label>
          이메일 (선택)
          <input name="email" type="email" placeholder="ops@example.com" />
        </label>
      </div>
      <button disabled={busy} className="button button-primary" style={{ marginTop: 16 }}>
        {busy ? "등록 중..." : "파트너 등록"}
      </button>
      {msg && <p className={isError ? "error" : "muted"}>{msg}</p>}
    </form>
  );
}
