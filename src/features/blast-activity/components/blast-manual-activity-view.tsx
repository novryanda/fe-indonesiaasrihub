"use client";

import { useEffect, useMemo, useState } from "react";

import { Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createBlastActivity } from "@/features/blast-activity/api/create-blast-activity";
import type { ContentPlatform } from "@/features/content-shared/types/content.type";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { listSocialAccounts } from "@/features/social-accounts/api/social-accounts-api";
import type { SocialAccountItem } from "@/features/social-accounts/types/social-account.type";
import { ApiError } from "@/shared/api/api-client";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

export function BlastManualActivityView() {
  const { isAuthorized, isPending } = useRoleGuard(["blast"]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountItem[]>([]);
  const [isSocialAccountsLoading, setSocialAccountsLoading] = useState(true);
  const [socialAccountsError, setSocialAccountsError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    social_account_id: "none",
    platform: "instagram",
    post_url: "",
    proof_drive_link: "",
    caption: "",
    views: "0",
    likes: "0",
    comments: "0",
    shares: "0",
    reposts: "0",
    notes: "",
  });

  const sortedSocialAccounts = useMemo(
    () => [...socialAccounts].sort((left, right) => left.username.localeCompare(right.username, "id")),
    [socialAccounts],
  );
  const selectedSocialAccount = useMemo(
    () => socialAccounts.find((item) => item.id === formState.social_account_id) ?? null,
    [formState.social_account_id, socialAccounts],
  );
  const canSubmit = Boolean(formState.post_url.trim()) && !isSubmitting;

  useEffect(() => {
    const controller = new AbortController();

    const fetchSocialAccounts = async () => {
      setSocialAccountsLoading(true);
      setSocialAccountsError(null);

      try {
        const response = await listSocialAccounts(
          {
            platform: "all",
            verification_status: "verified",
            delegation_status: "all",
            search: "",
            page: 1,
            limit: 100,
          },
          controller.signal,
        );
        setSocialAccounts(response.data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSocialAccountsError(error instanceof Error ? error.message : "Gagal memuat akun sosmed");
        }
      } finally {
        if (!controller.signal.aborted) {
          setSocialAccountsLoading(false);
        }
      }
    };

    void fetchSocialAccounts();

    return () => controller.abort();
  }, []);

  const resetForm = () => {
    setFormState({
      social_account_id: "none",
      platform: "instagram",
      post_url: "",
      proof_drive_link: "",
      caption: "",
      views: "0",
      likes: "0",
      comments: "0",
      shares: "0",
      reposts: "0",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (!formState.post_url.trim()) {
      toast.error("Link blast manual wajib diisi.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await createBlastActivity({
        social_account_id: formState.social_account_id === "none" ? undefined : formState.social_account_id,
        platform: formState.platform as ContentPlatform,
        post_url: formState.post_url.trim(),
        proof_drive_link: formState.proof_drive_link.trim() || undefined,
        caption: formState.caption.trim() || undefined,
        views: Number(formState.views || 0),
        likes: Number(formState.likes || 0),
        comments: Number(formState.comments || 0),
        shares: Number(formState.shares || 0),
        reposts: Number(formState.reposts || 0),
        notes: formState.notes.trim() || undefined,
      });

      toast.success(response.data.message);
      resetForm();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menyimpan aktivitas blast manual");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Spinner />
          <span>Memuat session...</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="app-bg-hero app-border-soft">
        <CardContent className="space-y-4 px-6 py-8 md:px-8">
          <Badge
            variant="outline"
            className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
          >
            Blast / Manual
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Input Blast Manual</h1>
            <p className="max-w-3xl text-muted-foreground text-sm leading-6">
              Simpan aktivitas blast dari link manual tanpa mengambil antrian dari submit PJ.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="manual-activity-social-account" className="font-medium text-sm">
                Akun Sosmed
              </label>
              <Select
                value={formState.social_account_id}
                disabled={isSocialAccountsLoading}
                onValueChange={(value) => {
                  const account = socialAccounts.find((item) => item.id === value);
                  setFormState((previous) => ({
                    ...previous,
                    social_account_id: value,
                    platform: account?.platform ?? previous.platform,
                  }));
                }}
              >
                <SelectTrigger id="manual-activity-social-account">
                  <SelectValue placeholder="Pilih akun sosmed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Akun</SelectItem>
                  {sortedSocialAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.username} • {account.wilayah_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {socialAccountsError ? <p className="text-destructive text-xs">{socialAccountsError}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="manual-activity-platform" className="font-medium text-sm">
                Platform
              </label>
              <Select
                value={formState.platform}
                onValueChange={(value) => setFormState((previous) => ({ ...previous, platform: value }))}
                disabled={Boolean(selectedSocialAccount)}
              >
                <SelectTrigger id="manual-activity-platform">
                  <SelectValue placeholder="Pilih platform" />
                </SelectTrigger>
                <SelectContent>
                  {["instagram", "tiktok", "youtube", "facebook", "x"].map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {formatPlatformLabel(platform as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="manual-activity-post-url" className="font-medium text-sm">
              Link Blast / Referensi
            </label>
            <Input
              id="manual-activity-post-url"
              value={formState.post_url}
              onChange={(event) => setFormState((previous) => ({ ...previous, post_url: event.target.value }))}
              placeholder="https://www.instagram.com/p/..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="manual-activity-proof-drive-link" className="font-medium text-sm">
              Link Bukti Drive
            </label>
            <Input
              id="manual-activity-proof-drive-link"
              type="url"
              value={formState.proof_drive_link}
              onChange={(event) => setFormState((previous) => ({ ...previous, proof_drive_link: event.target.value }))}
              placeholder="Link Google Drive bukti aktivitas blast"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="manual-activity-caption" className="font-medium text-sm">
              Caption
            </label>
            <Textarea
              id="manual-activity-caption"
              value={formState.caption}
              onChange={(event) => setFormState((previous) => ({ ...previous, caption: event.target.value }))}
              rows={4}
              placeholder="Ringkasan caption posting"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["views", "Views"],
              ["likes", "Likes"],
              ["comments", "Comments"],
              ["shares", "Shares"],
              ["reposts", "Reposts"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-2">
                <label htmlFor={`manual-activity-${key}`} className="font-medium text-sm">
                  {label}
                </label>
                <Input
                  id={`manual-activity-${key}`}
                  type="number"
                  min={0}
                  value={formState[key as keyof typeof formState]}
                  onChange={(event) => setFormState((previous) => ({ ...previous, [key]: event.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label htmlFor="manual-activity-notes" className="font-medium text-sm">
              Catatan
            </label>
            <Textarea
              id="manual-activity-notes"
              value={formState.notes}
              onChange={(event) => setFormState((previous) => ({ ...previous, notes: event.target.value }))}
              rows={3}
              placeholder="Catatan tambahan blast"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
              Reset
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              <Send className="mr-2 size-4" />
              {isSubmitting ? "Menyimpan..." : "Simpan Aktivitas Manual"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
