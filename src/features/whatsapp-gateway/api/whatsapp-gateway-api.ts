import { apiClient } from "@/shared/api/api-client";

import type {
  WhatsappGatewayPairingCode,
  WhatsappGatewaySession,
} from "../types/whatsapp-gateway.type";

function mapSession(item: {
  session_name: string;
  exists: boolean;
  status: WhatsappGatewaySession["status"];
  qr_available: boolean;
  me: {
    id: string | null;
    push_name: string | null;
    name: string | null;
    short_name: string | null;
    phone_number: string | null;
    raw: unknown;
  } | null;
  updated_at: string;
}): WhatsappGatewaySession {
  return {
    sessionName: item.session_name,
    exists: item.exists,
    status: item.status,
    qrAvailable: item.qr_available,
    me: item.me
      ? {
          id: item.me.id,
          pushName: item.me.push_name,
          name: item.me.name,
          shortName: item.me.short_name,
          phoneNumber: item.me.phone_number,
          raw: item.me.raw,
        }
      : null,
    updatedAt: item.updated_at,
  };
}

export async function getWhatsappGatewaySession() {
  const response = await apiClient<{
    session_name: string;
    exists: boolean;
    status: WhatsappGatewaySession["status"];
    qr_available: boolean;
    me: {
      id: string | null;
      push_name: string | null;
      name: string | null;
      short_name: string | null;
      phone_number: string | null;
      raw: unknown;
    } | null;
    updated_at: string;
  }>("/v1/whatsapp-gateway/session");

  return {
    ...response,
    data: mapSession(response.data),
  };
}

export async function connectWhatsappGateway() {
  const response = await apiClient<{
    session_name: string;
    exists: boolean;
    status: WhatsappGatewaySession["status"];
    qr_available: boolean;
    me: {
      id: string | null;
      push_name: string | null;
      name: string | null;
      short_name: string | null;
      phone_number: string | null;
      raw: unknown;
    } | null;
    updated_at: string;
  }>("/v1/whatsapp-gateway/connect", {
    method: "POST",
  });

  return {
    ...response,
    data: mapSession(response.data),
  };
}

export async function restartWhatsappGateway() {
  const response = await apiClient<{
    session_name: string;
    exists: boolean;
    status: WhatsappGatewaySession["status"];
    qr_available: boolean;
    me: {
      id: string | null;
      push_name: string | null;
      name: string | null;
      short_name: string | null;
      phone_number: string | null;
      raw: unknown;
    } | null;
    updated_at: string;
  }>("/v1/whatsapp-gateway/restart", {
    method: "POST",
  });

  return {
    ...response,
    data: mapSession(response.data),
  };
}

export async function logoutWhatsappGateway() {
  const response = await apiClient<{
    session_name: string;
    exists: boolean;
    status: WhatsappGatewaySession["status"];
    qr_available: boolean;
    me: {
      id: string | null;
      push_name: string | null;
      name: string | null;
      short_name: string | null;
      phone_number: string | null;
      raw: unknown;
    } | null;
    updated_at: string;
  }>("/v1/whatsapp-gateway/logout", {
    method: "POST",
  });

  return {
    ...response,
    data: mapSession(response.data),
  };
}

export async function requestWhatsappGatewayCode(phoneNumber: string) {
  return apiClient<WhatsappGatewayPairingCode>("/v1/whatsapp-gateway/request-code", {
    method: "POST",
    body: {
      phone_number: phoneNumber,
    },
  });
}

export function buildWhatsappGatewayQrUrl(cacheKey: number) {
  return `/api/backend/v1/whatsapp-gateway/qr?ts=${cacheKey}`;
}
