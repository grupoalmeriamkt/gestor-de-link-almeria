import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold">Gestor de Links Rastreáveis</h1>
      <p className="max-w-md text-muted-foreground">
        Publique links curtos em banners de parceiros e mantenha controle total sobre destino,
        número de WhatsApp, mensagem, campanha e rastreamento.
      </p>
      <Button asChild>
        <Link href="/admin">Acessar painel</Link>
      </Button>
    </main>
  );
}
