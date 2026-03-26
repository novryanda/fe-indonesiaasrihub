"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { PLATFORM_OPTIONS } from "../constants/content-options";
import type { ContentPlatform } from "../types/content.type";

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
          >
            <Badge
              variant="outline"
              className={cn(
                "h-7 min-w-7 justify-center rounded-full px-2 font-semibold",
                selected
                  ? "border-current/40 bg-white/60 text-current"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {platform.shortLabel ?? platform.label.slice(0, 2)}
            </Badge>
            <span className="font-medium text-sm">{platform.label}</span>
          </button>
        );
      })}
    </div>
  );
}
