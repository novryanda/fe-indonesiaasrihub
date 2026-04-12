import { apiClient } from "@/shared/api/api-client";

import type {
  ApifyIntegrationSettingKey,
  ApifyIntegrationSettings,
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

function mapApifySettings(data: {
  apify_api_token: {
    is_secret: boolean;
    has_value: boolean;
    source: ApifyIntegrationSettings["apifyApiToken"]["source"];
    masked_preview?: string | null;
  };
  apify_webhook_secret: {
    is_secret: boolean;
    has_value: boolean;
    source: ApifyIntegrationSettings["apifyWebhookSecret"]["source"];
    masked_preview?: string | null;
  };
  actor_ids: Record<
    keyof ApifyIntegrationSettings["actorIds"],
    {
      is_secret: boolean;
      has_value: boolean;
      source: ApifyIntegrationSettings["apifyApiToken"]["source"];
      value?: string | null;
    }
  >;
  configured_platforms: ApifyIntegrationSettings["configuredPlatforms"];
  missing_platforms: ApifyIntegrationSettings["missingPlatforms"];
}): ApifyIntegrationSettings {
  return {
    apifyApiToken: mapField(data.apify_api_token),
    apifyWebhookSecret: mapField(data.apify_webhook_secret),
    actorIds: {
      instagram: mapField(data.actor_ids.instagram),
      tiktok: mapField(data.actor_ids.tiktok),
      youtube: mapField(data.actor_ids.youtube),
      facebook: mapField(data.actor_ids.facebook),
      x: mapField(data.actor_ids.x),
    },
    configuredPlatforms: data.configured_platforms,
    missingPlatforms: data.missing_platforms,
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

export async function getApifyIntegrationSettings() {
  const response = await apiClient<{
    apify_api_token: {
      is_secret: boolean;
      has_value: boolean;
      source: ApifyIntegrationSettings["apifyApiToken"]["source"];
      masked_preview?: string | null;
    };
    apify_webhook_secret: {
      is_secret: boolean;
      has_value: boolean;
      source: ApifyIntegrationSettings["apifyWebhookSecret"]["source"];
      masked_preview?: string | null;
    };
    actor_ids: Record<
      keyof ApifyIntegrationSettings["actorIds"],
      {
        is_secret: boolean;
        has_value: boolean;
        source: ApifyIntegrationSettings["apifyApiToken"]["source"];
        value?: string | null;
      }
    >;
    configured_platforms: ApifyIntegrationSettings["configuredPlatforms"];
    missing_platforms: ApifyIntegrationSettings["missingPlatforms"];
  }>("/v1/system-settings/apify-integration");

  return {
    ...response,
    data: mapApifySettings(response.data),
  };
}

export async function updateApifyIntegrationSettings(payload: {
  apifyApiToken?: string;
  apifyWebhookSecret?: string;
  actorIds?: Partial<Record<keyof ApifyIntegrationSettings["actorIds"], string>>;
}) {
  const response = await apiClient<{
    apify_api_token: {
      is_secret: boolean;
      has_value: boolean;
      source: ApifyIntegrationSettings["apifyApiToken"]["source"];
      masked_preview?: string | null;
    };
    apify_webhook_secret: {
      is_secret: boolean;
      has_value: boolean;
      source: ApifyIntegrationSettings["apifyWebhookSecret"]["source"];
      masked_preview?: string | null;
    };
    actor_ids: Record<
      keyof ApifyIntegrationSettings["actorIds"],
      {
        is_secret: boolean;
        has_value: boolean;
        source: ApifyIntegrationSettings["apifyApiToken"]["source"];
        value?: string | null;
      }
    >;
    configured_platforms: ApifyIntegrationSettings["configuredPlatforms"];
    missing_platforms: ApifyIntegrationSettings["missingPlatforms"];
  }>("/v1/system-settings/apify-integration", {
    method: "PATCH",
    body: {
      apify_api_token: payload.apifyApiToken,
      apify_webhook_secret: payload.apifyWebhookSecret,
      apify_instagram_actor_id: payload.actorIds?.instagram,
      apify_tiktok_actor_id: payload.actorIds?.tiktok,
      apify_youtube_actor_id: payload.actorIds?.youtube,
      apify_facebook_actor_id: payload.actorIds?.facebook,
      apify_x_actor_id: payload.actorIds?.x,
    },
  });

  return {
    ...response,
    data: mapApifySettings(response.data),
  };
}

export async function resetApifyIntegrationSettings(keys: ApifyIntegrationSettingKey[]) {
  const response = await apiClient<{
    apify_api_token: {
      is_secret: boolean;
      has_value: boolean;
      source: ApifyIntegrationSettings["apifyApiToken"]["source"];
      masked_preview?: string | null;
    };
    apify_webhook_secret: {
      is_secret: boolean;
      has_value: boolean;
      source: ApifyIntegrationSettings["apifyWebhookSecret"]["source"];
      masked_preview?: string | null;
    };
    actor_ids: Record<
      keyof ApifyIntegrationSettings["actorIds"],
      {
        is_secret: boolean;
        has_value: boolean;
        source: ApifyIntegrationSettings["apifyApiToken"]["source"];
        value?: string | null;
      }
    >;
    configured_platforms: ApifyIntegrationSettings["configuredPlatforms"];
    missing_platforms: ApifyIntegrationSettings["missingPlatforms"];
  }>("/v1/system-settings/apify-integration/reset", {
    method: "POST",
    body: {
      keys,
    },
  });

  return {
    ...response,
    data: mapApifySettings(response.data),
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
