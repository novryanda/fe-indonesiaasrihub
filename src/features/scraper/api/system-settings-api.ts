import { apiClient } from "@/shared/api/api-client";

import type {
  WhatsappIntegrationSettingKey,
  WhatsappIntegrationSettings,
} from "../types/system-settings.type";

function mapField(item: {
  is_secret: boolean;
  has_value: boolean;
  source: WhatsappIntegrationSettings["wahaApiBaseUrl"]["source"];
  value?: string | null;
  masked_preview?: string | null;
}) {
  return {
    isSecret: item.is_secret,
    hasValue: item.has_value,
    source: item.source,
    value: item.value ?? null,
    maskedPreview: item.masked_preview ?? null,
  };
}

function mapSettings(data: {
  waha_api_base_url: {
    is_secret: boolean;
    has_value: boolean;
    source: WhatsappIntegrationSettings["wahaApiBaseUrl"]["source"];
    value?: string | null;
  };
  waha_api_key: {
    is_secret: boolean;
    has_value: boolean;
    source: WhatsappIntegrationSettings["wahaApiKey"]["source"];
    masked_preview?: string | null;
  };
  waha_session_name: {
    is_secret: boolean;
    has_value: boolean;
    source: WhatsappIntegrationSettings["wahaSessionName"]["source"];
    value?: string | null;
  };
}): WhatsappIntegrationSettings {
  return {
    wahaApiBaseUrl: mapField(data.waha_api_base_url),
    wahaApiKey: mapField(data.waha_api_key),
    wahaSessionName: mapField(data.waha_session_name),
  };
}

export async function getWhatsappIntegrationSettings() {
  const response = await apiClient<{
    waha_api_base_url: {
      is_secret: boolean;
      has_value: boolean;
      source: WhatsappIntegrationSettings["wahaApiBaseUrl"]["source"];
      value?: string | null;
    };
    waha_api_key: {
      is_secret: boolean;
      has_value: boolean;
      source: WhatsappIntegrationSettings["wahaApiKey"]["source"];
      masked_preview?: string | null;
    };
    waha_session_name: {
      is_secret: boolean;
      has_value: boolean;
      source: WhatsappIntegrationSettings["wahaSessionName"]["source"];
      value?: string | null;
    };
  }>("/v1/system-settings/whatsapp-integration");

  return {
    ...response,
    data: mapSettings(response.data),
  };
}

export async function updateWhatsappIntegrationSettings(payload: {
  wahaApiBaseUrl?: string;
  wahaApiKey?: string;
  wahaSessionName?: string;
}) {
  const response = await apiClient<{
    waha_api_base_url: {
      is_secret: boolean;
      has_value: boolean;
      source: WhatsappIntegrationSettings["wahaApiBaseUrl"]["source"];
      value?: string | null;
    };
    waha_api_key: {
      is_secret: boolean;
      has_value: boolean;
      source: WhatsappIntegrationSettings["wahaApiKey"]["source"];
      masked_preview?: string | null;
    };
    waha_session_name: {
      is_secret: boolean;
      has_value: boolean;
      source: WhatsappIntegrationSettings["wahaSessionName"]["source"];
      value?: string | null;
    };
  }>("/v1/system-settings/whatsapp-integration", {
    method: "PATCH",
    body: {
      waha_api_base_url: payload.wahaApiBaseUrl,
      waha_api_key: payload.wahaApiKey,
      waha_session_name: payload.wahaSessionName,
    },
  });

  return {
    ...response,
    data: mapSettings(response.data),
  };
}

export async function resetWhatsappIntegrationSettings(keys: WhatsappIntegrationSettingKey[]) {
  const response = await apiClient<{
    waha_api_base_url: {
      is_secret: boolean;
      has_value: boolean;
      source: WhatsappIntegrationSettings["wahaApiBaseUrl"]["source"];
      value?: string | null;
    };
    waha_api_key: {
      is_secret: boolean;
      has_value: boolean;
      source: WhatsappIntegrationSettings["wahaApiKey"]["source"];
      masked_preview?: string | null;
    };
    waha_session_name: {
      is_secret: boolean;
      has_value: boolean;
      source: WhatsappIntegrationSettings["wahaSessionName"]["source"];
      value?: string | null;
    };
  }>("/v1/system-settings/whatsapp-integration/reset", {
    method: "POST",
    body: {
      keys,
    },
  });

  return {
    ...response,
    data: mapSettings(response.data),
  };
}
