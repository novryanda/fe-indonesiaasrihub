"use client";

import { type FormEvent, Suspense, useState } from "react";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";

import type { LoginRole, UserRole, UserStatus } from "@/app/(auth)/auth/types/auth.types";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import { authClient, signIn, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { LoginForm } from "../_components/login-form";
import { GoogleButton } from "../_components/social-auth/google-button";

function getDashboardByRole(role: UserRole): string {
  switch (role) {
    case "superadmin":
      return "/dashboard/nasional";
    case "sysadmin":
      return "/system/jadwal-scrapping";
    case "qcc_wcc":
      return "/dashboard/regional";
    case "pic_sosmed":
      return "/akun/akun-sosmed";
    case "wcc":
      return "/dashboard/konten-saya";
    default:
      return "/dashboard/konten-saya";
  }
}

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
  const [role, setRole] = useState<LoginRole>("creator");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl");
  const safeCallbackUrl = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const normalizedIdentifier = identifier.trim();

      if (!normalizedIdentifier) {
        const message = "Email atau username wajib diisi.";
        setError(message);
        toast.error(message);
        setIsLoading(false);
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
        setIsLoading(false);
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
          setIsLoading(false);
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
        setIsLoading(false);
        return;
      }

      const userRole = authUser?.role ?? "wcc";

      // Jeda buatan untuk memberi waktu loading screen terlihat (sesuai permintaan user)
      await new Promise((r) => setTimeout(r, 1500));

      router.push(safeCallbackUrl ?? getDashboardByRole(userRole));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan jaringan. Silakan coba lagi.";
      setError(message);
      toast.error(message);
      setIsLoading(false);
    }
  };

  const handleRoleChange = (newRole: LoginRole) => {
    setRole(newRole);
    setIdentifier("");
    setPassword("");
    setError("");
  };

  return (
    <>
      <FullScreenLoader isLoading={isLoading} text="Sedang masuk ke sistem..." />
      <div className="app-bg-canvas flex h-dvh overflow-hidden">
        {/* Left Decoration Panel */}
        <div className="app-bg-hero-strong hidden lg:block lg:w-1/3">
          <div className="flex h-full flex-col items-center justify-center p-12 text-center">
            <div className="fade-in slide-in-from-bottom-4 animate-in space-y-6 duration-700">
              <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-[3rem] bg-white/10 shadow-2xl shadow-black/20 backdrop-blur-md transition-all duration-500 hover:scale-105">
                <div className="relative h-32 w-32">
                  <Image src="/logo-klhk.png" alt="KLHK Logo" fill className="object-contain" priority />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="font-bold text-4xl text-white tracking-tight">Indonesia ASRI Hub</h1>
                <p className="font-medium text-lg text-primary-foreground/70">Platform Modern untuk Lingkungan Hidup</p>
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
            <div className="space-y-6">
              <div className="flex flex-col space-y-2 text-center">
                <h2 className="font-bold text-3xl text-foreground tracking-tight">Selamat Datang</h2>
                <p className="text-muted-foreground">Silakan masuk untuk mengakses portal ASRI Hub</p>
              </div>

              {/* Role Switcher Tabs */}
              <div className="app-tab-surface grid w-full grid-cols-2 gap-2 rounded-xl border p-1.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleRoleChange("creator")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all",
                    role === "creator"
                      ? "app-tab-active text-primary shadow-md ring-1 ring-black/5"
                      : "text-muted-foreground hover:bg-background/70",
                  )}
                >
                  <UserCheck className="h-4 w-4" />
                  Kreator / PIC
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange("admin")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all",
                    role === "admin"
                      ? "app-tab-active text-foreground shadow-md ring-1 ring-black/5"
                      : "text-muted-foreground hover:bg-background/70",
                  )}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </button>
              </div>
            </div>

            <div className="app-bg-surface app-border-soft rounded-2xl border p-8 shadow-xl">
              <LoginForm
                role={role}
                identifier={identifier}
                password={password}
                isLoading={isLoading}
                error={error}
                onIdentifierChange={setIdentifier}
                onPasswordChange={setPassword}
                onSubmit={handleLogin}
              />

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-border border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 font-medium text-muted-foreground">Atau masuk dengan</span>
                </div>
              </div>

              <GoogleButton
                className="w-full border-border font-semibold text-foreground hover:bg-muted/70"
                variant="outline"
              />
            </div>

            <p className="text-center font-medium text-muted-foreground text-sm">
              Belum punya akun? <span className="font-bold text-primary">Hubungi Administrator</span>
            </p>
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
