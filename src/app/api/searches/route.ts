import { NextResponse } from "next/server";
import { listSearches } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ searches: listSearches() });
}
