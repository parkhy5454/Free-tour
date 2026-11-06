import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
export async function POST(req:Request){
 try{const d=z.object({email:z.email(),password:z.string().min(1)}).parse(await req.json());const user=await prisma.user.findUnique({where:{email:d.email.toLowerCase()}});
 if(!user||!(await bcrypt.compare(d.password,user.passwordHash)))return NextResponse.json({error:"이메일 또는 비밀번호가 올바르지 않습니다."},{status:401});
 await createSession({id:user.id,role:user.role,name:user.name,email:user.email});return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"로그인 정보를 확인해 주세요."},{status:400});}
}
