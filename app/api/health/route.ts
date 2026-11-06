import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({status:"ok",service:"FreeTour",timestamp:new Date().toISOString()});}
