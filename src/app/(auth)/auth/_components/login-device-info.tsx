"use client";

import { useEffect, useMemo, useState } from "react";

import { Globe, LaptopMinimal, MapPin, ShieldCheck, Wifi } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { deleteClientCookie, setClientCookie } from "@/lib/cookie.client";
import { DEVICE_LOCATION_COOKIE_NAME, serializeDeviceLocationSnapshot } from "@/lib/device-location";

type DeviceContextResponse = {
  ipAddress: string | null;
  location: {
    city: string | null;
    region: string | null;
    country: string | null;
  };
  timezone: string | null;
  isPrivateNetwork: boolean;
  fetchedAt: string;
};

type DeviceInfoState = {
  browserLabel: string;
  deviceLabel: string;
  localeLabel: string;
  timezoneLabel: string;
  connectionLabel: string;
};

type DeviceGeoState = {
  status: "requesting" | "granted" | "denied" | "unsupported" | "insecure" | "error";
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};

function detectBrowserLabel(userAgent: string) {
  if (userAgent.includes("Edg/")) {
    return "Microsoft Edge";
  }

  if (userAgent.includes("Chrome/")) {
    return "Google Chrome";
  }

  if (userAgent.includes("Firefox/")) {
    return "Mozilla Firefox";
  }

  if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) {
    return "Safari";
  }

  return "Browser tidak dikenali";
}

function detectDeviceLabel(userAgent: string) {
  if (/Android/i.test(userAgent)) {
    return "Android";
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return "iPhone / iPad";
  }

  if (/Windows/i.test(userAgent)) {
    return "Windows";
  }

  if (/Mac OS X/i.test(userAgent)) {
    return "macOS";
  }

  if (/Linux/i.test(userAgent)) {
    return "Linux";
  }

  return "Perangkat desktop";
}

function getConnectionLabel() {
  if (typeof navigator === "undefined") {
    return "Koneksi standar";
  }

  const connection = (
    navigator as Navigator & {
      connection?: {
        effectiveType?: string;
      };
    }
  ).connection;

  return connection?.effectiveType ? `Jaringan ${connection.effectiveType.toUpperCase()}` : "Koneksi aktif";
}

function buildLocationLabel(location: DeviceContextResponse["location"]) {
  const parts = [location.city, location.region, location.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Lokasi belum terdeteksi";
}

function formatCoordinates(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) {
    return null;
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export function LoginDeviceInfo() {
  const [remoteContext, setRemoteContext] = useState<DeviceContextResponse | null>(null);
  const [localInfo, setLocalInfo] = useState<DeviceInfoState | null>(null);
  const [deviceGeo, setDeviceGeo] = useState<DeviceGeoState>({
    status: "requesting",
    latitude: null,
    longitude: null,
    accuracy: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const userAgent = window.navigator.userAgent;
    const localeLabel = Intl.DateTimeFormat().resolvedOptions().locale || window.navigator.language || "id-ID";
    const timezoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";

    setLocalInfo({
      browserLabel: detectBrowserLabel(userAgent),
      deviceLabel: detectDeviceLabel(userAgent),
      localeLabel,
      timezoneLabel,
      connectionLabel: getConnectionLabel(),
    });

    const controller = new AbortController();
    let isActive = true;

    fetch("/api/device-context", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as DeviceContextResponse;
      })
      .then((payload) => {
        if (payload && isActive) {
          setRemoteContext(payload);
        }
      })
      .catch(() => {
        if (isActive) {
          setRemoteContext(null);
        }
      });

    if (!window.isSecureContext) {
      deleteClientCookie(DEVICE_LOCATION_COOKIE_NAME);
      setDeviceGeo({
        status: "insecure",
        latitude: null,
        longitude: null,
        accuracy: null,
      });
    } else if (!("geolocation" in window.navigator)) {
      deleteClientCookie(DEVICE_LOCATION_COOKIE_NAME);
      setDeviceGeo({
        status: "unsupported",
        latitude: null,
        longitude: null,
        accuracy: null,
      });
    } else {
      setDeviceGeo({
        status: "requesting",
        latitude: null,
        longitude: null,
        accuracy: null,
      });

      window.navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isActive) {
            return;
          }

          setClientCookie(
            DEVICE_LOCATION_COOKIE_NAME,
            serializeDeviceLocationSnapshot({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              capturedAt: new Date().toISOString(),
            }),
            1,
          );

          setDeviceGeo({
            status: "granted",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          if (!isActive) {
            return;
          }

          deleteClientCookie(DEVICE_LOCATION_COOKIE_NAME);

          setDeviceGeo({
            status: error.code === error.PERMISSION_DENIED ? "denied" : "error",
            latitude: null,
            longitude: null,
            accuracy: null,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    }

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const locationLabel = useMemo(
    () =>
      buildLocationLabel(
        remoteContext?.location ?? {
          city: null,
          region: null,
          country: null,
        },
      ),
    [remoteContext],
  );

  const preciseCoordinates = useMemo(
    () => formatCoordinates(deviceGeo.latitude, deviceGeo.longitude),
    [deviceGeo.latitude, deviceGeo.longitude],
  );

  const connectionStatus = remoteContext?.isPrivateNetwork
    ? "Jalur lokal / private network"
    : "Akses publik terdeteksi";

  const geoStatusLabel =
    deviceGeo.status === "granted"
      ? "Lokasi perangkat aktif"
      : deviceGeo.status === "denied"
        ? "Izin lokasi ditolak"
        : deviceGeo.status === "insecure"
          ? "Lokasi butuh HTTPS / localhost"
          : deviceGeo.status === "unsupported"
            ? "Lokasi tidak didukung"
            : deviceGeo.status === "error"
              ? "Lokasi gagal dibaca"
              : "Meminta izin lokasi";

  const badgeItems = [
    {
      icon: ShieldCheck,
      label: connectionStatus,
    },
    {
      icon: Globe,
      label: remoteContext?.ipAddress ? `IP ${remoteContext.ipAddress}` : "IP sedang dideteksi",
    },
    {
      icon: MapPin,
      label: `Lokasi IP ${locationLabel}`,
    },
    {
      icon: MapPin,
      label: preciseCoordinates && deviceGeo.status === "granted" ? `GPS ${preciseCoordinates}` : geoStatusLabel,
    },
    {
      icon: LaptopMinimal,
      label: localInfo?.browserLabel ?? "Membaca browser",
    },
    {
      icon: LaptopMinimal,
      label: localInfo?.deviceLabel ?? "Membaca perangkat",
    },
    {
      icon: Wifi,
      label: localInfo?.connectionLabel ?? "Membaca jaringan",
    },
    {
      icon: Wifi,
      label: remoteContext?.timezone ?? localInfo?.timezoneLabel ?? "Zona waktu belum tersedia",
    },
  ] as const;
  return (
    <div className="mt-auto ml-auto w-full max-w-[33rem] text-white xl:max-w-[36rem]">
      <div className="grid grid-cols-4 gap-x-4 gap-y-2.5">
        {badgeItems.map((item) => {
          const Icon = item.icon;

          return (
            <Badge
              key={item.label}
              variant="outline"
              title={item.label}
              className="flex min-h-[2.8rem] w-full min-w-0 items-start justify-start gap-2 overflow-hidden rounded-full border-white/16 bg-black/12 px-3.5 py-2 text-left text-[11px] text-white/92 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.65)] backdrop-blur-sm [&>svg]:size-3.5! [&>svg]:shrink-0"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Icon />
              </span>
              <span className="min-w-0 whitespace-normal leading-tight">{item.label}</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
