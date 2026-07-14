"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";

export interface FieldConfig {
  name: string;
  label: string;
  type?: "text" | "email" | "url" | "select" | "datetime-local" | "number";
  required?: boolean;
  options?: { value: string; label: string }[];
}

/** Formulário genérico de criação para entidades simples (parceiro/campanha/posicionamento). */
export function SimpleCreateForm({
  endpoint,
  fields,
  title,
}: {
  endpoint: string;
  fields: FieldConfig[];
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, status: values.status ?? "active" }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(JSON.stringify(d.issues?.fieldErrors ?? d.error ?? "erro"));
      return;
    }
    setValues({});
    setOpen(false);
    router.refresh();
  }

  if (!open) return <Button onClick={() => setOpen(true)}>Novo</Button>;

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-card p-4">
      <p className="font-semibold">{title}</p>
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label>{field.label}{field.required ? " *" : ""}</Label>
          {field.type === "select" ? (
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={values[field.name] ?? ""}
              onChange={(e) => setValues((p) => ({ ...p, [field.name]: e.target.value }))}
              required={field.required}
            >
              <option value="">—</option>
              {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <Input
              type={field.type ?? "text"}
              value={values[field.name] ?? ""}
              onChange={(e) => setValues((p) => ({ ...p, [field.name]: e.target.value }))}
              required={field.required}
            />
          )}
        </div>
      ))}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
}
