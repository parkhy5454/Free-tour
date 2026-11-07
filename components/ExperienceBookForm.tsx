"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 체험 상품 예약 폼. 날짜와 인원만 고르면 바로 예약됩니다.
export default function ExperienceBookForm({ experienceId, maxPeople }: { experienceId: string; maxPeople: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/experiences/${experienceId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: fd.get("startDate"), partySize: fd.get("partySize") }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/bookings");
        return;
      }
      setMsg(json.error || "예약에 실패했습니다.");
    } catch {
      setMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit} style={{ marginTop: 20 }}>
      <div className="form-grid">
        <label>
          여행 날짜
          <input name="startDate" type="date" required />
        </label>
        <label>
          인원
          <input name="partySize" type="number" min={1} max={maxPeople} defaultValue={1} required />
        </label>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        결제 연동 전이므로 예약은 확정 상태로만 기록되고, 결제는 되지 않습니다.
      </p>
      {msg && <p className="error" style={{ marginTop: 10 }}>{msg}</p>}
      <button disabled={busy} className="button button-primary" style={{ marginTop: 16, width: "100%" }}>
        {busy ? "예약 중..." : "이 체험 예약하기"}
      </button>
    </form>
  );
}
