import { NextResponse } from "next/server";
import { z } from "zod";
import { updateLead } from "@/lib/db";
import { leadStatuses } from "@/types/lead";

const patchSchema = z
  .object({
    status: z.enum(leadStatuses).optional(),
    notes: z.string().max(5000).optional(),
    phone: z.string().max(120).nullable().optional(),
    website: z.string().max(500).nullable().optional()
  })
  .refine((patch) => Object.keys(patch).length > 0, "Nenhum campo de atualização fornecido");

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const lead = updateLead(id, patchSchema.parse(await req.json()));
    if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
