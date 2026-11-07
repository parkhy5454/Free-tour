"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { id: string; body: string; senderId: string; createdAt: string };

// 예약 채팅 박스. 4초마다 새 메시지를 가져옵니다 (실시간 푸시가 아닌 주기적 갱신).
export default function ChatBox({ bookingId, disabled }: { bookingId: string; disabled: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [me, setMe] = useState<string>("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<string | null>(null);

  async function load(initial: boolean) {
    try {
      const url = `/api/bookings/${bookingId}/messages${!initial && lastRef.current ? `?after=${encodeURIComponent(lastRef.current)}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setMe(json.me);
      if (json.messages.length) {
        lastRef.current = json.messages[json.messages.length - 1].createdAt;
        setMessages((prev) => (initial ? json.messages : [...prev, ...json.messages]));
      }
    } catch {
      // 네트워크 일시 오류는 다음 주기에 다시 시도합니다.
    }
  }

  useEffect(() => {
    load(true);
    const timer = setInterval(() => load(false), 4000);
    return () => clearInterval(timer);
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "전송에 실패했습니다.");
        return;
      }
      setText("");
      lastRef.current = json.message.createdAt;
      setMessages((prev) => [...prev, json.message]);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ height: 420, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && <p className="muted">아직 메시지가 없습니다. 먼저 인사를 건네 보세요.</p>}
        {messages.map((m) => {
          const mine = m.senderId === me;
          return (
            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
              <div style={{ background: mine ? "var(--navy)" : "var(--paper)", color: mine ? "#fff" : "inherit", padding: "8px 12px", borderRadius: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {m.body}
              </div>
              <div className="muted" style={{ fontSize: 11, textAlign: mine ? "right" : "left" }}>
                {new Date(m.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--line, #e5e5e5)" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          disabled={disabled || busy}
          placeholder={disabled ? "취소된 예약입니다" : "메시지를 입력하세요"}
          style={{ flex: 1 }}
        />
        <button className="button button-primary" disabled={disabled || busy || !text.trim()}>보내기</button>
      </form>
      {error && <p className="error" style={{ padding: "0 12px 12px" }}>{error}</p>}
    </div>
  );
}
