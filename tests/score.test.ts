import { describe, expect, it } from "vitest";

import { isHighTicketCategory } from "@/lib/categories";
import { calculateLeadScore, looksLikeFranchise, normalizeText } from "@/lib/score";

const baseLead = {
  name: "Clínica Boa Saúde",
  category: "Clínica médica",
  phone: "+5583999999999",
  website: null,
  address: "Rua das Flores, 120 | Centro - Patos",
  rawTags: {
    "addr:street": "Rua das Flores",
    "addr:housenumber": "120",
    "addr:city": "Patos"
  }
};

describe("lead scoring", () => {
  it("normalizes accents before matching high-ticket categories", () => {
    expect(isHighTicketCategory("Clínica médica")).toBe(true);
    expect(isHighTicketCategory("Escritório contábil")).toBe(true);
    expect(isHighTicketCategory("Loja de móveis")).toBe(true);
  });

  it("prioritizes local high-ticket businesses that have contact data and no website", () => {
    const result = calculateLeadScore(baseLead);

    expect(result.score).toBe(100);
    expect(result.scoreLabel).toBe("Ótimo lead");
    expect(result.positiveReasons.map((reason) => reason.label)).toContain("Nicho de alto ticket");
    expect(result.negativeReasons).toHaveLength(0);
  });

  it("penalizes chains and businesses that already have a website", () => {
    const result = calculateLeadScore({
      ...baseLead,
      name: "Smart Fit Centro",
      category: "Academia",
      website: "https://smartfit.com.br",
      rawTags: {
        ...baseLead.rawTags,
        brand: "Smart Fit"
      }
    });

    expect(looksLikeFranchise("Smart Fit Centro", { brand: "Smart Fit" })).toBe(true);
    expect(result.negativeReasons.map((reason) => reason.label)).toEqual(
      expect.arrayContaining(["Possui site cadastrado", "Parece franquia ou rede grande"])
    );
    expect(result.score).toBeLessThan(60);
  });

  it("keeps text normalization deterministic for matching and deduplication", () => {
    expect(normalizeText("Clínica São João — Centro!")).toBe("clinica sao joao centro");
  });
});
