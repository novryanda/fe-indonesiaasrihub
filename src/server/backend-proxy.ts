"use server";

import type { NextRequest } from "next/server";

import {
  DEVICE_LOCATION_COOKIE_NAME,
  isDeviceLocationSnapshotFresh,
  parseDeviceLocationSnapshot,
} from "@/lib/device-location";
import { getRequiredEnv, normalizeBaseUrl } from "@/lib/env";

const BACKEND_BASE_URL = normalizeBaseUrl(getRequiredEnv("API_BASE_URL"));
const INTERNAL_API_HEADER_NAME = getRequiredEnv("INTERNAL_API_HEADER_NAME");
const INTERNAL_API_HEADER_VALUE = getRequiredEnv("INTERNAL_API_HEADER_VALUE");

function buildBackendUrl(path: string, searchParams?: URLSearchParams) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, BACKEND_BASE_URL);

  if (searchParams) {
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

function buildForwardHeaders(request: NextRequest, hasBody: boolean) {
  const headers = new Headers();
  const cookieHeader = request.headers.get("cookie");
  const authorizationHeader = request.headers.get("authorization");
  const acceptHeader = request.headers.get("accept");
  const contentTypeHeader = request.headers.get("content-type");
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const forwardedForHeader = request.headers.get("x-forwarded-for");
  const forwardedHostHeader = request.headers.get("x-forwarded-host");
  const forwardedProtoHeader = request.headers.get("x-forwarded-proto");
  const realIpHeader = request.headers.get("x-real-ip");
  const userAgentHeader = request.headers.get("user-agent");
  const deviceLocationCookie = request.cookies.get(DEVICE_LOCATION_COOKIE_NAME)?.value;
  const deviceLocation = parseDeviceLocationSnapshot(deviceLocationCookie);

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  if (authorizationHeader) {
    headers.set("authorization", authorizationHeader);
  }

  if (acceptHeader) {
    headers.set("accept", acceptHeader);
  }

  if (hasBody && contentTypeHeader) {
    headers.set("content-type", contentTypeHeader);
  }

  headers.set("origin", originHeader ?? request.nextUrl.origin);

  if (refererHeader) {
    headers.set("referer", refererHeader);
  }

  if (forwardedForHeader) {
    headers.set("x-forwarded-for", forwardedForHeader);
  }

  if (forwardedHostHeader) {
    headers.set("x-forwarded-host", forwardedHostHeader);
  }

  if (forwardedProtoHeader) {
    headers.set("x-forwarded-proto", forwardedProtoHeader);
  }

  if (realIpHeader) {
    headers.set("x-real-ip", realIpHeader);
  }

  if (userAgentHeader) {
    headers.set("user-agent", userAgentHeader);
  }

  if (deviceLocation && isDeviceLocationSnapshotFresh(deviceLocation)) {
    headers.set("x-device-latitude", String(deviceLocation.latitude));
    headers.set("x-device-longitude", String(deviceLocation.longitude));

    if (deviceLocation.accuracy !== null) {
      headers.set("x-device-accuracy", String(deviceLocation.accuracy));
    }

    headers.set("x-device-located-at", deviceLocation.capturedAt);
  }

  headers.set(INTERNAL_API_HEADER_NAME, INTERNAL_API_HEADER_VALUE);
  return headers;
}

async function readRequestBody(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const body = await request.arrayBuffer();
  return body.byteLength > 0 ? body : undefined;
}

export async function forwardRequestToBackend(
  request: NextRequest,
  backendPath: string,
  searchParams?: URLSearchParams,
) {
  const body = await readRequestBody(request);
  const response = await fetch(buildBackendUrl(backendPath, searchParams ?? request.nextUrl.searchParams), {
    method: request.method,
    headers: buildForwardHeaders(request, body !== undefined),
    body,
    cache: "no-store",
    redirect: "manual",
  });

  const responseBody = await response.arrayBuffer();
  const responseHeaders = new Headers(response.headers);

  // Clean up problematic headers that fetch node might have decompressed
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new Response(responseBody.byteLength > 0 ? responseBody : undefined, {
    status: response.status,
    headers: responseHeaders,
  });
}
