export type SystemSettingSource = "database" | "environment" | "default";
export type ApifyActorCategory = "bootstrap" | "profile" | "post";
export type ApifyPlatform = "instagram" | "tiktok" | "youtube" | "facebook" | "x";

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
  actorIds: Record<ApifyActorCategory, Record<ApifyPlatform, RuntimeSettingField>>;
  configuredPlatforms: Record<ApifyActorCategory, ApifyPlatform[]>;
  missingPlatforms: Record<ApifyActorCategory, ApifyPlatform[]>;
  fullyConfiguredPlatforms: ApifyPlatform[];
  bootstrapOnlyPlatforms: ApifyPlatform[];
};

export type ApifyIntegrationSettingKey =
  | "apify_api_token"
  | "apify_webhook_secret"
  | "apify_instagram_actor_id"
  | "apify_instagram_profile_actor_id"
  | "apify_instagram_post_actor_id"
  | "apify_tiktok_actor_id"
  | "apify_tiktok_profile_actor_id"
  | "apify_tiktok_post_actor_id"
  | "apify_youtube_actor_id"
  | "apify_youtube_profile_actor_id"
  | "apify_youtube_post_actor_id"
  | "apify_facebook_actor_id"
  | "apify_facebook_profile_actor_id"
  | "apify_facebook_post_actor_id"
  | "apify_x_actor_id"
  | "apify_x_profile_actor_id"
  | "apify_x_post_actor_id";
