"use client";

import { cn } from "@/lib/utils";

import type { ContentPlatform } from "../types/content.type";
import { formatPlatformLabel } from "../utils/content-formatters";
import { PlatformLogo } from "./platform-logo";

interface PlatformIconProps {
  platform: ContentPlatform;
  className?: string;
  iconClassName?: string;
}

interface PlatformIconListProps {
  platforms: readonly ContentPlatform[];
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
}

export function PlatformIcon({ platform, className, iconClassName }: PlatformIconProps) {
  return (
    <span
      className={cn("inline-flex size-5 items-center justify-center", className)}
      title={formatPlatformLabel(platform)}
      aria-label={formatPlatformLabel(platform)}
    >
      <PlatformLogo platform={platform} className={cn("h-[18px] w-[18px] shrink-0", iconClassName)} />
    </span>
  );
}

export function PlatformIconList({ platforms, className, itemClassName, iconClassName }: PlatformIconListProps) {
  const uniquePlatforms = [...new Set(platforms)];

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {uniquePlatforms.map((platform) => (
        <PlatformIcon key={platform} platform={platform} className={itemClassName} iconClassName={iconClassName} />
      ))}
    </div>
  );
}
