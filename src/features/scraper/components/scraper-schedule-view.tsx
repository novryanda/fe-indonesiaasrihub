"use client";

import { useEffect, useState } from "react";

import { Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORM_OPTIONS } from "@/features/content-shared/constants/content-options";
import { PlatformIcon } from "@/features/content-shared/components/platform-icon";
import { formatDateTime, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import {
  createScraperSchedule,
  deleteScraperSchedule,
  listScraperSchedules,
  runScraperScheduleNow,
  toggleScraperSchedule,
  updateScraperSchedule,
} from "../api/scraper-api";
import type { CreateScraperSchedulePayload, ScraperFrequency, ScraperScheduleItem } from "../types/scraper.type";

type ScheduleFormState = CreateScraperSchedulePayload;

const INITIAL_FORM: ScheduleFormState = {
  platform: "instagram",
  frequency: "harian",
  runAt: "02:00",
  cronExpression: "",
  isActive: true,
};

function getFrequencyLabel(value: ScraperFrequency) {
  switch (value) {
    case "harian":
      return "Harian";
    case "mingguan":
      return "Mingguan";
    case "custom":
      return "Custom";
    default:
      return value;
  }
}

export function ScraperScheduleView() {
  const { isAuthorized, isPending } = useRoleGuard(["sysadmin"]);
  const [items, setItems] = useState<ScraperScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ScraperScheduleItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ScraperScheduleItem | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(INITIAL_FORM);

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const response = await listScraperSchedules();
      setItems(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat jadwal scraping");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadSchedules();
    }
  }, [isAuthorized, isPending]);

  const openCreateDialog = () => {
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: ScraperScheduleItem) => {
    setEditingItem(item);
    setForm({
      platform: item.platform,
      frequency: item.frequency,
      runAt: item.runAt,
      cronExpression: item.frequency === "custom" ? item.cronExpression : "",
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setForm(INITIAL_FORM);
  };

  const handleSubmit = async () => {
    if (!form.runAt) {
      toast.error("Jam eksekusi wajib diisi.");
      return;
    }

    if (form.frequency === "custom" && !form.cronExpression?.trim()) {
      toast.error("Cron expression wajib diisi untuk mode custom.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateScraperSchedule(editingItem.id, {
          platform: form.platform,
          frequency: form.frequency,
          runAt: form.runAt,
          cronExpression: form.frequency === "custom" ? form.cronExpression?.trim() : undefined,
          isActive: form.isActive,
        });
        toast.success("Jadwal scraping berhasil diperbarui.");
      } else {
        await createScraperSchedule({
          platform: form.platform,
          frequency: form.frequency,
          runAt: form.runAt,
          cronExpression: form.frequency === "custom" ? form.cronExpression?.trim() : undefined,
          isActive: form.isActive,
        });
        toast.success("Jadwal scraping berhasil dibuat.");
      }

      closeDialog();
      await loadSchedules();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menyimpan jadwal scraping");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (item: ScraperScheduleItem, checked: boolean) => {
    try {
      await toggleScraperSchedule(item.id, checked);
      setItems((previous) => previous.map((entry) => (entry.id === item.id ? { ...entry, isActive: checked } : entry)));
      await loadSchedules();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mengubah status jadwal");
    }
  };

  const handleRunNow = async (item: ScraperScheduleItem) => {
    setRunningId(item.id);
    try {
      await runScraperScheduleNow(item.id);
      toast.success("Run scraping berhasil dipicu.");
      await loadSchedules();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memicu run scraping");
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteScraperSchedule(deletingItem.id);
      toast.success("Jadwal scraping berhasil dihapus.");
      setDeletingItem(null);
      await loadSchedules();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menghapus jadwal scraping");
    } finally {
      setIsDeleting(false);
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
    <>
      <div className="space-y-6">
        <Card className="app-bg-hero app-border-soft">
          <CardContent className="space-y-4 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="rounded-full border-sky-200 bg-background/75 px-3 py-1 text-sky-700 dark:bg-card/75"
                >
                  System / Scraper
                </Badge>
                <div className="space-y-2">
                  <h1 className="font-semibold text-3xl tracking-tight">Jadwal Scraping</h1>
                  <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                    Sysadmin mengatur kapan scraper Apify dijalankan untuk memperbarui data akun sosial dan statistik
                    posting per platform.
                  </p>
                </div>
              </div>

              <Button type="button" onClick={openCreateDialog}>
                <Plus className="mr-2 size-4" />
                Tambah Jadwal
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Jadwal Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Spinner />
                <span>Memuat jadwal scraping...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Frekuensi</TableHead>
                    <TableHead>Jam Eksekusi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terakhir Dijalankan</TableHead>
                    <TableHead>Jadwal Berikutnya</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Belum ada jadwal scraping yang dikonfigurasi.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <PlatformIcon platform={item.platform} />
                        </TableCell>
                        <TableCell>{getFrequencyLabel(item.frequency)}</TableCell>
                        <TableCell>{item.runAt}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={item.isActive}
                              onCheckedChange={(checked) => void handleToggle(item, checked)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {item.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{item.lastRunAt ? formatDateTime(item.lastRunAt) : "-"}</TableCell>
                        <TableCell>{item.nextRunAt ? formatDateTime(item.nextRunAt) : "-"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleRunNow(item)}
                              disabled={runningId === item.id}
                            >
                              {runningId === item.id ? <Spinner className="mr-2" /> : <Play className="mr-2 size-4" />}
                              Jalankan
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setDeletingItem(item)}>
                              <Trash2 className="mr-2 size-4" />
                              Hapus
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Jadwal Scraping" : "Tambah Jadwal Scraping"}</DialogTitle>
            <DialogDescription>
              Atur platform dan frekuensi eksekusi scraper. Untuk mode custom, pastikan cron expression valid.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(value) =>
                  setForm((previous) => ({ ...previous, platform: value as ScheduleFormState["platform"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label>Frekuensi</Label>
              <RadioGroup
                value={form.frequency}
                onValueChange={(value) =>
                  setForm((previous) => ({ ...previous, frequency: value as ScraperFrequency }))
                }
                className="grid gap-3 md:grid-cols-3"
              >
                {(["harian", "mingguan", "custom"] as const).map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3">
                    <RadioGroupItem value={option} />
                    <span className="font-medium text-sm">{getFrequencyLabel(option)}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label>Jam Eksekusi</Label>
              <Input
                type="time"
                value={form.runAt}
                onChange={(event) => setForm((previous) => ({ ...previous, runAt: event.target.value }))}
              />
            </div>

            {form.frequency === "custom" ? (
              <div className="grid gap-2">
                <Label>Cron Expression</Label>
                <Textarea
                  value={form.cronExpression ?? ""}
                  onChange={(event) => setForm((previous) => ({ ...previous, cronExpression: event.target.value }))}
                  placeholder="Contoh: 0 2 * * *"
                />
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
              <div>
                <p className="font-medium text-sm">Aktifkan jadwal</p>
                <p className="text-muted-foreground text-xs">Jadwal nonaktif tidak akan diproses oleh scheduler.</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((previous) => ({ ...previous, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Batal
            </Button>
            <Button type="button" disabled={isSubmitting} onClick={() => void handleSubmit()}>
              {isSubmitting && <Spinner className="mr-2" />}
              Simpan Jadwal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingItem)} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus jadwal scraping?</AlertDialogTitle>
            <AlertDialogDescription>
              Jadwal yang dihapus tidak akan dijalankan lagi. Log run yang sudah terjadi tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {isDeleting && <Spinner className="mr-2" />}
              Hapus Jadwal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
