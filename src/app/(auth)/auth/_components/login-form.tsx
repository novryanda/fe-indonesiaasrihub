"use client";

import type { FormEvent } from "react";
import { AlertCircle, Info, Key } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LoginRole } from "@/app/(auth)/auth/types/auth.types";

const ROLE_META: Record<
  LoginRole,
  {
    placeholder: string;
    demoUser: string;
    demoPassword: string;
    demoLabel: string;
  }
> = {
  creator: {
    placeholder: "email.tim-operasional@asrihub.id",
    demoUser: "wcc.nasional01@asrihub.id",
    demoPassword: "AsriHub123!",
    demoLabel: "Kreator / PIC",
  },
  admin: {
    placeholder: "superadmin@asrihub.id",
    demoUser: "superadmin@asrihub.id",
    demoPassword: "AsriHub123!",
    demoLabel: "Admin",
  },
};

interface LoginFormProps {
  role: LoginRole;
  email: string;
  password: string;
  isLoading: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onFillDemoCredentials: () => void;
}

export function LoginForm({
  role,
  email,
  password,
  isLoading,
  error,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onFillDemoCredentials,
}: LoginFormProps) {
  const roleMeta = ROLE_META[role];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email / NIP
        </label>
        <Input
          id="email"
          type="text"
          placeholder={roleMeta.placeholder}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </label>
          <button
            type="button"
            className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-500"
          >
            Lupa password?
          </button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="remember"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
        />
        <label htmlFor="remember" className="text-sm text-gray-500">
          Ingat saya di perangkat ini
        </label>
      </div>

      <Button
        type="submit"
        className={`w-full ${role === "creator" ? "bg-emerald-600 hover:bg-emerald-600/90 text-white" : "bg-gray-900 hover:bg-gray-800 text-white"}`}
        isLoading={isLoading}
      >
        Masuk Aplikasi
      </Button>

      {/* <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-full bg-amber-100 p-1.5">
            <Key className="h-4 w-4 text-amber-700" />
          </div>
          <div className="flex-1">
            <h4 className="flex items-center gap-2 font-semibold text-amber-900">
              Akses Demo {roleMeta.demoLabel}
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                Simulasi
              </span>
            </h4>
            <p className="mb-2 mt-1 text-xs text-amber-700">
              Klik kredensial di bawah untuk isi otomatis:
            </p>
            <button
              type="button"
              onClick={onFillDemoCredentials}
              className="group w-full rounded-md border border-amber-200 bg-white p-2 text-left shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50"
            >
              <div className="grid grid-cols-[40px_1fr] gap-1 font-mono text-xs text-amber-900">
                <span className="text-amber-600">User:</span>
                <span className="font-bold">{roleMeta.demoUser}</span>
                <span className="text-amber-600">Pass:</span>
                <span className="font-bold">{roleMeta.demoPassword}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-amber-500 group-hover:text-amber-700">
                <Info className="h-3 w-3" />
                Klik untuk auto-fill
              </div>
            </button>
          </div>
        </div>
      </div> */}
    </form>
  );
}
