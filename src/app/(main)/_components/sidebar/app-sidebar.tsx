"use client";

import Image from "next/image";
import Link from "next/link";

import { useShallow } from "zustand/react/shallow";

import type { UserRole } from "@/app/(auth)/auth/types/auth.types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { useSession } from "@/lib/auth-client";
import { filterSidebarByRole, sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const { data: session } = useSession();
  const userRole = ((session?.user as { role?: string })?.role ?? "wcc") as UserRole;
  const filteredItems = filterSidebarByRole(sidebarItems, userRole);

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: (session.user as { image?: string }).image ?? "",
      }
    : { name: "Loading...", email: "", avatar: "" };

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link prefetch={false} href="/dashboard">
                <div className="flex items-center gap-0">
                  <Image
                    src="/logo-klhk.png"
                    alt="Logo KLHK"
                    width={32}
                    height={32}
                    className="size-8 rounded-sm object-contain"
                  />
                  <Image
                    src="/logo-indonesiaasrihub.png"
                    alt={APP_CONFIG.name}
                    width={180}
                    height={40}
                    priority
                    className="w-[180px] h-auto object-contain hidden group-data-[collapsible=icon]:hidden sm:block"
                  />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
