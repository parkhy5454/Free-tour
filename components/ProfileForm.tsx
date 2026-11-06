"use client";

import { useState } from "react";

type Props = {
  initial: { name: string; country: string; language: "ko" | "en" };
};

export default function ProfileForm({ initial }: Props) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMessage("저장되었습니다.");
      } else {
        setIsError(true);
        setMessage(json.error || "저장에 실패했습니다.");
      }
    } catch {
      setIsError(true);
      setMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label>
        이름
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          minLength={2}
          maxLength={80}
        />
      </label>
      <label>
        거주 국가
        <input
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          maxLength={100}
          placeholder="예: South Korea"
        />
      </label>
      <label>
        언어
        <select
          value={form.language}
          onChange={(e) => setForm((f) => ({ ...f, language: e.target.value as "ko" | "en" }))}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </label>
      {message && <p className={isError ? "error" : "muted"}>{message}</p>}
      <button disabled={busy} className="button button-primary full" style={{ marginTop: 20 }}>
        {busy ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
