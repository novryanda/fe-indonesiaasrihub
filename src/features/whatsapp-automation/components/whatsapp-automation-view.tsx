"use client";

import { useEffect, useState } from "react";

import { BellRing, MessageSquareText, PencilLine } from "lucide-react";
import { toast } from "sonner";

import type { UserRole } from "@/app/(auth)/auth/types/auth.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { listWhatsappAutomations, updateWhatsappAutomation } from "../api/whatsapp-automation-api";
import type { WhatsappAutomationItem } from "../types/whatsapp-automation.type";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "superadmin", label: "Superadmin" },
  { value: "supervisi", label: "Supervisi" },
  { value: "sysadmin", label: "Sysadmin" },
  { value: "qcc_wcc", label: "QCC/WCC" },
  { value: "wcc", label: "WCC" },
  { value: "pic_sosmed", label: "PIC Sosmed" },
  { value: "blast", label: "Blast" },
];

function getScheduleCopy(item: WhatsappAutomationItem) {
  if (item.executionMode === "immediate") {
    return "Realtime";
  }

  return item.runAt ? `Harian ${item.runAt}` : "Harian";
}

export function WhatsappAutomationView() {
  const { isAuthorized, isPending } = useRoleGuard(["sysadmin"]);
  const [items, setItems] = useState<WhatsappAutomationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<WhatsappAutomationItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<{
    executionMode: WhatsappAutomationItem["executionMode"];
    targetRoles: UserRole[];
    templateBody: string;
    runAt: string | null;
    isActive: boolean;
  }>({
    executionMode: "immediate",
    targetRoles: [],
    templateBody: "",
    runAt: null,
    isActive: true,
  });

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const response = await listWhatsappAutomations();
      setItems(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat konfigurasi WhatsApp automation");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadItems();
    }
  }, [isAuthorized, isPending]);

  const openDialog = (item: WhatsappAutomationItem) => {
    setEditingItem(item);
    setForm({
      executionMode: item.executionMode,
      targetRoles: item.targetRoles,
      templateBody: item.templateBody,
      runAt: item.runAt,
      isActive: item.isActive,
    });
  };

  const closeDialog = () => {
    setEditingItem(null);
    setForm({
      executionMode: "immediate",
      targetRoles: [],
      templateBody: "",
      runAt: null,
      isActive: true,
    });
  };

  const toggleRole = (role: UserRole, checked: boolean) => {
    setForm((previous) => ({
      ...previous,
      targetRoles: checked
        ? Array.from(new Set([...previous.targetRoles, role]))
        : previous.targetRoles.filter((item) => item !== role),
    }));
  };

  const handleSubmit = async () => {
    if (!editingItem) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateWhatsappAutomation(editingItem.key, form);
      setItems((previous) => previous.map((item) => (item.key === response.data.key ? response.data : item)));
      toast.success(response.message ?? "Konfigurasi automation berhasil diperbarui.");
      closeDialog();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menyimpan konfigurasi automation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Spinner />
          <span>Memuat automation...</span>
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
                  className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
                >
                  System / WhatsApp Automation
                </Badge>
                <div className="space-y-2">
                  <h1 className="font-semibold text-3xl tracking-tight">Template & Automation WhatsApp</h1>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rule Automation</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Spinner />
                <span>Memuat rule automation...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Role Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Update</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-muted-foreground text-xs leading-5">{item.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getScheduleCopy(item)}</TableCell>
                      <TableCell>{item.targetRoles.join(", ")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={item.isActive ? "border-emerald-200 text-emerald-700" : ""}>
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openDialog(item)}>
                          <PencilLine className="mr-2 size-4" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
          <DialogHeader className="border-b px-6 py-5 pr-14">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareText className="size-5" />
              {editingItem?.name}
            </DialogTitle>
            <DialogDescription>{editingItem?.description}</DialogDescription>
          </DialogHeader>

          {editingItem ? (
            <div className="max-h-[80vh] overflow-y-auto">
              <div className="grid gap-6 px-6 py-6 xl:grid-cols-3">
                <div className="space-y-5 xl:col-span-2">
                  <div className="rounded-3xl border bg-background shadow-sm">
                    <div className="border-b px-5 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="automation-template-body" className="text-sm font-semibold tracking-tight">
                            Template Pesan
                          </Label>
                          <p className="text-muted-foreground text-xs leading-5">
                            Area utama untuk menyusun isi pesan WhatsApp. Fokus editor ditempatkan di kiri agar lebih
                            nyaman dibaca dan diedit.
                          </p>
                        </div>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          Primary Editor
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-muted-foreground text-xs leading-5">
                        Pesan di sini akan dirender oleh backend Asrihub lalu dikirim langsung ke WAHA. Jadi kualitas
                        copy utama ditentukan dari template ini.
                      </div>
                      <Textarea
                        id="automation-template-body"
                        value={form.templateBody}
                        onChange={(event) => setForm((previous) => ({ ...previous, templateBody: event.target.value }))}
                        rows={18}
                        className="min-h-[420px] resize-y rounded-2xl bg-background px-4 py-3 font-medium leading-7 shadow-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border bg-muted/15 p-5">
                      <div className="flex items-center gap-2">
                        <BellRing className="size-4 text-muted-foreground" />
                        <p className="font-medium text-sm">Placeholder tersedia</p>
                      </div>
                      <p className="mt-2 text-muted-foreground text-xs leading-5">
                        Gunakan placeholder berikut sesuai kebutuhan rule. Nilai akan dirender oleh backend sebelum
                        pesan dikirim.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {editingItem.supportedVariables.map((item) => (
                          <Badge key={item} variant="outline" className="rounded-full px-3 py-1">
                            {`{{${item}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border bg-emerald-50/60 p-5 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100">
                      <p className="font-medium text-sm">Catatan Link</p>
                      <p className="mt-2 text-sm leading-6 opacity-90">
                        CTA WhatsApp dibentuk dari konfigurasi aplikasi. Pastikan
                        <span className="mx-1 rounded bg-black/5 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">
                          APP_PUBLIC_URL
                        </span>
                        mengarah ke frontend agar link tidak salah tujuan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 xl:col-span-1">
                  <div className="rounded-3xl border bg-muted/15 p-5">
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Status Rule</p>
                      <p className="text-muted-foreground text-xs leading-5">
                        Nyalakan atau matikan automation tanpa menghapus template yang sudah disusun.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-2xl border bg-background px-4 py-4">
                      <div>
                        <p className="font-medium text-sm">Aktifkan automation</p>
                        <p className="mt-1 text-muted-foreground text-xs leading-5">
                          Rule nonaktif tidak akan membuat reminder maupun pengiriman pesan WhatsApp.
                        </p>
                      </div>
                      <Switch
                        checked={form.isActive}
                        onCheckedChange={(checked) => setForm((previous) => ({ ...previous, isActive: checked }))}
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border bg-muted/15 p-5">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">Eksekusi</p>
                      <p className="text-muted-foreground text-xs leading-5">
                        Atur kapan rule berjalan atau biarkan realtime sesuai jenis automation.
                      </p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {editingItem.supportedExecutionModes.includes("immediate") ? (
                        <button
                          type="button"
                          onClick={() => setForm((previous) => ({ ...previous, executionMode: "immediate", runAt: null }))}
                          className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                            form.executionMode === "immediate"
                              ? "border-emerald-300 bg-emerald-50/80 shadow-sm"
                              : "bg-background hover:bg-muted/40"
                          }`}
                        >
                          <p className="font-medium text-sm">Eksekusi realtime</p>
                          <p className="mt-1 text-muted-foreground text-xs leading-5">
                            Rule akan dievaluasi terus oleh backend dan langsung dikirim saat item matching terdeteksi,
                            tanpa menunggu jam harian.
                          </p>
                        </button>
                      ) : null}

                      {editingItem.supportedExecutionModes.includes("daily") ? (
                        <button
                          type="button"
                          onClick={() =>
                            setForm((previous) => ({
                              ...previous,
                              executionMode: "daily",
                              runAt: previous.runAt ?? "08:30",
                            }))
                          }
                          className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                            form.executionMode === "daily"
                              ? "border-orange-300 bg-orange-50/80 shadow-sm"
                              : "bg-background hover:bg-muted/40"
                          }`}
                        >
                          <p className="font-medium text-sm">Eksekusi scheduler</p>
                          <p className="mt-1 text-muted-foreground text-xs leading-5">
                            Rule dikumpulkan oleh backend lalu dijalankan pada jam harian yang Anda tentukan.
                          </p>
                        </button>
                      ) : null}

                      {form.executionMode === "daily" ? (
                        <div className="grid gap-3 rounded-2xl border bg-background px-4 py-4">
                          <Label htmlFor="automation-run-at">Jam Eksekusi</Label>
                          <Input
                            id="automation-run-at"
                            type="time"
                            value={form.runAt ?? ""}
                            onChange={(event) => setForm((previous) => ({ ...previous, runAt: event.target.value }))}
                            className="rounded-2xl"
                          />
                          <p className="text-muted-foreground text-xs leading-5">
                            Scheduler backend akan mengecek rule ini tiap menit dengan timezone Asia/Jakarta.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-3xl border bg-muted/15 p-5">
                    <div className="mb-3 space-y-1">
                      <Label>Role Target</Label>
                      <p className="text-muted-foreground text-xs leading-5">
                        Pilih role yang boleh menerima rule ini. Pengguna tanpa nomor HP akan otomatis dilewati.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {ROLE_OPTIONS.map((role) => (
                        <label
                          key={role.value}
                          className="flex items-center gap-3 rounded-2xl border bg-background px-4 py-3 transition-colors hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={form.targetRoles.includes(role.value)}
                            onCheckedChange={(checked) => toggleRole(role.value, checked === true)}
                          />
                          <span className="text-sm">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={closeDialog}>
              Batal
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
