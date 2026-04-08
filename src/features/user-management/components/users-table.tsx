"use client";

import { Spinner as HeroSpinner } from "@heroui/react";
import { UserCheck, UserX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { UserItem } from "../types/user-management.type";

interface UsersTableProps {
  users: UserItem[];
  isLoading: boolean;
  loadingLabel?: string;
  onView: (user: UserItem) => void;
  onEdit: (user: UserItem) => void;
  onDeactivate: (user: UserItem) => void;
  onReactivate: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
  deactivatingUserId?: string;
  reactivatingUserId?: string;
  deletingUserId?: string;
}

function toRoleLabel(role: UserItem["role"]) {
  switch (role) {
    case "superadmin":
      return "Superadmin";
    case "supervisi":
      return "Supervisi";
    case "sysadmin":
      return "Sysadmin";
    case "qcc_wcc":
      return "QCC/WCC";
    case "wcc":
      return "WCC";
    case "pic_sosmed":
      return "PIC Sosmed";
    case "blast":
      return "Blast";
    default:
      return role;
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID");
}

export function UsersTable({
  users,
  isLoading,
  loadingLabel = "Memuat data user...",
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
  onDelete,
  deactivatingUserId,
  reactivatingUserId,
  deletingUserId,
}: UsersTableProps) {
  return (
    <Card>
      <CardContent>
        <div className="relative">
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
              <div className="flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <HeroSpinner size="lg" />
                <span>{loadingLabel}</span>
              </div>
            </div>
          ) : null}

          <Table className={isLoading ? "opacity-60" : undefined}>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nomor HP</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Wilayah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terakhir Aktif</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center text-muted-foreground">
                    {!isLoading ? "Data user belum tersedia" : null}
                  </TableCell>
                </TableRow>
              ) : null}

              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.username ?? "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone_number ?? "-"}</TableCell>
                  <TableCell>{toRoleLabel(user.role)}</TableCell>
                  <TableCell>{user.regional ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "aktif" ? "secondary" : "outline"}>
                      {user.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.last_active)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onView(user)}>
                        Detail
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDeactivate(user)}
                        disabled={user.status === "nonaktif" || deactivatingUserId === user.id}
                        title="Nonaktifkan"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onReactivate(user)}
                        disabled={user.status === "aktif" || reactivatingUserId === user.id}
                        title="Aktifkan"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(user)}
                        disabled={deletingUserId === user.id}
                      >
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
