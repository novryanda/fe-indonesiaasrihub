import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserManagementView } from "@/features/user-management/components/user-management-view";

export function ManajemenUserPageView() {
  return (
    <section className="space-y-6">
      <Card className="overflow-hidden border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.12),_transparent_40%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-white/80 px-3 py-1 text-emerald-700">
                Admin / Manajemen User
              </Badge>
              <div className="space-y-2">
                <h1 className="font-semibold text-3xl tracking-tight">Manajemen User</h1>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  Kelola data user berbasis kontrak backend endpoint users dengan kontrol akses berbasis role.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserManagementView />
    </section>
  );
}
