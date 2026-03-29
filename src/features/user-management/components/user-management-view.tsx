"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

import { useCreateUser } from "../hooks/use-create-user";
import { useDeleteUser } from "../hooks/use-delete-user";
import { useUpdateUser } from "../hooks/use-update-user";
import { type UsersFilterState, useUsers } from "../hooks/use-users";
import type { CreateUserFormValues, UpdateUserFormValues } from "../schemas/user.schema";
import type { UserItem } from "../types/user-management.type";
import { UserFormDialog } from "./user-form-dialog";
import { UsersFilterToolbar } from "./users-filter-toolbar";
import { UsersStatsCards } from "./users-stats";
import { UsersTable } from "./users-table";

interface UserManagementContentProps {
  accessToken?: string;
  actorRole: "superadmin" | "sysadmin";
}

function UserManagementContent({ accessToken, actorRole }: UserManagementContentProps) {
  const router = useRouter();
  const { users, stats, meta, isLoading, error, filters, setFilters, refetch } = useUsers(accessToken);
  const { create, isSubmitting: isCreating } = useCreateUser(accessToken);
  const { update, isSubmitting: isUpdating } = useUpdateUser(accessToken);
  const { remove, isSubmitting: isDeleting } = useDeleteUser(accessToken);
  const [isDeactivating, setDeactivating] = useState(false);
  const [isReactivating, setReactivating] = useState(false);

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<UserItem | null>(null);
  const [reactivatingUser, setReactivatingUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

  const totalPages = useMemo(() => {
    if (!meta) {
      return 1;
    }

    return Math.max(1, Math.ceil(meta.total / meta.limit));
  }, [meta]);

  const allowedRoles = useMemo(
    () =>
      actorRole === "superadmin"
        ? (["superadmin", "qcc_wcc", "wcc", "pic_sosmed"] as const)
        : (["superadmin", "sysadmin", "qcc_wcc", "wcc", "pic_sosmed"] as const),
    [actorRole],
  );

  const updateFilters = (updater: (previous: UsersFilterState) => UsersFilterState) => {
    setFilters((previous) => updater(previous));
  };

  const handleCreateUser = async (payload: CreateUserFormValues) => {
    if (!payload.name?.trim() || !payload.email?.trim() || !payload.password) {
      throw new Error("Nama, email, dan password wajib diisi");
    }

    await create({
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone_number: payload.phone_number?.trim() || null,
      role: payload.role,
      wilayah_id: payload.wilayah_id ?? null,
      password: payload.password,
    });

    toast.success("User berhasil dibuat");
    setCreateDialogOpen(false);
    await refetch();
  };

  const handleUpdateUser = async (payload: UpdateUserFormValues) => {
    if (!editingUser) {
      return;
    }

    if (!payload.name?.trim() || !payload.role || !payload.status) {
      throw new Error("Payload update user tidak lengkap");
    }

    await update(editingUser.id, {
      name: payload.name.trim(),
      phone_number: payload.phone_number?.trim() || null,
      role: payload.role,
      wilayah_id: payload.wilayah_id ?? null,
      status: payload.status,
    });

    toast.success("Data user berhasil diperbarui");
    setEditingUser(null);
    await refetch();
  };

  const handleDeactivateUser = async () => {
    if (!deactivatingUser) {
      return;
    }

    setDeactivating(true);

    try {
      await update(deactivatingUser.id, {
        name: deactivatingUser.name,
        phone_number: deactivatingUser.phone_number,
        role: deactivatingUser.role,
        wilayah_id: deactivatingUser.wilayah_id,
        status: "nonaktif",
      });
      toast.success("User berhasil dinonaktifkan");
      setDeactivatingUser(null);
      await refetch();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Gagal menonaktifkan user";
      toast.error(errorMsg);
    } finally {
      setDeactivating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) {
      return;
    }

    await remove(deletingUser.id);
    toast.success("User berhasil dihapus");
    setDeletingUser(null);
    await refetch();
  };

  const handleReactivateUser = async () => {
    if (!reactivatingUser) {
      return;
    }

    setReactivating(true);

    try {
      await update(reactivatingUser.id, {
        name: reactivatingUser.name,
        phone_number: reactivatingUser.phone_number,
        role: reactivatingUser.role,
        wilayah_id: reactivatingUser.wilayah_id,
        status: "aktif",
      });
      toast.success("User berhasil diaktifkan kembali");
      setReactivatingUser(null);
      await refetch();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Gagal mengaktifkan kembali user";
      toast.error(errorMsg);
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className="space-y-4">
      <UsersStatsCards stats={stats} actorRole={actorRole} />

      <UsersFilterToolbar
        filters={filters}
        allowedRoles={[...allowedRoles]}
        canImport={true}
        isLoading={isLoading}
        onSearchChange={(value) =>
          updateFilters((previous) => ({
            ...previous,
            search: value,
            page: 1,
          }))
        }
        onRoleChange={(value) =>
          updateFilters((previous) => ({
            ...previous,
            role: value,
            page: 1,
          }))
        }
        onStatusChange={(value) =>
          updateFilters((previous) => ({
            ...previous,
            status: value,
            page: 1,
          }))
        }
        onReset={() =>
          setFilters(() => ({
            role: "all",
            status: "all",
            search: "",
            page: 1,
            limit: 20,
          }))
        }
        onImportClick={() => router.push("/pengaturan/manajemen-user/import")}
        onCreateClick={() => setCreateDialogOpen(true)}
      />

      {error ? (
        <Card>
          <CardContent className="py-6 text-destructive">{error}</CardContent>
        </Card>
      ) : (
        <UsersTable
          users={users}
          isLoading={isLoading}
          onEdit={(user) => setEditingUser(user)}
          onDeactivate={(user) => setDeactivatingUser(user)}
          onReactivate={(user) => setReactivatingUser(user)}
          onDelete={(user) => setDeletingUser(user)}
          deactivatingUserId={deactivatingUser?.id}
          reactivatingUserId={reactivatingUser?.id}
          deletingUserId={deletingUser?.id}
        />
      )}

      <Card size="sm">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Halaman {filters.page} dari {totalPages} {meta ? `(${meta.total} total user)` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateFilters((previous) => ({
                  ...previous,
                  page: Math.max(1, previous.page - 1),
                }))
              }
              disabled={filters.page <= 1 || isLoading}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateFilters((previous) => ({
                  ...previous,
                  page: previous.page + 1,
                }))
              }
              disabled={filters.page >= totalPages || isLoading}
            >
              Berikutnya
            </Button>
          </div>
        </CardContent>
      </Card>

      <UserFormDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        allowedRoles={[...allowedRoles]}
        isSubmitting={isCreating}
        onSubmit={async (value) => {
          try {
            await handleCreateUser(value as CreateUserFormValues);
          } catch (errorValue) {
            if (errorValue instanceof Error) {
              toast.error(errorValue.message);
              return;
            }

            toast.error("Gagal membuat user");
          }
        }}
      />

      <UserFormDialog
        mode="edit"
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
        }}
        defaultValue={editingUser}
        allowedRoles={[...allowedRoles]}
        isSubmitting={isUpdating}
        onSubmit={async (value) => {
          try {
            await handleUpdateUser(value as UpdateUserFormValues);
          } catch (errorValue) {
            if (errorValue instanceof Error) {
              toast.error(errorValue.message);
              return;
            }

            toast.error("Gagal memperbarui user");
          }
        }}
      />

      <AlertDialog open={Boolean(deactivatingUser)} onOpenChange={(open) => !open && setDeactivatingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan User</AlertDialogTitle>
            <AlertDialogDescription>
              Aksi ini akan mengubah status user menjadi nonaktif. User yang dinonaktifkan tidak akan bisa masuk ke
              dalam sistem, tetapi data mereka akan tetap tersimpan. Apakah Anda yakin ingin menonaktifkan user{" "}
              <strong>{deactivatingUser?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeactivating}
              onClick={async (event) => {
                event.preventDefault();

                try {
                  await handleDeactivateUser();
                } catch (errorValue) {
                  if (errorValue instanceof Error) {
                    toast.error(errorValue.message);
                    return;
                  }

                  toast.error("Gagal menonaktifkan user");
                }
              }}
            >
              {isDeactivating ? (
                <span className="inline-flex items-center">
                  <Spinner className="mr-2" />
                  Memproses...
                </span>
              ) : (
                "Ya, nonaktifkan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(reactivatingUser)} onOpenChange={(open) => !open && setReactivatingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan Kembali User</AlertDialogTitle>
            <AlertDialogDescription>
              Aksi ini akan mengubah status user menjadi aktif kembali. User <strong>{reactivatingUser?.name}</strong>{" "}
              akan bisa masuk lagi ke dalam sistem. Apakah Anda yakin ingin melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReactivating}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isReactivating}
              onClick={async (event) => {
                event.preventDefault();

                try {
                  await handleReactivateUser();
                } catch (errorValue) {
                  if (errorValue instanceof Error) {
                    toast.error(errorValue.message);
                    return;
                  }

                  toast.error("Gagal mengaktifkan kembali user");
                }
              }}
            >
              {isReactivating ? (
                <span className="inline-flex items-center">
                  <Spinner className="mr-2" />
                  Memproses...
                </span>
              ) : (
                "Ya, aktifkan kembali"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User</AlertDialogTitle>
            <AlertDialogDescription>
              User <strong>{deletingUser?.name}</strong> akan dihapus secara soft delete, statusnya dinonaktifkan, dan
              tidak akan tampil lagi di daftar aktif. Apakah Anda yakin ingin melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={async (event) => {
                event.preventDefault();

                try {
                  await handleDeleteUser();
                } catch (errorValue) {
                  if (errorValue instanceof Error) {
                    toast.error(errorValue.message);
                    return;
                  }

                  toast.error("Gagal menghapus user");
                }
              }}
            >
              {isDeleting ? (
                <span className="inline-flex items-center">
                  <Spinner className="mr-2" />
                  Memproses...
                </span>
              ) : (
                "Ya, hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function UserManagementView() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Better Auth stores session data, let's extract token properly
  // Session might have: { session: {...}, user: {...}} or { user: {...}, token?: string }
  const token1 = (session?.session as Record<string, unknown>)?.token;
  const token2 = (session as Record<string, unknown>)?.token;
  const accessToken = (typeof token1 === "string" ? token1 : typeof token2 === "string" ? token2 : undefined) as
    | string
    | undefined;

  const role = ((session?.user as { role?: string } | undefined)?.role ?? "wcc") as
    | "superadmin"
    | "sysadmin"
    | "qcc_wcc"
    | "wcc"
    | "pic_sosmed";

  const isAuthorized = role === "superadmin" || role === "sysadmin";

  useEffect(() => {
    if (!isPending && session && !isAuthorized) {
      router.replace("/unauthorized");
    }
  }, [isAuthorized, isPending, router, session]);

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

  if (!session || !isAuthorized) {
    return null;
  }

  return <UserManagementContent accessToken={accessToken} actorRole={role} />;
}
