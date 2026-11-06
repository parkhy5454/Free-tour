"use client";
import { useState } from "react";
import Link from "next/link";
export default function Login() {
 const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const data=Object.fromEntries(new FormData(e.currentTarget));const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const j=await res.json();setBusy(false);if(res.ok)location.href="/dashboard";else setError(j.error||"로그인에 실패했습니다.");}
 return <main className="auth-shell"><form className="auth-card" onSubmit={submit}><span className="eyebrow dark">WELCOME BACK</span><h1>로그인</h1><p>FreeTour에서 다음 여행을 시작하세요.</p><label>이메일<input name="email" type="email" required placeholder="name@example.com"/></label><label>비밀번호<input name="password" type="password" required/></label>{error&&<p className="error">{error}</p>}<button disabled={busy} className="button button-primary full">{busy?"로그인 중...":"로그인"}</button><p className="auth-foot">계정이 없나요? <Link href="/register">회원가입</Link></p></form></main>;
}
