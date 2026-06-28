import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "SPEC76 OS is running",
  });
}