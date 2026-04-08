import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type GeoLookupResponse = {
  success?: boolean;
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  timezone?: { id?: string } | string;
};

function getHeaderValue(request: NextRequest, headerName: string) {
  const value = request.headers.get(headerName);
  return value?.split(",")[0]?.trim() || null;
}

function isPrivateOrLoopbackIp(ip: string | null) {
  if (!ip) {
    return true;
  }

  const normalizedIp = ip.toLowerCase();

  return (
    normalizedIp === "::1" ||
    normalizedIp === "127.0.0.1" ||
    normalizedIp === "localhost" ||
    normalizedIp.startsWith("10.") ||
    normalizedIp.startsWith("192.168.") ||
    normalizedIp.startsWith("172.16.") ||
    normalizedIp.startsWith("172.17.") ||
    normalizedIp.startsWith("172.18.") ||
    normalizedIp.startsWith("172.19.") ||
    normalizedIp.startsWith("172.2") ||
    normalizedIp.startsWith("fd") ||
    normalizedIp.startsWith("fe80:")
  );
}

async function lookupGeo(ipAddress: string | null) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const url = ipAddress && !isPrivateOrLoopbackIp(ipAddress) ? `https://ipwho.is/${ipAddress}` : "https://ipwho.is/";
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as GeoLookupResponse;

    if (payload.success === false) {
      return null;
    }

    const timezone = typeof payload.timezone === "string" ? payload.timezone : payload.timezone?.id;

    return {
      ipAddress: payload.ip ?? ipAddress,
      city: payload.city ?? null,
      region: payload.region ?? null,
      country: payload.country ?? null,
      timezone: timezone ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const forwardedIp =
    getHeaderValue(request, "x-forwarded-for") ||
    getHeaderValue(request, "x-real-ip") ||
    getHeaderValue(request, "cf-connecting-ip");

  const geo = await lookupGeo(forwardedIp);

  return NextResponse.json(
    {
      ipAddress: geo?.ipAddress ?? forwardedIp,
      location: {
        city: geo?.city ?? null,
        region: geo?.region ?? null,
        country: geo?.country ?? null,
      },
      timezone: geo?.timezone ?? null,
      isPrivateNetwork: isPrivateOrLoopbackIp(geo?.ipAddress ?? forwardedIp),
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
