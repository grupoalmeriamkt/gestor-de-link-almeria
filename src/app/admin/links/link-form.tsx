"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui/primitives";
import { slugify } from "@/lib/services/slug";
import { buildWhatsappUrl, formatWhatsappNumber, normalizeWhatsappNumber } from "@/lib/services/whatsapp";
import { TEMPLATE_VARIABLES } from "@/lib/services/template";
import type { TrackedLink, Partner, Campaign, Placement } from "@/lib/types";

type DestType = "whatsapp" | "external_url" | "internal_landing";
type Mode = "direct" | "capture_simple" | "capture_complete" | "custom_landing";

interface Props {
  mode: "create" | "edit";
  initial?: Partial<TrackedLink>;
  partners: Pick<Partner, "id" | "name">[];
  campaigns: Pick<Campaign, "id" | "name" | "partner_id">[];
  placements: Pick<Placement, "id" | "name" | "campaign_id">[];
  redirectDomain: string;
}

export function LinkForm({ mode, initial, partners, campaigns, placements, redirectDomain }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [f, setF] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    partner_id: initial?.partner_id ?? "",
    campaign_id: initial?.campaign_id ?? "",
    placement_id: initial?.placement_id ?? "",
    destination_type: (initial?.destination_type ?? "whatsapp") as DestType,
    redirect_mode: (initial?.redirect_mode ?? "direct") as Mode,
    whatsapp_number: initial?.whatsapp_number ?? "",
    whatsapp_message_template:
      initial?.whatsapp_message_template ??
      "Olá, meu nome é {{nome}}. Vim do site {{parceiro}} e quero falar com o concierge. Código: {{click_id}}",
    external_url: initial?.external_url ?? "",
    capture_name: initial?.capture_name ?? true,
    capture_phone: initial?.capture_phone ?? false,
    capture_email: initial?.capture_email ?? false,
    capture_interest: initial?.capture_interest ?? false,
    name_required: initial?.name_required ?? false,
    phone_required: initial?.phone_required ?? false,
    email_required: initial?.email_required ?? false,
    interest_required: initial?.interest_required ?? false,
    landing_title: initial?.landing_title ?? "Fale com nosso concierge",
    landing_description: initial?.landing_description ?? "Para começarmos, como podemos chamar você?",
    button_text: initial?.button_text ?? "Continuar para o WhatsApp",
    starts_at: initial?.starts_at?.slice(0, 16) ?? "",
    ends_at: initial?.ends_at?.slice(0, 16) ?? "",
    status: (initial?.status ?? "active") as TrackedLink["status"],
  });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const publicUrl = `${redirectDomain}/r/${f.slug || "seu-slug"}`;

  const preview = useMemo(() => {
    const ctx = {
      nome: "Alex",
      parceiro: partners.find((p) => p.id === f.partner_id)?.name ?? "Parceiro X",
      campanha: campaigns.find((c) => c.id === f.campaign_id)?.name ?? null,
      banner: placements.find((p) => p.id === f.placement_id)?.name ?? null,
      click_id: "CK72DA",
      data: new Date().toLocaleDateString("pt-BR"),
    };
    const url = f.whatsapp_number
      ? buildWhatsappUrl(f.whatsapp_number, f.whatsapp_message_template, ctx)
      : "";
    // Extrai a mensagem decodificada da URL para exibir.
    const msg = url.includes("text=")
      ? decodeURIComponent(url.split("text=")[1] ?? "")
      : "";
    return { url, msg };
  }, [f.whatsapp_number, f.whatsapp_message_template, f.partner_id, f.campaign_id, f.placement_id, partners, campaigns, placements]);

  const filteredCampaigns = campaigns.filter((c) => !f.partner_id || c.partner_id === f.partner_id);
  const filteredPlacements = placements.filter((p) => !f.campaign_id || p.campaign_id === f.campaign_id);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const payload = {
      ...f,
      whatsapp_number: f.whatsapp_number ? normalizeWhatsappNumber(f.whatsapp_number) : null,
      partner_id: f.partner_id || null,
      campaign_id: f.campaign_id || null,
      placement_id: f.placement_id || null,
      external_url: f.external_url || null,
      capture_enabled: f.redirect_mode !== "direct",
      starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null,
      ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null,
    };
    const url = mode === "create" ? "/api/admin/links" : `/api/admin/links/${initial?.id}`;
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const fieldErrors = data?.issues?.fieldErrors ?? {};
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(fieldErrors)) flat[k] = (v as string[])[0] ?? "Inválido";
      setErrors(flat);
      return;
    }
    const data = await res.json();
    router.push(`/admin/links/${data.link.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {/* Identificação */}
        <Card>
          <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nome interno" error={errors.name}>
              <Input value={f.name} onChange={(e) => { set("name", e.target.value); if (mode === "create" && !initial?.slug) set("slug", slugify(e.target.value)); }} />
            </Field>
            <Field label="Slug" error={errors.slug}>
              <Input value={f.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
            </Field>
            <Field label="Descrição">
              <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Parceiro">
                <Select value={f.partner_id} onChange={(v) => { set("partner_id", v); set("campaign_id", ""); set("placement_id", ""); }} options={[{ value: "", label: "—" }, ...partners.map((p) => ({ value: p.id, label: p.name }))]} />
              </Field>
              <Field label="Campanha">
                <Select value={f.campaign_id} onChange={(v) => { set("campaign_id", v); set("placement_id", ""); }} options={[{ value: "", label: "—" }, ...filteredCampaigns.map((c) => ({ value: c.id, label: c.name }))]} />
              </Field>
              <Field label="Posicionamento">
                <Select value={f.placement_id} onChange={(v) => set("placement_id", v)} options={[{ value: "", label: "—" }, ...filteredPlacements.map((p) => ({ value: p.id, label: p.name }))]} />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Destino */}
        <Card>
          <CardHeader><CardTitle>Destino</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo de destino">
                <Select value={f.destination_type} onChange={(v) => set("destination_type", v as DestType)} options={[
                  { value: "whatsapp", label: "WhatsApp" },
                  { value: "external_url", label: "URL externa" },
                  { value: "internal_landing", label: "Landing interna" },
                ]} />
              </Field>
              <Field label="Modo de redirecionamento">
                <Select value={f.redirect_mode} onChange={(v) => set("redirect_mode", v as Mode)} options={[
                  { value: "direct", label: "Direto" },
                  { value: "capture_simple", label: "Captura simples (nome)" },
                  { value: "capture_complete", label: "Captura completa" },
                  { value: "custom_landing", label: "Landing personalizada" },
                ]} />
              </Field>
            </div>
            {f.destination_type === "external_url" && (
              <Field label="URL externa" error={errors.external_url}>
                <Input value={f.external_url} onChange={(e) => set("external_url", e.target.value)} placeholder="https://..." />
              </Field>
            )}
          </CardContent>
        </Card>

        {/* Config WhatsApp */}
        {f.destination_type === "whatsapp" && (
          <Card>
            <CardHeader><CardTitle>Configuração do WhatsApp</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Número (formato internacional)" error={errors.whatsapp_number}>
                <Input value={f.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} placeholder="5561999999999" />
                {f.whatsapp_number && <p className="mt-1 text-xs text-muted-foreground">{formatWhatsappNumber(f.whatsapp_number)}</p>}
              </Field>
              <Field label="Template da mensagem" error={errors.whatsapp_message_template}>
                <Textarea rows={4} value={f.whatsapp_message_template} onChange={(e) => set("whatsapp_message_template", e.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-1">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button type="button" key={v} onClick={() => set("whatsapp_message_template", f.whatsapp_message_template + ` {{${v}}}`)} className="rounded border px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent">
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Captura */}
        {f.redirect_mode !== "direct" && (
          <Card>
            <CardHeader><CardTitle>Captura de dados</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(["name", "phone", "email", "interest"] as const).map((field) => (
                <div key={field} className="flex items-center gap-4">
                  <label className="flex w-32 items-center gap-2 text-sm capitalize">
                    <input type="checkbox" checked={f[`capture_${field}`]} onChange={(e) => set(`capture_${field}`, e.target.checked)} /> {field}
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={f[`${field}_required`]} onChange={(e) => set(`${field}_required`, e.target.checked)} disabled={!f[`capture_${field}`]} /> obrigatório
                  </label>
                </div>
              ))}
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <Field label="Título da página"><Input value={f.landing_title} onChange={(e) => set("landing_title", e.target.value)} /></Field>
                <Field label="Texto do botão"><Input value={f.button_text} onChange={(e) => set("button_text", e.target.value)} /></Field>
                <Field label="Descrição"><Input value={f.landing_description} onChange={(e) => set("landing_description", e.target.value)} /></Field>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Período */}
        <Card>
          <CardHeader><CardTitle>Período e status</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Início"><Input type="datetime-local" value={f.starts_at} onChange={(e) => set("starts_at", e.target.value)} /></Field>
            <Field label="Fim" error={errors.ends_at}><Input type="datetime-local" value={f.ends_at} onChange={(e) => set("ends_at", e.target.value)} /></Field>
            <Field label="Status">
              <Select value={f.status} onChange={(v) => set("status", v as TrackedLink["status"])} options={[
                { value: "active", label: "Ativo" }, { value: "paused", label: "Pausado" }, { value: "archived", label: "Arquivado" },
              ]} />
            </Field>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? "Salvando…" : mode === "create" ? "Criar link" : "Salvar alterações"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </div>

      {/* Pré-visualização lateral */}
      <div className="space-y-4">
        <Card className="sticky top-6">
          <CardHeader><CardTitle>Pré-visualização</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Link público</p>
              <p className="break-all font-mono text-xs">{publicUrl}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={f.status === "active" ? "default" : "secondary"}>{f.status}</Badge>
            </div>
            {f.destination_type === "whatsapp" && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Número</p>
                  <p>{f.whatsapp_number ? formatWhatsappNumber(f.whatsapp_number) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mensagem final</p>
                  <p className="whitespace-pre-wrap rounded bg-muted p-2 text-xs">{preview.msg || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">URL final</p>
                  <p className="break-all font-mono text-[10px]">{preview.url || "—"}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
