import { createAuthClient } from "better-auth/react";

import { getRequiredEnv, normalizeBaseUrl } from "@/lib/env";

const APP_BASE_URL =
  typeof window !== "undefined" ? window.location.origin : normalizeBaseUrl(getRequiredEnv("NEXT_PUBLIC_APP_URL"));

export const authClient = createAuthClient({
  baseURL: APP_BASE_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
