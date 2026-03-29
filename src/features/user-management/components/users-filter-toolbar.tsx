"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { UsersFilterState } from "../hooks/use-users";
import type { UserRole, UserStatus } from "../types/user-management.type";

interface UsersFilterToolbarProps {
  filters: UsersFilterState;
  allowedRoles: UserRole[];
  canImport: boolean;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: "all" | UserRole) => void;
  onStatusChange: (value: "all" | UserStatus) => void;
  onReset: () => void;
  onImportClick: () => void;
  onCreateClick: () => void;
}

export function UsersFilterToolbar({
  filters,
  allowedRoles,
  canImport,
  isLoading,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onReset,
  onImportClick,
  onCreateClick,
}: UsersFilterToolbarProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <Input
            placeholder="Cari nama atau email"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
          />

          <Select value={filters.role} onValueChange={(value) => onRoleChange(value as "all" | UserRole)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua role</SelectItem>
              {allowedRoles.includes("superadmin") ? <SelectItem value="superadmin">Superadmin</SelectItem> : null}
              {allowedRoles.includes("sysadmin") ? <SelectItem value="sysadmin">Sysadmin</SelectItem> : null}
              {allowedRoles.includes("qcc_wcc") ? <SelectItem value="qcc_wcc">QCC/WCC</SelectItem> : null}
              {allowedRoles.includes("wcc") ? <SelectItem value="wcc">WCC</SelectItem> : null}
              {allowedRoles.includes("pic_sosmed") ? <SelectItem value="pic_sosmed">PIC Sosmed</SelectItem> : null}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => onStatusChange(value as "all" | UserStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="nonaktif">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onReset} disabled={isLoading}>
            Reset
          </Button>
          {canImport ? (
            <Button variant="outline" onClick={onImportClick}>
              Import CSV
            </Button>
          ) : null}
          <Button onClick={onCreateClick}>Tambah User</Button>
        </div>
      </CardContent>
    </Card>
  );
}
