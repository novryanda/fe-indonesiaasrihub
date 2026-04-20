"use client";

import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

type UserAvatarPlaceholderProps = {
  className?: string;
  iconClassName?: string;
};

export function UserAvatarPlaceholder({ className, iconClassName }: UserAvatarPlaceholderProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-full items-center justify-center rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96))]",
        className,
      )}
    >
      <span className="flex size-[62%] items-center justify-center rounded-full border border-border/60 bg-background/80 shadow-inner">
        <UserRound className={cn("size-[52%] text-muted-foreground/70", iconClassName)} />
      </span>
    </span>
  );
}
