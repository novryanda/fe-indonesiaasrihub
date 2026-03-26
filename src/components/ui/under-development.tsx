import { Button } from "./button";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Construction } from "lucide-react";
import Link from "next/link";

export function UnderDevelopment() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4">
      <Alert className="max-w-md w-full text-center bg-muted/60 dark:bg-muted/40 border-0 shadow-none">
        <Construction className="mx-auto mb-4 h-12 w-12 text-primary" />
        <AlertTitle className="text-2xl font-bold mb-2">Halaman Sedang Dikembangkan</AlertTitle>
        <AlertDescription className="mb-4 text-muted-foreground">
          Fitur ini belum tersedia. Silakan kembali lagi nanti.
        </AlertDescription>
        <Button asChild variant="default" className="mx-auto">
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </Alert>
    </div>
  );
}
