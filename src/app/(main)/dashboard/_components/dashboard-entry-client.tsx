"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import type { UserRole } from "@/app/(auth)/auth/types/auth.types";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import { useSession } from "@/lib/auth-client";
import { getDefaultRouteForRole } from "@/lib/role-routes";

export function DashboardEntryClient() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const role = ((session?.user as { role?: UserRole } | undefined)?.role ?? "wcc") as UserRole;

  useEffect(() => {
    if (!isPending && session) {
      router.replace(getDefaultRouteForRole(role));
    }

    if (!isPending && !session) {
      router.replace("/auth/login");
    }
  }, [isPending, role, router, session]);

  return <FullScreenLoader isLoading text="Mengarahkan ke halaman utama..." />;
}
