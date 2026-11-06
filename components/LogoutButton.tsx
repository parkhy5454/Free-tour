"use client";
export default function LogoutButton() {
  return <button className="button button-outline-dark" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/"; }}>로그아웃</button>;
}
