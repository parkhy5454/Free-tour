import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { COUNTRY_NAMES } from "@/lib/countries";
export async function GET(){
 const user=await getSession();
 if(!user)return NextResponse.json({error:"로그인이 필요합니다."},{status:401});
 const profile=await prisma.guideProfile.findUnique({where:{userId:user.id}});
 if(!profile)return NextResponse.json({error:"가이드 프로필 등록 후 이용해 주세요."},{status:403});
 const requests=await prisma.tripRequest.findMany({where:{status:"OPEN",travelerId:{not:user.id},country:profile.country},select:{id:true,country:true,city:true,startDate:true,hours:true,partySize:true,interests:true,details:true,budget:true,currency:true,createdAt:true},orderBy:{createdAt:"desc"},take:100});
 return NextResponse.json({requests});
}

export async function POST(req:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"여행 요청은 로그인 후 이용할 수 있습니다."},{status:401});
 try{const d=z.object({country:z.enum(COUNTRY_NAMES,{error:"지원하지 않는 국가입니다. 목록에서 선택해 주세요."}),city:z.string().min(2),startDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)), "올바른 날짜를 입력해 주세요."),hours:z.coerce.number().int().min(1).max(24),partySize:z.coerce.number().int().min(1).max(30),interests:z.string().optional(),details:z.string().min(10).max(3000),budget:z.union([z.coerce.number().int().positive(),z.literal("")]).optional(),currency:z.string().length(3)}).parse(await req.json());
 const request=await prisma.tripRequest.create({data:{travelerId:user.id,country:d.country,city:d.city,startDate:new Date(d.startDate),hours:d.hours,partySize:d.partySize,interests:(d.interests||"").split(",").map(x=>x.trim()).filter(Boolean),details:d.details,budget:d.budget?Number(d.budget):null,currency:d.currency}});
 return NextResponse.json({ok:true,id:request.id});
 }catch(e:any){return NextResponse.json({error:e?.issues?.[0]?.message||"여행 요청을 등록하지 못했습니다."},{status:400});}
}
