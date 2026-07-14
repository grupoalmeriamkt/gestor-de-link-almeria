"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import type { PublicLandingConfig } from "@/lib/server/public-config";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/primitives";

interface Props {
  config: PublicLandingConfig;
  clickCode: string;
  isTest: boolean;
}

interface FormValues {
  name: string;
  phone: string;
  email: string;
  interest: string;
  consent: boolean;
}

export function LandingForm({ config, clickCode, isTest }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { name: "", phone: "", email: "", interest: "", consent: false } });
  const [serverError, setServerError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const fireStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    fetch("/api/track/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_name: "form_started", click_code: clickCode }),
      keepalive: true,
    }).catch(() => {});
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, click_code: clickCode }),
    });
    if (!res.ok) {
      setServerError("Não foi possível continuar. Tente novamente.");
      return;
    }
    const data = (await res.json()) as { redirect_url?: string };
    if (data.redirect_url) window.location.href = data.redirect_url;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onFocusCapture={fireStarted} className="w-full space-y-4">
      {config.capture_name && (
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome{config.name_required ? " *" : ""}</Label>
          <Input
            id="name"
            autoComplete="name"
            {...register("name", {
              required: config.name_required ? "Informe seu nome." : false,
              maxLength: { value: 200, message: "Nome muito longo." },
            })}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
      )}

      {config.capture_phone && (
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone{config.phone_required ? " *" : ""}</Label>
          <Input
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            {...register("phone", { required: config.phone_required ? "Informe seu telefone." : false })}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      )}

      {config.capture_email && (
        <div className="space-y-1.5">
          <Label htmlFor="email">Email{config.email_required ? " *" : ""}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email", {
              required: config.email_required ? "Informe seu email." : false,
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido." },
            })}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      )}

      {config.capture_interest && (
        <div className="space-y-1.5">
          <Label htmlFor="interest">Interesse{config.interest_required ? " *" : ""}</Label>
          <Textarea
            id="interest"
            rows={3}
            {...register("interest", { required: config.interest_required ? "Informe seu interesse." : false })}
          />
          {errors.interest && <p className="text-xs text-destructive">{errors.interest.message}</p>}
        </div>
      )}

      {config.privacy_text && (
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" className="mt-0.5" {...register("consent")} />
          <span>{config.privacy_text}</span>
        </label>
      )}

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Aguarde…" : config.button_text}
      </Button>
    </form>
  );
}
