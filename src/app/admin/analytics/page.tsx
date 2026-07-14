import { redirect } from "next/navigation";

// Analytics detalhado reutiliza o dashboard (mesma agregação e filtros).
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const { test } = await searchParams;
  redirect(test === "1" ? "/admin/dashboard?test=1" : "/admin/dashboard");
}
