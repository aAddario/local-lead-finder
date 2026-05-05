import { NextResponse } from "next/server";
import { z } from "zod";
import { getLead } from "@/lib/db";
import { generateLeadDiagnosis } from "@/lib/diagnosis";
import { generateLeadProposal } from "@/lib/proposal";
import { type MessageTone } from "@/lib/outreach";
import type { Lead } from "@/types/lead";

export const runtime = "nodejs";

const requestSchema = z.object({
  tone: z.enum(["short", "professional", "informal", "personalized"]).default("professional")
});

type ResponsesApiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string; type?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type AiProvider = "opencode-go" | "openai";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const lead = getLead(id);
    if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

    const { tone } = requestSchema.parse(await req.json().catch(() => ({})));
    const diagnosis = generateLeadDiagnosis(lead);
    const proposal = generateLeadProposal(lead);
    const prompt = buildPrompt(lead, tone, diagnosis, proposal.text);
    const provider = resolveProvider();
    const result = provider === "opencode-go"
      ? await generateWithOpenCodeGo(prompt)
      : await generateWithOpenAI(prompt);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao gerar mensagem IA.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function generateWithOpenCodeGo(prompt: string) {
  const apiKey = process.env.OPENCODE_GO_API_KEY;
  if (!apiKey) {
    throw new Error("Configure OPENCODE_GO_API_KEY em .env.local para usar OpenCode Go.");
  }

  const model = normalizeOpenCodeGoModel(process.env.OPENCODE_GO_MODEL || process.env.AI_MODEL || "kimi-k2.6");
  const baseUrl = process.env.OPENCODE_GO_BASE_URL || "https://opencode.ai/zen/go/v1/chat/completions";
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      max_tokens: 360,
      temperature: 0.5,
      messages: [
        { role: "system", content: buildInstructions() },
        { role: "user", content: prompt }
      ]
    }),
    signal: AbortSignal.timeout(25000)
  });

  const data = (await res.json().catch(() => ({}))) as ChatCompletionResponse;
  if (!res.ok) {
    throw new Error(data.error?.message ?? "Falha ao gerar mensagem no OpenCode Go.");
  }

  const message = extractChatCompletionText(data).trim();
  if (!message) throw new Error("OpenCode Go não retornou texto.");
  return { message, model, provider: "opencode-go" };
}

async function generateWithOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Configure OPENAI_API_KEY em .env.local ou use AI_PROVIDER=opencode-go com OPENCODE_GO_API_KEY.");
  }

  const model = process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-5.5";
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 360,
      instructions: buildInstructions(),
      input: prompt
    }),
    signal: AbortSignal.timeout(25000)
  });

  const data = (await res.json().catch(() => ({}))) as ResponsesApiResponse;
  if (!res.ok) {
    throw new Error(data.error?.message ?? "Falha ao gerar mensagem na OpenAI.");
  }

  const message = extractResponseText(data).trim();
  if (!message) throw new Error("OpenAI não retornou texto.");
  return { message, model, provider: "openai" };
}

function resolveProvider(): AiProvider {
  const configured = (process.env.AI_PROVIDER || "").toLowerCase();
  if (configured === "openai" || configured === "opencode-go") return configured;
  if (process.env.OPENCODE_GO_API_KEY) return "opencode-go";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "opencode-go";
}

function buildInstructions() {
  return [
    "Você é um assistente de prospecção B2B para negócios locais.",
    "Escreva em português do Brasil, com tom humano, direto e comercial.",
    "Não invente dados que não estejam no lead. Use no máximo uma mensagem pronta para WhatsApp.",
    "Evite parecer spam. Foque em uma melhoria digital concreta para esse negócio."
  ].join(" ");
}

function normalizeOpenCodeGoModel(model: string) {
  if (model.startsWith("opencode-go/")) return model.slice("opencode-go/".length);
  return model;
}

function extractChatCompletionText(data: ChatCompletionResponse) {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((item) => item.text ?? "").join("\n");
  return "";
}

function buildPrompt(
  lead: Lead,
  tone: MessageTone,
  diagnosis: ReturnType<typeof generateLeadDiagnosis>,
  proposal: string
) {
  return [
    `Lead: ${lead.name}`,
    `Categoria: ${lead.category}`,
    `Cidade: ${lead.city ?? "não informada"}`,
    `Telefone: ${lead.phone ?? "não informado"}`,
    `Site: ${lead.website ?? "sem site conhecido"}`,
    `Status do site: ${lead.websiteStatus}`,
    `Score: ${lead.score}/100 (${lead.scoreLabel})`,
    `Sinais positivos: ${lead.scorePositiveReasons.map((reason) => reason.label).join(", ") || "nenhum"}`,
    `Pontos de atenção: ${lead.scoreNegativeReasons.map((reason) => reason.label).join(", ") || "nenhum"}`,
    `Diagnóstico: ${diagnosis.likelyProblem}`,
    `Oportunidade: ${diagnosis.opportunity}`,
    `Solução sugerida: ${diagnosis.solutionSuggested}`,
    `Oferta base: ${proposal}`,
    `Tom desejado: ${tone}`,
    "",
    "Gere uma mensagem única para WhatsApp com 2 a 4 frases.",
    "A mensagem deve citar o nome da empresa e uma oportunidade específica.",
    "Inclua uma pergunta final leve para abrir conversa."
  ].join("\n");
}

function extractResponseText(data: ResponsesApiResponse) {
  if (typeof data.output_text === "string") return data.output_text;
  return data.output?.flatMap((item) => item.content?.map((content) => content.text ?? "") ?? []).join("\n") ?? "";
}
