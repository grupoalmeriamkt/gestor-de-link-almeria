const MESSAGES: Record<string, { title: string; description: string }> = {
  not_found: { title: "Link não encontrado", description: "Este endereço não existe ou foi removido." },
  paused: { title: "Link pausado", description: "Este link está temporariamente indisponível." },
  archived: { title: "Link arquivado", description: "Este link não está mais ativo." },
  expired: { title: "Link expirado", description: "O período deste link já terminou." },
  not_started: { title: "Ainda não disponível", description: "Este link ainda não começou." },
  misconfigured: { title: "Link indisponível", description: "Configuração incompleta. Tente novamente mais tarde." },
};

export default async function UnavailablePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const msg = MESSAGES[reason ?? "not_found"] ?? MESSAGES.not_found!;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-bold">{msg.title}</h1>
      <p className="max-w-sm text-muted-foreground">{msg.description}</p>
    </main>
  );
}
