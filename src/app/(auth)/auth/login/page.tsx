"use client";

import { type FormEvent, Suspense, useState } from "react";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "sonner";

import type { UserRole, UserStatus } from "@/app/(auth)/auth/types/auth.types";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import { authClient, signIn, signOut } from "@/lib/auth-client";
import { resolveRouteForRole } from "@/lib/role-routes";

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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl");
  const safeCallbackUrl = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsRedirecting(false);
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
      setIsSubmitting(false);
      setIsRedirecting(true);

      // Jeda buatan untuk memberi waktu loading screen terlihat (sesuai permintaan user)
      await new Promise((r) => setTimeout(r, 1500));

      router.push(targetRoute);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan jaringan. Silakan coba lagi.";
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
      setIsRedirecting(false);
    }
  };

  return (
    <>
      <FullScreenLoader isLoading={isRedirecting} text="Sedang masuk ke sistem..." />
      <div className="app-bg-canvas flex h-dvh overflow-hidden">
        {/* Left Decoration Panel */}
        <div className="relative hidden overflow-hidden lg:block lg:w-1/3">
          <div
            className="absolute inset-0 bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: "url('/silas-baisch-PvBECXDZw84-unsplash.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-emerald-900/60 to-emerald-950/75" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center p-12 text-center">
            <div className="fade-in slide-in-from-bottom-4 animate-in space-y-6 duration-700">
              <div className="space-y-2">
                <h1 className="font-bold text-4xl text-white tracking-tight">Indonesia ASRI Hub</h1>
                <p className="font-medium text-lg text-primary-foreground/70">Waste Crisis Centre (WCC)</p>
                <p className="text-sm text-white/80">Kementrian Lingkungan Hidup/Badan Pengendalian Lingkungan Hidup</p>
              </div>

              <div className="space-y-4 pt-12 text-left">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="h-2 w-2 rounded-full bg-emerald-300" />
                  <p className="text-sm text-white/80">Sistem terintegrasi KLHK</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="h-2 w-2 rounded-full bg-orange-300" />
                  <p className="text-sm text-white/80">Platform Pendukung KIE</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Login Section */}
        <div className="app-bg-canvas flex w-full items-center justify-center p-6 lg:w-2/3 lg:p-12">
          <div className="fade-in slide-in-from-right-4 w-full max-w-md animate-in space-y-8 duration-500">
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28">
                  <Image src="/logo-klhk.png" alt="KLHK Logo" fill className="object-contain" priority />
                </div>
                <div className="relative h-12 w-[13.5rem] overflow-hidden sm:h-14 sm:w-[15rem]">
                  <Image
                    src="/logo-indonesiaasrihub.png"
                    alt="Indonesia ASRI Hub"
                    fill
                    className="scale-[1.18] object-cover object-center"
                    priority
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2 text-center">
                {/* <h2 className="font-bold text-3xl text-foreground tracking-tight">Selamat Datang</h2>
                <p className="text-muted-foreground">Silakan masuk untuk mengakses portal ASRI Hub</p> */}
              </div>
            </div>

            <div className="app-bg-surface app-border-soft rounded-2xl border p-8 shadow-xl">
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
