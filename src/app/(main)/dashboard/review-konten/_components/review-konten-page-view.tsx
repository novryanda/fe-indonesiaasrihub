import { Card, CardContent } from "@/components/ui/card";

export function ReviewKontenPageView() {
  return (
    <Card>
      <CardContent className="py-10 text-center text-muted-foreground">
        Workflow review konten oleh QCC/WCC sudah dinonaktifkan. Konten WCC sekarang langsung masuk ke final approval
        superadmin.
      </CardContent>
    </Card>
  );
}
