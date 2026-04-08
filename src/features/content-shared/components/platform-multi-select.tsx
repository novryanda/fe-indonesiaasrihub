"use client";

import { cn } from "@/lib/utils";

import { PLATFORM_OPTIONS } from "../constants/content-options";
import type { ContentPlatform } from "../types/content.type";
import { PlatformLogo } from "./platform-logo";

interface PlatformMultiSelectProps {
  value: ContentPlatform[];
  onChange: (value: ContentPlatform[]) => void;
  disabled?: boolean;
}

export function PlatformMultiSelect({ value, onChange, disabled = false }: PlatformMultiSelectProps) {
  const togglePlatform = (platform: ContentPlatform) => {
    if (disabled) {
      return;
    }

    if (value.includes(platform)) {
      onChange(value.filter((item) => item !== platform));
      return;
    }

    onChange([...value, platform]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORM_OPTIONS.map((platform) => {
        const selected = value.includes(platform.value);

        return (
          <button
            key={platform.value}
            type="button"
            onClick={() => togglePlatform(platform.value)}
            disabled={disabled}
            className={cn(
              "group hover:-translate-y-0.5 flex min-w-28 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? (platform.accentClassName ?? "border-primary bg-primary/10 text-primary")
                : "border-border bg-background text-foreground hover:border-primary/30 hover:bg-primary/5",
            )}
            aria-pressed={selected}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition",
                selected ? "border-current/20 bg-white/70 shadow-sm" : "border-border bg-muted/70",
              )}
            >
              <PlatformLogo platform={platform.value} className="h-[18px] w-[18px]" />
            </span>
            <span className="font-medium text-sm">{platform.label}</span>
          </button>
        );
      })}
    </div>
  );
}
