import { NextResponse } from "next/server";
import { leadsToCsv } from "@/lib/csv";
import { listLeads } from "@/lib/db";

export async function GET() {
  return new NextResponse(leadsToCsv(listLeads()), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=leads-locais.csv"
    }
  });
}
