export type SystemSettingSource = "database" | "environment" | "default";

export type WhatsappIntegrationSettingField = {
  isSecret: boolean;
  hasValue: boolean;
  source: SystemSettingSource;
  value?: string | null;
  maskedPreview?: string | null;
};

export type WhatsappIntegrationSettings = {
  wahaApiBaseUrl: WhatsappIntegrationSettingField;
  wahaApiKey: WhatsappIntegrationSettingField;
  wahaSessionName: WhatsappIntegrationSettingField;
  n8nWhatsappWebhookUrl: WhatsappIntegrationSettingField;
  n8nWhatsappWebhookToken: WhatsappIntegrationSettingField;
};

export type WhatsappIntegrationSettingKey =
  | "waha_api_base_url"
  | "waha_api_key"
  | "waha_session_name"
  | "n8n_whatsapp_webhook_url"
  | "n8n_whatsapp_webhook_token";
