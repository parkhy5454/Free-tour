import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
const schema=z.object({name:z.string().min(2).max(80),email:z.email(),password:z.string().min(8).max(100),role:z.enum(["TRAVELER","GUIDE"]).default("TRAVELER"),country:z.string().max(100).optional()});
export async function POST(req:Request){
 try{const data=schema.parse(await req.json());const email=data.email.toLowerCase();if(await prisma.user.findUnique({where:{email}}))return NextResponse.json({error:"이미 가입된 이메일입니다."},{status:409});
 const user=await prisma.user.create({data:{name:data.name,email,passwordHash:await bcrypt.hash(data.password,12),role:data.role,country:data.country||null}});
 await createSession({id:user.id,role:user.role,name:user.name,email:user.email});return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e?.issues?.[0]?.message||"입력값을 확인해 주세요."},{status:400});}
}
