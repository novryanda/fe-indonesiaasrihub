"use client";

import { Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { ReviewHistoryItem } from "@/features/content-shared/types/content.type";
import { formatDateTime, formatReviewStepLabel } from "@/features/content-shared/utils/content-formatters";

function formatActionLabel(action: ReviewHistoryItem["action"]) {
  switch (action) {
    case "approved":
      return "Disetujui";
    case "rejected":
      return "Ditolak";
    default:
      return "Dikirim";
  }
}

export function ReviewHistoryDialog({
  open,
  onOpenChange,
  title,
  items,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  items: ReviewHistoryItem[];
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Riwayat Review</DialogTitle>
          <DialogDescription>
            {title ? `Jejak keputusan untuk "${title}".` : "Jejak keputusan konten."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Spinner />
            <span>Memuat riwayat review...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
                Riwayat review belum tersedia.
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.step}-${item.timestamp}`} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{formatReviewStepLabel(item.step)}</p>
                      <p className="text-muted-foreground text-xs">{item.actor_name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {formatActionLabel(item.action)}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock3 className="size-3.5" />
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                  {item.note && <p className="mt-3 text-sm leading-6">{item.note}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
