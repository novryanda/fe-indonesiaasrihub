export type SystemSettingSource = "database" | "environment" | "default";

export type RuntimeSettingField = {
  isSecret: boolean;
  hasValue: boolean;
  source: SystemSettingSource;
  value?: string | null;
  maskedPreview?: string | null;
};

export type WhatsappIntegrationSettings = {
  wahaApiBaseUrl: RuntimeSettingField;
  wahaApiKey: RuntimeSettingField;
  wahaSessionName: RuntimeSettingField;
};

export type WhatsappIntegrationSettingKey = "waha_api_base_url" | "waha_api_key" | "waha_session_name";

export type ApifyIntegrationSettings = {
  apifyApiToken: RuntimeSettingField;
  apifyWebhookSecret: RuntimeSettingField;
  actorIds: Record<"instagram" | "tiktok" | "youtube" | "facebook" | "x", RuntimeSettingField>;
  configuredPlatforms: Array<"instagram" | "tiktok" | "youtube" | "facebook" | "x">;
  missingPlatforms: Array<"instagram" | "tiktok" | "youtube" | "facebook" | "x">;
};

export type ApifyIntegrationSettingKey =
  | "apify_api_token"
  | "apify_webhook_secret"
  | "apify_instagram_actor_id"
  | "apify_tiktok_actor_id"
  | "apify_youtube_actor_id"
  | "apify_facebook_actor_id"
  | "apify_x_actor_id";
