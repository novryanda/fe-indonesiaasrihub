"use client";

import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ContentItem } from "@/features/content-shared/types/content.type";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getContentSubmissionDetail } from "../api/get-content-submission-detail";
import { ContentSubmissionWizard } from "./content-submission-wizard";

export function ContentSubmissionView() {
  const { accessToken, isAuthorized, isPending } = useRoleGuard(["wcc"]);
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "resubmit" ? "resubmit" : "create";
  const contentId = searchParams.get("contentId")?.trim() ?? "";
  const isResubmitMode = mode === "resubmit";
  const [initialContent, setInitialContent] = useState<ContentItem | null>(null);
  const [isLoadingInitialContent, setLoadingInitialContent] = useState(isResubmitMode);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isResubmitMode) {
      setInitialContent(null);
      setLoadingInitialContent(false);
      setLoadError(null);
      return;
    }

    if (!contentId) {
      setInitialContent(null);
      setLoadingInitialContent(false);
      setLoadError("Konten resubmit tidak ditemukan.");
      return;
    }

    let active = true;

    const loadInitialContent = async () => {
      setLoadingInitialContent(true);
      setLoadError(null);

      try {
        const response = await getContentSubmissionDetail(contentId, accessToken);
        if (!active) {
          return;
        }

        setInitialContent(response.data);
      } catch (errorValue) {
        if (!active) {
          return;
        }

        setLoadError(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail konten.");
        setInitialContent(null);
      } finally {
        if (active) {
          setLoadingInitialContent(false);
        }
      }
    };

    void loadInitialContent();

    return () => {
      active = false;
    };
  }, [accessToken, contentId, isResubmitMode]);

  if (isPending || isLoadingInitialContent) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Spinner />
          <span>{isPending ? "Memuat session konten kreator..." : "Memuat detail submission..."}</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-medium text-destructive">{loadError}</p>
          <p className="mt-2 text-muted-foreground text-sm">
            Buka ulang dari halaman Konten Saya untuk melanjutkan resubmit lewat wizard.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ContentSubmissionWizard
      accessToken={accessToken}
      mode={mode}
      contentId={contentId || undefined}
      initialContent={initialContent}
    />
  );
}
