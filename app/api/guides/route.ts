import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
export async function POST(req:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"먼저 회원가입 또는 로그인해 주세요."},{status:401});
 try{const d=z.object({headline:z.string().min(4).max(120),bio:z.string().min(20).max(3000),country:z.string().min(2),city:z.string().min(2),languages:z.string(),specialties:z.string(),hourlyRate:z.coerce.number().int().positive(),currency:z.string().length(3)}).parse(await req.json());
 const profile=await prisma.guideProfile.upsert({where:{userId:user.id},create:{userId:user.id,...d,languages:d.languages.split(",").map(x=>x.trim()).filter(Boolean),specialties:d.specialties.split(",").map(x=>x.trim()).filter(Boolean)},update:{...d,languages:d.languages.split(",").map(x=>x.trim()).filter(Boolean),specialties:d.specialties.split(",").map(x=>x.trim()).filter(Boolean)}});
 await prisma.user.update({where:{id:user.id},data:{role:"GUIDE"}});return NextResponse.json({ok:true,id:profile.id});
 }catch(e:any){return NextResponse.json({error:e?.issues?.[0]?.message||"프로필을 등록하지 못했습니다."},{status:400});}
}
