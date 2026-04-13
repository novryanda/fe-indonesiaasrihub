"use client";

import { type FormEvent, Suspense, useEffect, useState } from "react";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "sonner";

import type { UserRole, UserStatus } from "@/app/(auth)/auth/types/auth.types";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import { authClient, signIn, signOut, useSession } from "@/lib/auth-client";
import { ROLE_HOME_COOKIE_NAME } from "@/lib/auth-constants";
import { resolveRouteForRole } from "@/lib/role-routes";

import { LoginDeviceInfo } from "../_components/login-device-info";
import { LoginForm } from "../_components/login-form";

type AuthUserPayload = {
  role?: UserRole;
  status?: UserStatus;
};

type AuthActionResult = {
  data?: {
    user?: AuthUserPayload;
  } | null;
  user?: AuthUserPayload;
  error?: {
    message?: string;
  } | null;
} | null;

function getAuthUserFromResult(result: AuthActionResult) {
  return result?.data?.user ?? result?.user ?? undefined;
}

function resolveAuthMessage(payload: unknown, fallback = "Login gagal. Silakan coba lagi.") {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const payloadRecord = payload as Record<string, unknown>;

  if (payloadRecord.error && typeof payloadRecord.error === "object") {
    const errorRecord = payloadRecord.error as Record<string, unknown>;
    if (typeof errorRecord.message === "string") {
      return errorRecord.message;
    }
  }

  if (typeof payloadRecord.message === "string") {
    return payloadRecord.message;
  }

  return fallback;
}

function persistRoleHomeRoute(targetRoute: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ROLE_HOME_COOKIE_NAME}=${encodeURIComponent(targetRoute)}; Path=/; Max-Age=604800; SameSite=Lax`;
}

async function signInWithUsername(username: string, password: string): Promise<AuthActionResult> {
  const response = await fetch("/api/auth/sign-in/username", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const data = (await response.json().catch(() => null)) as AuthActionResult | null;

  if (!response.ok) {
    return {
      error: {
        message: resolveAuthMessage(
          data,
          response.status === 404
            ? "Login dengan username belum tersedia di server."
            : "Login gagal. Silakan coba lagi.",
        ),
      },
    };
  }

  return data;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: activeSession } = useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const [error, setError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl");
  const safeCallbackUrl = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;

  useEffect(() => {
    if (!redirectTarget) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.location.replace(redirectTarget);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [redirectTarget]);

  useEffect(() => {
    if (!activeSession || isSubmitting || isRedirecting) {
      return;
    }

    const activeRole = ((activeSession.user as { role?: UserRole } | undefined)?.role ?? "wcc") as UserRole;
    const targetRoute = resolveRouteForRole(activeRole, safeCallbackUrl);
    persistRoleHomeRoute(targetRoute);
    router.replace(targetRoute);
  }, [activeSession, isRedirecting, isSubmitting, router, safeCallbackUrl]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsRedirecting(false);
    setRedirectTarget(null);
    setError("");

    try {
      const normalizedIdentifier = identifier.trim();

      if (!normalizedIdentifier) {
        const message = "Email atau username wajib diisi.";
        setError(message);
        toast.error(message);
        setIsSubmitting(false);
        return;
      }

      const result = (
        normalizedIdentifier.includes("@")
          ? await signIn.email({
              email: normalizedIdentifier.toLowerCase(),
              password,
            })
          : await signInWithUsername(normalizedIdentifier.toLowerCase(), password)
      ) as AuthActionResult;

      if (result?.error) {
        const message = resolveAuthMessage(result, "Login gagal. Silakan coba lagi.");
        setError(message);
        toast.error(message);
        setIsSubmitting(false);
        return;
      }

      let authUser = getAuthUserFromResult(result);

      if (!authUser) {
        const sessionResult = (await authClient.getSession()) as {
          data?: {
            user?: AuthUserPayload;
          } | null;
          user?: AuthUserPayload;
          error?: {
            message?: string;
          } | null;
        } | null;

        if (sessionResult?.error) {
          const message = sessionResult.error.message ?? "Login gagal. Silakan coba lagi.";
          setError(message);
          toast.error(message);
          setIsSubmitting(false);
          return;
        }

        authUser = getAuthUserFromResult(sessionResult);
      }

      const userStatus = authUser?.status ?? "aktif";

      if (userStatus !== "aktif") {
        await signOut();
        const message = "Akun Anda sedang nonaktif dan tidak dapat masuk. Hubungi administrator.";
        setError(message);
        toast.error(message);
        setIsSubmitting(false);
        return;
      }

      const userRole = authUser?.role ?? "wcc";
      const targetRoute = resolveRouteForRole(userRole, safeCallbackUrl);
      persistRoleHomeRoute(targetRoute);
      setIsSubmitting(false);
      setIsRedirecting(true);
      setRedirectTarget(targetRoute);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan jaringan. Silakan coba lagi.";
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
      setIsRedirecting(false);
      setRedirectTarget(null);
    }
  };

  return (
    <>
      <FullScreenLoader isLoading={isRedirecting} text="Sedang masuk ke sistem..." />
      <div className="app-bg-canvas flex min-h-dvh flex-col overflow-y-auto xl:h-dvh xl:flex-row xl:overflow-hidden">
        {/* Left Decoration Panel */}
        <div className="relative hidden overflow-hidden xl:block xl:w-[40%] 2xl:w-[36%]">
          <div
            className="absolute inset-0 bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: "url('/silas-baisch-PvBECXDZw84-unsplash.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-emerald-900/60 to-emerald-950/75" />
          <div className="relative z-10 flex h-full flex-col justify-between p-8 xl:p-10 2xl:p-12">
            <div />

            <div className="fade-in slide-in-from-bottom-4 animate-in space-y-2.5 text-center duration-700 xl:space-y-3">
              <h1 className="font-bold text-3xl text-white tracking-tight 2xl:text-4xl">Indonesia ASRI Hub</h1>
              <p className="font-medium text-base text-primary-foreground/75 2xl:text-lg">Waste Crisis Centre (WCC)</p>
              <p className="mx-auto max-w-md text-sm text-white/85 2xl:max-w-lg">
                Kementrian Lingkungan Hidup/Badan Pengendalian Lingkungan Hidup
              </p>
            </div>

            <div className="fade-in slide-in-from-bottom-4 animate-in delay-150 duration-700">
              <LoginDeviceInfo />
            </div>
          </div>
        </div>

        {/* Right Login Section */}
        <div className="app-bg-canvas flex w-full flex-1 items-center justify-center px-5 py-8 sm:px-6 sm:py-10 lg:px-8 xl:w-[60%] xl:px-12 xl:py-12 2xl:w-[64%]">
          <div className="fade-in slide-in-from-right-4 w-full max-w-[26rem] animate-in space-y-6 duration-500 sm:space-y-7">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden sm:h-24 sm:w-24">
                  <Image
                    src="/logo-klhk.png"
                    alt="KLHK Logo"
                    width={1155}
                    height={1147}
                    sizes="(min-width: 640px) 96px, 80px"
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>
                <div className="flex h-11 w-[12.5rem] shrink-0 items-center justify-center overflow-hidden sm:h-12 sm:w-[13.5rem]">
                  <Image
                    src="/logo-indonesiaasrihub.svg"
                    alt="Indonesia ASRI Hub"
                    width={320}
                    height={80}
                    sizes="(min-width: 640px) 216px, 200px"
                    className="h-auto w-full object-contain"
                    priority
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2 text-center">
                {/* <h2 className="font-bold text-3xl text-foreground tracking-tight">Selamat Datang</h2>
                <p className="text-muted-foreground">Silakan masuk untuk mengakses portal ASRI Hub</p> */}
              </div>
            </div>

            <div className="app-bg-surface app-border-soft rounded-2xl border p-5 shadow-xl sm:p-6 xl:p-8">
              <LoginForm
                identifier={identifier}
                password={password}
                isLoading={isSubmitting}
                error={error}
                onIdentifierChange={setIdentifier}
                onPasswordChange={setPassword}
                onSubmit={handleLogin}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginV1() {
  return (
    <Suspense
      fallback={
        <div className="app-bg-canvas flex h-dvh items-center justify-center text-muted-foreground text-sm">
          Memuat halaman login...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
