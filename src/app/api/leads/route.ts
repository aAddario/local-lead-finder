import { NextResponse } from "next/server";
import { listLeads, saveLead } from "@/lib/db";
import type { Lead } from "@/types/lead";

export async function GET() {
  return NextResponse.json({ leads: listLeads() });
}

export async function POST(req: Request) {
  try {
    const lead = (await req.json()) as Lead;
    const saved = saveLead(lead);
    return NextResponse.json({ lead: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao salvar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
