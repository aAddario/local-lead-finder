import { fetchWithTimeout } from "@/lib/fetch-timeout";
import type { WebsiteAnalysisLabel } from "@/types/lead";

export type WebsiteAnalysisResult = {
  score: number;
  label: WebsiteAnalysisLabel;
  notes: string[];
};

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysisResult> {
  const notes: string[] = [];
  let html = "";

  try {
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": "LocalLeadFinder/0.1 website-check" },
      timeoutMs: 10000
    });
    if (!res.ok) {
      notes.push(`Site respondeu com status HTTP ${res.status}.`);
      return finish(15, notes);
    }
    html = await res.text();
    notes.push("Site carregou corretamente.");
  } catch {
    notes.push("Site não carregou corretamente.");
    return finish(10, notes);
  }

  const lower = html.toLowerCase();
  let score = 25;
  if (/wa\.me|whatsapp|api\.whatsapp/.test(lower)) {
    score += 15;
    notes.push("Possui botão ou link de WhatsApp.");
  } else {
    notes.push("Não encontrei botão claro de WhatsApp.");
  }

  if (/agend|orçament|orcament|contat|reserv|marcar|ligue|fale conosco/.test(lower)) {
    score += 15;
    notes.push("Possui CTA claro.");
  } else {
    notes.push("CTA principal não parece claro.");
  }

  if (/servi[cç]os|tratamentos|especialidades|card[aá]pio|produtos/.test(lower)) {
    score += 10;
    notes.push("Possui seção de serviços ou produtos.");
  } else {
    notes.push("Não encontrei seção de serviços clara.");
  }

  if (/<form|formul[aá]rio|input|textarea/.test(lower)) {
    score += 10;
    notes.push("Possui formulário de contato.");
  } else {
    notes.push("Não encontrei formulário de contato.");
  }

  if (/viewport/.test(lower)) {
    score += 10;
    notes.push("Tem sinal básico de responsividade.");
  } else {
    notes.push("Não encontrei meta viewport.");
  }

  if (/<title[^>]*>[^<]{8,}<\/title>/.test(lower)) {
    score += 8;
    notes.push("Possui título de página.");
  } else {
    notes.push("Título ausente ou fraco.");
  }

  if (/name=["']description["']/.test(lower)) {
    score += 7;
    notes.push("Possui descrição meta.");
  } else {
    notes.push("Descrição meta ausente.");
  }

  if (/copyright 20(0[0-9]|1[0-8])|flash|table layout|under construction|em constru[cç][aã]o/.test(lower)) {
    score -= 20;
    notes.push("Há sinais de site antigo ou incompleto.");
  }

  return finish(score, notes);
}

function finish(score: number, notes: string[]): WebsiteAnalysisResult {
  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  return { score: bounded, label: getWebsiteAnalysisLabel(bounded), notes };
}

function getWebsiteAnalysisLabel(score: number): WebsiteAnalysisLabel {
  if (score >= 70) return "Site bom";
  if (score >= 40) return "Site mediano";
  return "Site ruim";
}
