import type { UserRole } from "@/app/(auth)/auth/types/auth.types";

const COMMON_EXACT_ROUTES = new Set(["/dashboard", "/akun/profil"]);

const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  superadmin: "/dashboard/nasional",
  supervisi: "/dashboard/approval",
  sysadmin: "/system/jadwal-scrapping",
  qcc_wcc: "/dashboard/regional",
  wcc: "/dashboard/konten-saya",
  pic_sosmed: "/akun/akun-sosmed",
  blast: "/blast/aktivitas",
};

const ROLE_ALLOWED_ROUTE_PREFIXES: Record<UserRole, string[]> = {
  superadmin: [
    "/dashboard/nasional",
    "/dashboard/approval",
    "/dashboard/blast",
    "/blast/ranking",
    "/konten/bank-konten",
    "/konten/bank-materi",
    "/analitik/monitoring-sosmed",
    "/analitik/laporan-monitoring-tugas",
    "/analitik/laporan-analitik",
    "/akun/akun-sosmed",
    "/akun/daftar-akun",
    "/akun/verifikasi-akun",
    "/pengaturan/manajemen-user",
  ],
  supervisi: [
    "/dashboard/approval",
    "/konten/bank-konten",
    "/analitik/monitoring-sosmed",
    "/analitik/laporan-monitoring-tugas",
  ],
  sysadmin: [
    "/blast/log",
    "/blast/ranking",
    "/system/whatsapp-automation",
    "/system/whatsapp-gateway",
    "/system/jadwal-scrapping",
    "/system/tarik-scrapping",
    "/system/log-scrapping",
    "/system/log-activity",
    "/system/konfigurasi",
    "/pengaturan/manajemen-user",
  ],
  qcc_wcc: [
    "/dashboard/regional",
    "/dashboard/review-konten",
    "/konten/bank-konten",
    "/tim/pic-sosmed",
    "/analitik/monitoring-sosmed",
    "/analitik/laporan-regional",
  ],
  wcc: [
    "/dashboard/konten-saya",
    "/aksi/submit-konten",
    "/konten/bank-konten",
    "/konten/bank-materi",
    "/akun/notifikasi",
  ],
  pic_sosmed: [
    "/dashboard/laporan-monitoring-tugas",
    "/dashboard/postingan-saya",
    "/konten/bank-konten",
    "/konten/bank-materi",
    "/akun/akun-sosmed",
    "/akun/notifikasi",
  ],
  blast: ["/blast/aktivitas", "/blast/log", "/blast/manual", "/blast/ulang", "/blast/ranking", "/konten/bank-konten"],
};

function normalizePathname(pathname: string) {
  const sanitized = pathname.split("?")[0]?.split("#")[0]?.trim() ?? "";

  if (!sanitized.startsWith("/")) {
    return "/";
  }

  if (sanitized.length > 1 && sanitized.endsWith("/")) {
    return sanitized.slice(0, -1);
  }

  return sanitized || "/";
}

export function getDefaultRouteForRole(role: UserRole) {
  return ROLE_HOME_ROUTES[role] ?? ROLE_HOME_ROUTES.wcc;
}

export function isRouteAllowedForRole(role: UserRole, pathname: string) {
  const normalizedPath = normalizePathname(pathname);

  if (COMMON_EXACT_ROUTES.has(normalizedPath)) {
    return true;
  }

  return ROLE_ALLOWED_ROUTE_PREFIXES[role].some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}

export function resolveRouteForRole(role: UserRole, pathname?: string | null) {
  if (!pathname) {
    return getDefaultRouteForRole(role);
  }

  return isRouteAllowedForRole(role, pathname) ? normalizePathname(pathname) : getDefaultRouteForRole(role);
}
