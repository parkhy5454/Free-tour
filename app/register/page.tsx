"use client";
import { useState } from "react";
import Link from "next/link";
export default function Register() {
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const data=Object.fromEntries(new FormData(e.currentTarget));
    const res=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    const json=await res.json(); setBusy(false);
    if(res.ok) location.href="/dashboard"; else setError(json.error||"가입에 실패했습니다.");
  }
  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}><span className="eyebrow dark">JOIN FREETOUR</span><h1>회원가입</h1><p>여행자 또는 현지 가이드로 시작하세요.</p><label>이름<input name="name" required minLength={2} placeholder="이름"/></label><label>이메일<input name="email" type="email" required placeholder="name@example.com"/></label><label>비밀번호<input name="password" type="password" required minLength={8} placeholder="8자 이상"/></label><label>가입 유형<select name="role"><option value="TRAVELER">여행자</option><option value="GUIDE">현지 가이드</option></select></label><label>거주 국가<input name="country" placeholder="예: South Korea"/></label>{error&&<p className="error">{error}</p>}<button disabled={busy} className="button button-primary full">{busy?"가입 중...":"무료 회원가입"}</button><p className="auth-foot">이미 계정이 있나요? <Link href="/login">로그인</Link></p></form></main>;
}
