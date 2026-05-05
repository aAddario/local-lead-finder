import { NextResponse } from "next/server";
import { getSearch } from "@/lib/db";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const search = getSearch(id);
  if (!search) return NextResponse.json({ error: "Busca não encontrada" }, { status: 404 });
  return NextResponse.json({ search });
}
