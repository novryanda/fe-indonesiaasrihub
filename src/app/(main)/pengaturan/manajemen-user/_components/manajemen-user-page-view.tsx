import { UserManagementView } from "@/features/user-management/components/user-management-view";

export function ManajemenUserPageView() {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="font-semibold text-2xl">Manajemen User</h1>
        <p className="text-muted-foreground text-sm">
          Kelola data user berbasis kontrak backend endpoint users. Akses terbatas untuk role superadmin.
        </p>
      </header>

      <UserManagementView />
    </section>
  );
}
