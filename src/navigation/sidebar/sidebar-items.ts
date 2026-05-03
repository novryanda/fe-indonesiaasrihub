import {
  BookOpen,
  ChartColumnIncreasingIcon,
  CheckCircle,
  Clock3,
  FolderOpen,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  MonitorPlay,
  MonitorPlayIcon,
  Play,
  QrCode,
  Radio,
  Repeat,
  Scroll,
  ScrollText,
  Settings2,
  SquareCheck,
  SquarePlus,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

import type { UserRole } from "@/app/(auth)/auth/types/auth.types";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  roles?: UserRole[];
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  roles?: UserRole[];
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
  roles?: UserRole[];
}

const CONTENT_CREATOR_ROLES: UserRole[] = ["wcc"];
const FIELD_TEAM_ROLES: UserRole[] = ["wcc", "pic_sosmed"];

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Utama",
    items: [
      {
        title: "Dashboard Nasional",
        url: "/dashboard/nasional",
        icon: LayoutDashboard,
        roles: ["superadmin"],
      },
      {
        title: "Dashboard Regional",
        url: "/dashboard/regional",
        icon: LayoutDashboard,
        roles: ["qcc_wcc"],
      },
      {
        title: "Approval",
        url: "/dashboard/approval",
        icon: CheckCircle,
        roles: ["superadmin", "supervisi"],
      },
      {
        title: "Konten Saya",
        url: "/dashboard/konten-saya",
        icon: SquareCheck,
        roles: ["wcc"],
      },
      {
        title: "Postingan Saya",
        url: "/dashboard/postingan-saya",
        icon: MonitorPlayIcon,
        roles: ["pic_sosmed"],
      },
      {
        title: "Analitik Tugas Saya",
        url: "/dashboard/laporan-monitoring-tugas",
        icon: ChartColumnIncreasingIcon,
        roles: ["pic_sosmed"],
      },
      {
        title: "Aktivitas Blast",
        url: "/blast/aktivitas",
        icon: Radio,
        roles: ["blast"],
      },
      {
        title: "Log Blast",
        url: "/blast/log",
        icon: ScrollText,
        roles: ["blast"],
      },
      {
        title: "Ranking Blast",
        url: "/blast/ranking",
        icon: Trophy,
        roles: ["blast"],
      },
      {
        title: "Blast Ulang",
        url: "/blast/ulang",
        icon: Repeat,
        roles: ["blast"],
      },
      {
        title: "Input Blast Manual",
        url: "/blast/manual",
        icon: SquarePlus,
        roles: ["blast"],
      },
    ],
  },
  {
    id: 2,
    label: "Konten",
    items: [
      {
        title: "Bank Konten",
        url: "/konten/bank-konten",
        icon: FolderOpen,
        roles: ["superadmin", "supervisi", "qcc_wcc"],
      },
      {
        title: "Bank Materi",
        url: "/konten/bank-materi",
        icon: BookOpen,
        roles: ["superadmin"],
        comingSoon: true,
      },
    ],
  },
  {
    id: 5,
    label: "Tim",
    roles: ["qcc_wcc"],
    items: [
      {
        title: "Monitor PIC Sosmed",
        url: "/tim/pic-sosmed",
        icon: UserRound,
        roles: ["qcc_wcc"],
      },
    ],
  },
  {
    id: 3,
    label: "Analitik",
    items: [
      {
        title: "Monitoring Sosmed",
        url: "/analitik/monitoring-sosmed",
        icon: MonitorPlay,
        roles: ["superadmin", "supervisi", "qcc_wcc"],
      },
      {
        title: "Laporan & Analitik Tugas",
        url: "/analitik/laporan-monitoring-tugas",
        icon: ChartColumnIncreasingIcon,
        roles: ["superadmin", "supervisi"],
      },
      {
        title: "Laporan Regional",
        url: "/analitik/laporan-regional",
        icon: ChartColumnIncreasingIcon,
        roles: ["qcc_wcc"],
      },
      {
        title: "Laporan & Analitik",
        url: "/analitik/laporan-analitik",
        icon: ChartColumnIncreasingIcon,
        roles: ["superadmin"],
      },
      {
        title: "Monitoring Blast",
        url: "/dashboard/blast",
        icon: Radio,
        roles: ["superadmin"],
      },
      {
        title: "Ranking Blast",
        url: "/blast/ranking",
        icon: Trophy,
        roles: ["superadmin"],
      },
    ],
  },
  {
    id: 6,
    label: "Aksi",
    items: [
      {
        title: "Submit Konten Baru",
        url: "/aksi/submit-konten",
        icon: SquarePlus,
        roles: CONTENT_CREATOR_ROLES,
      },
    ],
  },
  {
    id: 7,
    label: "Referensi",
    items: [
      {
        title: "Bank Konten",
        url: "/konten/bank-konten",
        icon: FolderOpen,
        roles: FIELD_TEAM_ROLES,
      },
      {
        title: "Bank Materi",
        url: "/konten/bank-materi",
        icon: BookOpen,
        roles: FIELD_TEAM_ROLES,
        comingSoon: true,
      },
    ],
  },
  {
    id: 8,
    label: "Akun",
    items: [
      {
        title: "PIC Akun Sosmed",
        url: "/akun/akun-sosmed",
        icon: MonitorPlayIcon,
        roles: ["pic_sosmed", "superadmin"],
      },
      {
        title: "Daftar Akun Sosmed",
        url: "/akun/daftar-akun",
        roles: ["superadmin"],
        icon: CheckCircle,
      },
    ],
  },
  {
    id: 4,
    label: "Admin",
    roles: ["superadmin", "sysadmin"],
    items: [
      {
        title: "Manajemen User",
        url: "/pengaturan/manajemen-user",
        icon: Users,
        roles: ["superadmin", "sysadmin"],
      },
    ],
  },
  {
    id: 9,
    label: "System",
    roles: ["sysadmin"],
    items: [
      {
        title: "WhatsApp Automation",
        url: "/system/whatsapp-automation",
        icon: MessageSquare,
        roles: ["sysadmin"],
      },
      {
        title: "WhatsApp Gateway",
        url: "/system/whatsapp-gateway",
        icon: QrCode,
        roles: ["sysadmin"],
      },
      {
        title: "Jadwal Scraping",
        url: "/system/jadwal-scrapping",
        icon: Clock3,
        roles: ["sysadmin"],
      },
      {
        title: "Tarik Scrape Akun",
        url: "/system/tarik-scrapping",
        icon: Play,
        roles: ["sysadmin"],
      },
      {
        title: "Log Scraping",
        url: "/system/log-scrapping",
        icon: ScrollText,
        roles: ["sysadmin"],
      },
      {
        title: "Log Activity",
        url: "/system/log-activity",
        icon: Scroll,
        roles: ["sysadmin"],
      },
      {
        title: "Konfigurasi Sistem",
        url: "/system/konfigurasi",
        icon: Settings2,
        roles: ["sysadmin"],
      },
    ],
  },
  {
    id: 10,
    label: "Laporan",
    items: [
      {
        title: "Log Blast",
        url: "/blast/log",
        icon: ScrollText,
        roles: ["sysadmin"],
      },
      {
        title: "Ranking Blast",
        url: "/blast/ranking",
        icon: Trophy,
        roles: ["sysadmin"],
      },
    ],
  },
];

/** Filter sidebar items based on user role */
export function filterSidebarByRole(groups: NavGroup[], userRole: UserRole): NavGroup[] {
  return groups
    .filter((group) => !group.roles || group.roles.includes(userRole))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0);
}
