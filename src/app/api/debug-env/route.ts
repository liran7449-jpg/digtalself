import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasAuthHash: !!process.env.AUTH_PASSWORD_HASH,
    hashLength: process.env.AUTH_PASSWORD_HASH?.length || 0,
    fullHash: process.env.AUTH_PASSWORD_HASH || '',
  });
}
