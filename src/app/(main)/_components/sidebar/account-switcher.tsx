"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { CreditCard, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatarPlaceholder } from "@/components/ui/user-avatar-placeholder";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut, useSession } from "@/lib/auth-client";
import { ROLE_HOME_COOKIE_NAME } from "@/lib/auth-constants";
import { cn } from "@/lib/utils";

export function AccountSwitcher() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: (session.user as { image?: string }).image ?? "",
        role: ((session.user as { role?: string }).role ?? "wcc") as string,
      }
    : { name: "", email: "", avatar: "", role: "" };

  const clearRoleHomeRoute = () => {
    document.cookie = `${ROLE_HOME_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      clearRoleHomeRoute();
      await new Promise((resolve) => {
        window.setTimeout(resolve, 2000);
      });
      window.location.replace("/auth/login");
    } catch {
      setIsLoggingOut(false);
    }
  };

  if (isPending) {
    return <Skeleton className="size-9 rounded-lg" />;
  }

  return (
    <>
      <FullScreenLoader isLoading={isLoggingOut} text="Sedang keluar dari sistem..." />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="size-9 cursor-pointer rounded-lg">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback className="rounded-lg bg-white p-0">
              <UserAvatarPlaceholder />
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
          <div className={cn("border-l-2 border-l-primary bg-accent/50 p-0")}>
            <div className="flex w-full items-center justify-between gap-2 px-1 py-1.5">
              <Avatar className="size-9 rounded-lg">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-white p-0">
                  <UserAvatarPlaceholder />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs capitalize">{user.role}</span>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push("/akun/profil")}>
              <CreditCard />
              Akun
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
