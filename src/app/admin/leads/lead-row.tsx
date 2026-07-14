"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/primitives";

const STATUSES = ["new", "contacted", "qualified", "converted", "lost", "invalid", "test"] as const;

export function LeadStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    setValue(next);
    setSaving(true);
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => change(e.target.value)}
      className="rounded border border-input bg-transparent px-2 py-1 text-xs"
    >
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

export function WhatsAppLink({ phone }: { phone: string | null }) {
  if (!phone) return <span className="text-muted-foreground">—</span>;
  const digits = phone.replace(/\D/g, "");
  return (
    <div className="flex items-center gap-2">
      <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{phone}</a>
      <button onClick={() => navigator.clipboard.writeText(phone)} className="text-xs text-muted-foreground hover:text-foreground" title="Copiar">⧉</button>
    </div>
  );
}

export function LeadBadge({ isTest }: { isTest: boolean }) {
  return isTest ? <Badge variant="secondary">teste</Badge> : null;
}
