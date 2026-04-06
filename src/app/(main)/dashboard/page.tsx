import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ROLE_HOME_COOKIE_NAME } from "@/lib/auth-constants";

import { DashboardEntryClient } from "./_components/dashboard-entry-client";

export default async function DashboardEntryPage() {
  const cookieStore = await cookies();
  const roleHomeCookie = cookieStore.get(ROLE_HOME_COOKIE_NAME)?.value;
  const roleHomeRoute = roleHomeCookie ? decodeURIComponent(roleHomeCookie) : null;
  const safeRoleHomeRoute =
    roleHomeRoute && roleHomeRoute.startsWith("/") && !roleHomeRoute.startsWith("//") ? roleHomeRoute : null;

  if (safeRoleHomeRoute) {
    redirect(safeRoleHomeRoute);
  }

  return <DashboardEntryClient />;
}
