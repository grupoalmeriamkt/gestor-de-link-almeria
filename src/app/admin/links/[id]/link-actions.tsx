"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { TestResult } from "@/lib/server/test-runner";

export function LinkActions({ id, status, publicUrl }: { id: string; status: string; publicUrl: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState<TestResult | null>(null);

  async function act(action: string) {
    setBusy(true);
    await fetch(`/api/admin/links/${id}/${action}`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  async function runTest() {
    setBusy(true);
    const res = await fetch(`/api/admin/links/${id}/test`, { method: "POST" });
    const data = await res.json();
    setTest(data.result);
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(publicUrl)}>Copiar link</Button>
        <Button variant="outline" size="sm" asChild><a href={publicUrl} target="_blank" rel="noreferrer">Abrir</a></Button>
        {status === "active" ? (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => act("pause")}>Pausar</Button>
        ) : (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => act("activate")}>Reativar</Button>
        )}
        <Button variant="outline" size="sm" disabled={busy} onClick={() => act("duplicate")}>Duplicar</Button>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => act("archive")}>Arquivar</Button>
        <Button size="sm" disabled={busy} onClick={runTest}>Executar teste</Button>
      </div>

      {test && (
        <div className="rounded-lg border p-3 text-sm">
          <p className="mb-2 font-semibold">Resultado do teste — {test.passed ? "✅ passou" : "❌ falhou"}</p>
          <ul className="space-y-1">
            {test.checks.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                <span>{c.status === "success" ? "✅" : c.status === "error" ? "❌" : "⏭️"}</span>
                <span>{c.label}</span>
                {c.detail && <span className="text-xs text-muted-foreground">— {c.detail}</span>}
              </li>
            ))}
          </ul>
          {test.message_preview && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Mensagem simulada</p>
              <p className="whitespace-pre-wrap rounded bg-muted p-2 text-xs">{test.message_preview}</p>
            </div>
          )}
          {test.url_preview && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">URL final</p>
              <p className="break-all font-mono text-[10px]">{test.url_preview}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
