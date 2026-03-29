"use client";

import Image from "next/image";
import { Suspense, type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { GoogleButton } from "../_components/social-auth/google-button";
import { LoginForm } from "../_components/login-form";
import { cn } from "@/lib/utils";
import { authClient, signIn, signOut } from "@/lib/auth-client";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import type { LoginRole, UserRole, UserStatus } from "@/app/(auth)/auth/types/auth.types";

const ROLE_META: Record<
  LoginRole,
  {
    demoUser: string;
    demoPassword: string;
  }
> = {
  creator: {
    demoUser: "wcc.nasional01@asrihub.id",
    demoPassword: "AsriHub123!",
  },
  admin: {
    demoUser: "superadmin@asrihub.id",
    demoPassword: "AsriHub123!",
  },
};

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

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<LoginRole>("creator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl");
  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : null;

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = (await signIn.email({
        email,
        password,
      })) as AuthActionResult;

      if (result?.error) {
        const message = result.error.message ?? "Login gagal. Silakan coba lagi.";
        setError(message);
        toast.error(message);
        setIsLoading(false);
        return;
      }

      let authUser = getAuthUserFromResult(result);

      if (!authUser) {
        const sessionResult = (await authClient.getSession()) as
          | {
              data?: {
                user?: AuthUserPayload;
              } | null;
              user?: AuthUserPayload;
              error?: {
                message?: string;
              } | null;
            }
          | null;

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
      await new Promise(r => setTimeout(r, 1500));
      
      router.push(safeCallbackUrl ?? getDashboardByRole(userRole));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan jaringan. Silakan coba lagi.";
      setError(message);
      toast.error(message);
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    const meta = ROLE_META[role];
    setEmail(meta.demoUser);
    setPassword(meta.demoPassword);
    setError("");
  };

  const handleRoleChange = (newRole: LoginRole) => {
    setRole(newRole);
    setEmail("");
    setPassword("");
    setError("");
  };

  return (
    <>
      <FullScreenLoader isLoading={isLoading} text="Sedang masuk ke sistem..." />
      <div className="flex h-dvh overflow-hidden bg-white">
        {/* Left Decoration Panel */}
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative flex h-48 w-48 items-center justify-center rounded-[3rem] bg-white/10 backdrop-blur-md mx-auto hover:scale-105 transition-all duration-500 shadow-2xl shadow-black/20">
              <div className="relative h-32 w-32">
                <Image 
                  src="/logo-klhk.png" 
                  alt="KLHK Logo" 
                  fill
                  className="object-contain" 
                  priority
                />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="font-bold text-4xl text-white tracking-tight">Indonesia ASRI Hub</h1>
              <p className="text-primary-foreground/70 text-lg font-medium">Platform Modern untuk Lingkungan Hidup</p>
            </div>

            <div className="pt-12 text-left space-y-4">
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <p className="text-sm text-white/80">Sistem terintegrasi KLHK</p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <p className="text-sm text-white/80">Platform Pendukung KIE</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="flex w-full items-center justify-center bg-gray-50 p-6 lg:w-2/3 lg:p-12">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Selamat Datang</h2>
          <p className="text-gray-500">Silakan masuk untuk mengakses portal ASRI Hub</p>
        </div>

            {/* Role Switcher Tabs */}
            <div className="grid w-full grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1.5 shadow-sm border border-gray-200">
              <button
                onClick={() => handleRoleChange("creator")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all rounded-lg",
                  role === "creator"
                    ? "bg-white text-secondary-600 shadow-md ring-1 ring-black/5"
                    : "text-gray-500 hover:bg-gray-200"
                )}
              >
                <UserCheck className="h-4 w-4" />
                Kreator / PIC
              </button>
              <button
                onClick={() => handleRoleChange("admin")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all rounded-lg",
                  role === "admin"
                    ? "bg-white text-gray-900 shadow-md ring-1 ring-black/5"
                    : "text-gray-500 hover:bg-gray-200"
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
            <LoginForm
              role={role}
              email={email}
              password={password}
              isLoading={isLoading}
              error={error}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleLogin}
              onFillDemoCredentials={handleFillDemo}
            />

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-medium">Atau masuk dengan</span>
              </div>
            </div>

            <GoogleButton className="w-full font-semibold border-gray-200 text-gray-700 hover:bg-gray-50" variant="outline" />
          </div>

          <p className="text-center text-sm text-gray-500 font-medium">
            Belum punya akun?{" "}
            <a href="#" className="font-bold text-primary hover:underline">
              Hubungi Administrator
            </a>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

export default function LoginV1() {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center bg-gray-50 text-sm text-gray-500">Memuat halaman login...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
