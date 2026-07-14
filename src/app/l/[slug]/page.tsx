import { notFound, redirect } from "next/navigation";
import { getPublicLandingConfig } from "@/lib/server/public-config";
import { LandingForm } from "./landing-form";

export const dynamic = "force-dynamic";

export default async function LandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ c?: string; test?: string }>;
}) {
  const { slug } = await params;
  const { c: clickCode, test } = await searchParams;

  const config = await getPublicLandingConfig(slug);
  if (!config) notFound();
  if (config.status !== "active") redirect(`/unavailable?reason=${config.status}`);
  if (!clickCode) redirect(`/r/${slug}`);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        {test === "1" && (
          <div className="mb-4 rounded-md bg-yellow-100 px-3 py-2 text-center text-xs font-semibold text-yellow-800">
            MODO DE TESTE — não conta nas métricas
          </div>
        )}
        <h1 className="text-xl font-bold">{config.landing_title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">{config.landing_description}</p>
        <LandingForm config={config} clickCode={clickCode} isTest={test === "1"} />
      </div>
    </main>
  );
}
