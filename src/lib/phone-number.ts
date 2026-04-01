export function normalizeIndonesianPhoneNumber(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  const nationalNumber = digits.replace(/^0+/, "").replace(/^62/, "");
  return nationalNumber ? `+62${nationalNumber}` : null;
}

export function isValidIndonesianPhoneNumber(value: string | null | undefined): boolean {
  const normalized = normalizeIndonesianPhoneNumber(value);
  if (!normalized) {
    return false;
  }

  const subscriberDigits = normalized.slice(3);
  return subscriberDigits.length >= 8 && subscriberDigits.length <= 22;
}
