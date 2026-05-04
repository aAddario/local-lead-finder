import { NextResponse } from "next/server";
import { analyzeWebsite } from "@/lib/website-analysis";
import { getLead, updateLead } from "@/lib/db";

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const lead = getLead(id);
    if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    if (!lead.website) return NextResponse.json({ error: "Lead não possui site para analisar" }, { status: 400 });

    const analysis = await analyzeWebsite(lead.website);
    const updated = updateLead(id, {
      websiteAnalysisScore: analysis.score,
      websiteAnalysisLabel: analysis.label,
      websiteAnalysisNotes: analysis.notes,
      websiteAnalyzedAt: new Date().toISOString(),
      websiteStatus: analysis.label === "Site ruim" ? "bad_website" : analysis.label === "Site bom" ? "good_website" : "has_website",
      hasVerifiedWebsite: true,
      lastCheckedAt: new Date().toISOString()
    });

    return NextResponse.json({ lead: updated, analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao analisar site";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
