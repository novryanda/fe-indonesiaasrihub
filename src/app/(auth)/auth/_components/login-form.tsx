"use client";

import type { FormEvent } from "react";

import { AlertCircle } from "lucide-react";

import type { LoginRole } from "@/app/(auth)/auth/types/auth.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLE_META: Record<
  LoginRole,
  {
    placeholder: string;
  }
> = {
  creator: {
    placeholder: "email.tim-operasional@asrihub.id atau wcc.nasional01",
  },
  admin: {
    placeholder: "superadmin@asrihub.id atau superadmin",
  },
};

interface LoginFormProps {
  role: LoginRole;
  identifier: string;
  password: string;
  isLoading: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onIdentifierChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}

export function LoginForm({
  role,
  identifier,
  password,
  isLoading,
  error,
  onSubmit,
  onIdentifierChange,
  onPasswordChange,
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
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="identifier" className="font-medium text-foreground text-sm">
          Email atau Username
        </label>
        <Input
          id="identifier"
          type="text"
          placeholder={roleMeta.placeholder}
          value={identifier}
          onChange={(event) => onIdentifierChange(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="font-medium text-foreground text-sm">
            Password
          </label>
          <button type="button" className="font-medium text-primary text-sm transition-colors hover:text-primary/80">
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
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <label htmlFor="remember" className="text-muted-foreground text-sm">
          Ingat saya di perangkat ini
        </label>
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Masuk Aplikasi
      </Button>
    </form>
  );
}
