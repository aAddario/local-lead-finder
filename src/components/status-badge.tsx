import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/types/lead";

export function StatusBadge({ status }: { status: LeadStatus }) {
  const tone = status === "Fechado" ? "green" : status === "Descartado" ? "red" : status === "Novo" ? "blue" : "yellow";
  return <Badge tone={tone}>{status}</Badge>;
}
