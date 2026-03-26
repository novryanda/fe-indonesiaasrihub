function readEnv(name: string) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

export function getRequiredEnv(name: string) {
  return readEnv(name);
}

export function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}
