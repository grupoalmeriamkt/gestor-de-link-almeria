"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Card, CardContent, Badge } from "@/components/ui/primitives";
import { Copy, Check, QrCode, Scissors, ExternalLink, Loader2 } from "lucide-react";

interface ResultItem {
  ok: boolean;
  url: string;
  slug?: string;
  external_url?: string;
  error?: string;
}

const REDIRECT_BASE =
  process.env.NEXT_PUBLIC_REDIRECT_DOMAIN || process.env.NEXT_PUBLIC_APP_URL || "";

function shortUrl(slug: string): string {
  const base = REDIRECT_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base.replace(/\/$/, "")}/r/${slug}`;
}

export function ShortenTool() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [bulk, setBulk] = useState("");
  const [utm, setUtm] = useState({ utm_source: "", utm_medium: "", utm_campaign: "" });
  const [showUtm, setShowUtm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const buildItems = () => {
    const utms = {
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
    };
    if (mode === "single") {
      return [{ url: url.trim(), slug: slug.trim() || null, ...utms }];
    }
    return bulk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((u) => ({ url: u, ...utms }));
  };

  const submit = async () => {
    setError(null);
    const items = buildItems();
    if (items.length === 0 || items.every((i) => !i.url)) {
      setError("Informe ao menos uma URL.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        setError("Não foi possível encurtar. Verifique os dados e tente de novo.");
        return;
      }
      const data = (await res.json()) as { results: ResultItem[] };
      setResults((prev) => [...data.results, ...prev]);
      if (mode === "single") {
        setUrl("");
        setSlug("");
      } else {
        setBulk("");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Formulário */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "single" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("single")}
            >
              Um link
            </Button>
            <Button
              type="button"
              variant={mode === "bulk" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("bulk")}
            >
              Vários (em massa)
            </Button>
          </div>

          {mode === "single" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="url">URL de destino</Label>
                <Input
                  id="url"
                  placeholder="https://exemplo.com/pagina-muito-longa"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  inputMode="url"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug personalizado (opcional)</Label>
                <div className="flex items-center gap-1">
                  <span className="whitespace-nowrap text-sm text-muted-foreground">/r/</span>
                  <Input
                    id="slug"
                    placeholder="promo (deixe vazio p/ gerar automático)"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="bulk">URLs (uma por linha)</Label>
              <Textarea
                id="bulk"
                rows={7}
                placeholder={"https://exemplo.com/a\nhttps://exemplo.com/b\nhttps://exemplo.com/c"}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Slugs curtos são gerados automaticamente no modo em massa.</p>
            </div>
          )}

          <button
            type="button"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => setShowUtm((v) => !v)}
          >
            {showUtm ? "Ocultar UTMs" : "+ Adicionar UTMs (opcional)"}
          </button>

          {showUtm && (
            <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-3">
              {(["utm_source", "utm_medium", "utm_campaign"] as const).map((k) => (
                <div key={k} className="space-y-1">
                  <Label htmlFor={k} className="text-xs">
                    {k.replace("utm_", "")}
                  </Label>
                  <Input
                    id={k}
                    value={utm[k]}
                    onChange={(e) => setUtm((s) => ({ ...s, [k]: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Scissors />}
            {loading ? "Encurtando…" : "Encurtar"}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="space-y-3">
        {results.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Scissors className="size-6 opacity-40" />
              Os links encurtados aparecerão aqui.
            </CardContent>
          </Card>
        ) : (
          results.map((r, i) => <ResultCard key={`${r.slug ?? r.url}-${i}`} r={r} />)
        )}
      </div>
    </div>
  );
}

function ResultCard({ r }: { r: ResultItem }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  if (!r.ok) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="space-y-1 py-4">
          <p className="truncate text-xs text-muted-foreground">{r.url}</p>
          <p className="text-sm text-destructive">{r.error}</p>
        </CardContent>
      </Card>
    );
  }

  const link = shortUrl(r.slug!);

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleQr = async () => {
    if (!qr) {
      const QRCode = (await import("qrcode")).default;
      setQr(await QRCode.toDataURL(link, { width: 220, margin: 1 }));
    }
    setQrOpen((v) => !v);
  };

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between gap-2">
          <a href={link} target="_blank" rel="noreferrer" className="truncate font-medium text-primary hover:underline">
            {link.replace(/^https?:\/\//, "")}
          </a>
          <div className="flex shrink-0 gap-1">
            <Button variant="outline" size="icon" onClick={copy} title="Copiar" aria-label="Copiar">
              {copied ? <Check className="text-primary" /> : <Copy />}
            </Button>
            <Button variant="outline" size="icon" onClick={toggleQr} title="QR Code" aria-label="QR Code">
              <QrCode />
            </Button>
          </div>
        </div>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <ExternalLink className="size-3 shrink-0" /> {r.external_url}
        </p>
        {qrOpen && qr && (
          <div className="flex flex-col items-center gap-2 border-t pt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR Code" width={180} height={180} />
            <a href={qr} download={`qr-${r.slug}.png`} className="text-xs font-medium text-primary hover:underline">
              Baixar PNG
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
