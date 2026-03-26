"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import type { UserRole } from "@/app/(auth)/auth/types/auth.types";
import { useSession } from "@/lib/auth-client";

function extractAccessToken(session: unknown) {
  if (!session || typeof session !== "object") {
    return undefined;
  }

  const sessionRecord = session as Record<string, unknown>;
  const nestedSession =
    sessionRecord.session && typeof sessionRecord.session === "object"
      ? (sessionRecord.session as Record<string, unknown>)
      : null;

  const sessionToken = nestedSession?.token;
  if (typeof sessionToken === "string") {
    return sessionToken;
  }

  const topLevelToken = sessionRecord.token;
  if (typeof topLevelToken === "string") {
    return topLevelToken;
  }

  return undefined;
}

export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const role = ((session?.user as { role?: string } | undefined)?.role ?? "wcc") as UserRole;
  const accessToken = extractAccessToken(session);
  const isAuthorized = Boolean(session) && allowedRoles.includes(role);

  useEffect(() => {
    if (!isPending && session && !isAuthorized) {
      router.replace("/unauthorized");
    }
  }, [isAuthorized, isPending, router, session]);

  return {
    session,
    isPending,
    role,
    accessToken,
    isAuthorized,
  };
}
