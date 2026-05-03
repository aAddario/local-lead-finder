import { NextResponse } from "next/server";
import { dashboardStats, listLeads, listSearches } from "@/lib/db";

export async function GET() {
  const leads = listLeads();
  const categories = new Map<string, number>();
  for (const lead of leads.filter((item) => item.score >= 60)) {
    categories.set(lead.category, (categories.get(lead.category) ?? 0) + 1);
  }
  return NextResponse.json({
    stats: dashboardStats(),
    searches: listSearches(),
    recentLeads: leads.slice(0, 8),
    topCategories: Array.from(categories.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  });
}
