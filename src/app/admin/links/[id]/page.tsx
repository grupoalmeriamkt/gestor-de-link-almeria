import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/server/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui/primitives";
import { formatWhatsappNumber } from "@/lib/services/whatsapp";
import { LinkActions } from "./link-actions";
import type { TrackedLink } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;
  const db = await createServerSupabase();
  const { data } = await db
    .from("tracked_links")
    .select("*, partner:partners(name), campaign:campaigns(name), placement:placements(name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const link = data as unknown as TrackedLink & {
    partner: { name: string } | null;
    campaign: { name: string } | null;
    placement: { name: string } | null;
  };

  const { data: versions } = await db
    .from("link_versions")
    .select("version_number, whatsapp_number, created_at")
    .eq("tracked_link_id", id)
    .order("version_number", { ascending: false });

  const domain = process.env.NEXT_PUBLIC_REDIRECT_DOMAIN ?? "";
  const publicUrl = `${domain}/r/${link.slug}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? domain;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 1, width: 180 });
  const pixelSnippet = `<img src="${appUrl}/api/banner/impression/${link.id}" width="1" height="1" alt="" style="display:none" />`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{link.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{publicUrl}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={link.status === "active" ? "default" : "secondary"}>{link.status}</Badge>
          <Button asChild variant="outline" size="sm"><Link href={`/admin/links/${id}/edit`}>Editar</Link></Button>
        </div>
      </div>

      <LinkActions id={id} status={link.status} publicUrl={publicUrl} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Configuração atual (v{link.current_version})</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Destino" value={link.destination_type} />
            <Row label="Modo" value={link.redirect_mode} />
            <Row label="Parceiro" value={link.partner?.name ?? "—"} />
            <Row label="Campanha" value={link.campaign?.name ?? "—"} />
            <Row label="Posicionamento" value={link.placement?.name ?? "—"} />
            {link.destination_type === "whatsapp" && (
              <>
                <Row label="Número" value={link.whatsapp_number ? formatWhatsappNumber(link.whatsapp_number) : "—"} />
                <div>
                  <p className="text-xs text-muted-foreground">Mensagem</p>
                  <p className="whitespace-pre-wrap rounded bg-muted p-2 text-xs">{link.whatsapp_message_template}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>QR Code & Pixel</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code" className="rounded border" />
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Pixel de impressão (envie ao parceiro)</p>
              <pre className="overflow-x-auto rounded bg-muted p-2 text-[10px]">{pixelSnippet}</pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Histórico de versões</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1">Versão</th><th>Número</th><th>Criada em</th></tr></thead>
            <tbody>
              {(versions ?? []).map((v) => (
                <tr key={v.version_number} className="border-t">
                  <td className="py-1">v{v.version_number}</td>
                  <td>{v.whatsapp_number ? formatWhatsappNumber(v.whatsapp_number) : "—"}</td>
                  <td>{new Date(v.created_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
