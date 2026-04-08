"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { ApprovalBoardMode, ReviewDecisionPayload } from "../types/content-approval.type";

interface ReviewDecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTitle?: string;
  mode: ApprovalBoardMode;
  action: ReviewDecisionPayload["action"];
  isSubmitting: boolean;
  onSubmit: (payload: ReviewDecisionPayload) => Promise<void>;
}

export function ReviewDecisionDialog({
  open,
  onOpenChange,
  itemTitle,
  mode,
  action,
  isSubmitting,
  onSubmit,
}: ReviewDecisionDialogProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setNote("");
    setError("");
  }, [open]);

  const isReject = action === "rejected";
  const actionLabel = isReject
    ? mode === "regional-review"
      ? "Tolak dan minta revisi"
      : "Tolak approval"
    : mode === "regional-review"
      ? "Setujui review regional"
      : "Setuju";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            {itemTitle
              ? `Konten "${itemTitle}" akan diproses sesuai keputusan Anda.`
              : "Konten akan diproses sesuai keputusan Anda."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="decision-note">{isReject ? "Catatan Revisi" : "Catatan (opsional)"}</Label>
          <Textarea
            id="decision-note"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              if (error) {
                setError("");
              }
            }}
            placeholder={
              isReject
                ? "Jelaskan perubahan yang harus dilakukan konten kreator"
                : "Opsional: tambahkan konteks singkat untuk jejak review"
            }
            className="min-h-32"
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            type="button"
            variant={isReject ? "destructive" : "default"}
            onClick={async () => {
              if (isReject && !note.trim()) {
                setError("Catatan revisi wajib diisi untuk penolakan.");
                return;
              }

              await onSubmit({
                action,
                note: note.trim(),
              });
            }}
            disabled={isSubmitting}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
