// Tipos de domínio compartilhados entre frontend e backend.

export type UserRole = "admin" | "operator" | "analyst";
export type EntityStatus = "active" | "paused" | "archived";
export type DestinationType = "whatsapp" | "external_url" | "internal_landing";
export type RedirectMode =
  | "direct"
  | "capture_simple"
  | "capture_complete"
  | "custom_landing";
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost"
  | "invalid"
  | "test";

export type EventName =
  | "banner_impression"
  | "link_clicked"
  | "landing_viewed"
  | "form_started"
  | "lead_submitted"
  | "whatsapp_redirected"
  | "external_redirected"
  | "conversion_registered"
  // futuros
  | "whatsapp_message_received"
  | "whatsapp_conversation_started"
  | "concierge_replied"
  | "sale_completed";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  name: string;
  domain: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: EntityStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  objective: string | null;
  budget: number | null;
  status: EntityStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Placement {
  id: string;
  campaign_id: string;
  name: string;
  partner_page: string | null;
  position_name: string | null;
  description: string | null;
  dimensions: string | null;
  reference_url: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface TrackedLink {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  partner_id: string | null;
  campaign_id: string | null;
  placement_id: string | null;
  destination_type: DestinationType;
  redirect_mode: RedirectMode;
  whatsapp_number: string | null;
  whatsapp_message_template: string | null;
  external_url: string | null;
  capture_enabled: boolean;
  capture_name: boolean;
  capture_phone: boolean;
  capture_email: boolean;
  capture_interest: boolean;
  name_required: boolean;
  phone_required: boolean;
  email_required: boolean;
  interest_required: boolean;
  landing_title: string | null;
  landing_description: string | null;
  button_text: string | null;
  success_message: string | null;
  privacy_text: string | null;
  unavailable_title: string | null;
  unavailable_description: string | null;
  status: EntityStatus;
  starts_at: string | null;
  ends_at: string | null;
  current_version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkVersion {
  id: string;
  tracked_link_id: string;
  version_number: number;
  whatsapp_number: string | null;
  whatsapp_message_template: string | null;
  destination_type: DestinationType | null;
  redirect_mode: RedirectMode | null;
  external_url: string | null;
  configuration_snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  click_id: string | null;
  tracked_link_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  interest: string | null;
  consent: boolean;
  status: LeadStatus;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Contexto usado para resolver o template da mensagem.
export interface TemplateContext {
  nome?: string | null;
  telefone?: string | null;
  email?: string | null;
  interesse?: string | null;
  parceiro?: string | null;
  campanha?: string | null;
  banner?: string | null;
  click_id?: string | null;
  data?: string | null;
  origem?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}
