export const DEVICE_LOCATION_COOKIE_NAME = "asrihub.device_geo";

export type DeviceLocationSnapshot = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string;
};

const MAX_DEVICE_LOCATION_AGE_MS = 10 * 60 * 1000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function serializeDeviceLocationSnapshot(snapshot: DeviceLocationSnapshot) {
  return encodeURIComponent(JSON.stringify(snapshot));
}

export function parseDeviceLocationSnapshot(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<DeviceLocationSnapshot>;

    if (!isFiniteNumber(parsed.latitude) || !isFiniteNumber(parsed.longitude)) {
      return null;
    }

    if (typeof parsed.capturedAt !== "string" || Number.isNaN(new Date(parsed.capturedAt).getTime())) {
      return null;
    }

    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      accuracy: isFiniteNumber(parsed.accuracy) ? parsed.accuracy : null,
      capturedAt: parsed.capturedAt,
    } satisfies DeviceLocationSnapshot;
  } catch {
    return null;
  }
}

export function isDeviceLocationSnapshotFresh(snapshot: DeviceLocationSnapshot, maxAgeMs = MAX_DEVICE_LOCATION_AGE_MS) {
  const capturedAt = new Date(snapshot.capturedAt).getTime();

  if (Number.isNaN(capturedAt)) {
    return false;
  }

  return Date.now() - capturedAt <= maxAgeMs;
}
