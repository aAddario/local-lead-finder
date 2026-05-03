import { Badge } from "@/components/ui/badge";

export function scoreTone(score: number) {
  if (score >= 80) return "green" as const;
  if (score >= 60) return "yellow" as const;
  if (score >= 40) return "outline" as const;
  return "red" as const;
}

export function ScoreBadge({ score, label }: { score: number; label: string }) {
  return <Badge tone={scoreTone(score)}>{score}/100 · {label}</Badge>;
}
