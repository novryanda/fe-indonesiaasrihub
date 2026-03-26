import { apiClient } from "./api-client";

export interface WilayahOption {
  id: string;
  nama: string;
  kode: string;
  level: "nasional" | "provinsi";
  parent: {
    id: string;
    nama: string;
    kode: string;
    level: "nasional" | "provinsi";
  } | null;
}

type WilayahApiResponse = Array<{
  id: string;
  nama: string;
  kode: string;
  level: "nasional" | "provinsi";
  parent: {
    id: string;
    nama: string;
    kode: string;
    level: "nasional" | "provinsi";
  } | null;
}>;

let wilayahCachePromise: Promise<WilayahOption[]> | null = null;

function normalizeWilayahValue(value: string) {
  return value.trim().toLowerCase();
}

export async function listWilayahOptions(forceRefresh = false): Promise<WilayahOption[]> {
  if (!wilayahCachePromise || forceRefresh) {
    wilayahCachePromise = apiClient<WilayahApiResponse>("/v1/wilayah", {
      method: "GET",
    }).then((response) => response.data);
  }

  return wilayahCachePromise;
}

export async function resolveWilayahId(
  value: string | null | undefined,
): Promise<string | null> {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const options = await listWilayahOptions();
  const normalized = normalizeWilayahValue(trimmed);
  const match = options.find((item) => {
    return (
      item.id === trimmed ||
      normalizeWilayahValue(item.nama) === normalized ||
      normalizeWilayahValue(item.kode) === normalized
    );
  });

  if (!match) {
    throw new Error(`Wilayah "${trimmed}" tidak ditemukan.`);
  }

  return match.id;
}

export async function resolveWilayahIds(values: string[] | undefined): Promise<string[]> {
  if (!values || values.length === 0) {
    return [];
  }

  const resolved = await Promise.all(values.map((value) => resolveWilayahId(value)));
  return Array.from(new Set(resolved.filter((value): value is string => Boolean(value))));
}

export async function resolveWilayahNames(ids: string[] | undefined): Promise<string[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  const options = await listWilayahOptions();
  const namesById = new Map(options.map((item) => [item.id, item.nama]));

  return ids.map((id) => namesById.get(id) ?? id);
}
