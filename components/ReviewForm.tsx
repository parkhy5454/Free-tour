"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  bookingId: string;
  guideName: string;
  place: string;
};

export default function ReviewForm({ bookingId, guideName, place }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating, comment }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        location.href = "/bookings";
        return;
      }
      setError(json.error || "후기 저장에 실패했습니다.");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <p className="muted" style={{ margin: 0 }}>{place} · 가이드 {guideName}</p>

      <label style={{ marginTop: 22 }}>
        평점
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          <option value={5}>★★★★★ 매우 만족 (5점)</option>
          <option value={4}>★★★★☆ 만족 (4점)</option>
          <option value={3}>★★★☆☆ 보통 (3점)</option>
          <option value={2}>★★☆☆☆ 아쉬움 (2점)</option>
          <option value={1}>★☆☆☆☆ 불만족 (1점)</option>
        </select>
      </label>

      <label style={{ marginTop: 18 }}>
        후기
        <textarea
          rows={6}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          minLength={10}
          maxLength={1500}
          required
          placeholder="여행 경험을 자세히 알려주세요. (10자 이상)"
        />
      </label>
      <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{comment.length} / 1500자</p>

      {error && <p className="error">{error}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <Link href="/bookings" className="button button-outline-dark" style={{ flex: 1 }}>취소</Link>
        <button disabled={busy} className="button button-primary" style={{ flex: 2 }}>
          {busy ? "저장 중..." : "후기 등록"}
        </button>
      </div>
    </form>
  );
}
