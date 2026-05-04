import { generateLeadDiagnosis } from "@/lib/diagnosis";
import type { Lead } from "@/types/lead";

const columns = [
  "Nome",
  "Categoria",
  "Cidade",
  "Endereço",
  "Telefone",
  "Site",
  "Score",
  "Label do score",
  "Status",
  "Diagnóstico resumido",
  "Oferta recomendada",
  "Canal de contato",
  "Último contato",
  "Próxima ação",
  "Observações"
] as const;

export function leadsToCsv(leads: Lead[]) {
  const rows = leads.map((lead) => {
    const diagnosis = generateLeadDiagnosis(lead);
    return [
      lead.name,
      lead.category,
      lead.city ?? "",
      lead.address ?? "",
      lead.phone ?? "",
      lead.website ?? "",
      String(lead.score),
      lead.scoreLabel,
      lead.status,
      diagnosis.summary,
      diagnosis.recommendedOffer,
      lead.contactChannel ?? "",
      lead.lastContactAt ?? "",
      lead.nextActionAt ?? "",
      lead.notes
    ].map(escapeCsv).join(",");
  });
  return [columns.join(","), ...rows].join("\n");
}

function escapeCsv(value: string) {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}
