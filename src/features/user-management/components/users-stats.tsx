import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { UsersStats } from "../types/user-management.type";

interface UsersStatsProps {
  stats?: UsersStats;
}

const FALLBACK_STATS: UsersStats = {
  total: 0,
  wcc: 0,
  pic_sosmed: 0,
  qcc_wcc: 0,
  nonaktif: 0,
};

export function UsersStatsCards({ stats = FALLBACK_STATS }: UsersStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Total User</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold text-2xl">{stats.total}</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>WCC</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold text-2xl">{stats.wcc}</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>PIC Sosmed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold text-2xl">{stats.pic_sosmed}</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>QCC/WCC</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold text-2xl">{stats.qcc_wcc}</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>User Nonaktif</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold text-2xl">{stats.nonaktif}</p>
        </CardContent>
      </Card>
    </div>
  );
}
