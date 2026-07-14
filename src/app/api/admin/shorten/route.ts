import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWriter } from "@/lib/server/api-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { shortenOne } from "@/lib/server/shorten";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  url: z.string().min(1).max(2048),
  slug: z.string().max(80).optional().nullable(),
  utm_source: z.string().max(150).optional().nullable(),
  utm_medium: z.string().max(150).optional().nullable(),
  utm_campaign: z.string().max(150).optional().nullable(),
  utm_content: z.string().max(150).optional().nullable(),
  utm_term: z.string().max(150).optional().nullable(),
});
const bodySchema = z.object({ items: z.array(itemSchema).min(1).max(100) });

export async function POST(req: NextRequest) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  }

  const db = createAdminSupabase();
  const results = [];
  // Sequencial para garantir unicidade de slug entre itens do mesmo lote.
  for (const item of parsed.data.items) {
    results.push(await shortenOne(db, item, auth.profile.id));
  }
  return NextResponse.json({ results });
}
