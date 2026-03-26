import type {
  ContentDurasi,
  ContentJenis,
  ContentJumlahFile,
  ContentPlatform,
  ContentTargetAudiens,
  ContentTipe,
  ContentUrgensi,
} from "../types/content.type";

export interface OptionItem<TValue extends string> {
  value: TValue;
  label: string;
  shortLabel?: string;
  hint?: string;
  accentClassName?: string;
}

export const PLATFORM_OPTIONS: Array<OptionItem<ContentPlatform>> = [
  {
    value: "instagram",
    label: "Instagram",
    shortLabel: "IG",
    accentClassName: "border-pink-200 bg-pink-50 text-pink-700",
  },
  {
    value: "tiktok",
    label: "TikTok",
    shortLabel: "TT",
    accentClassName: "border-slate-200 bg-slate-50 text-slate-700",
  },
  {
    value: "youtube",
    label: "YouTube",
    shortLabel: "YT",
    accentClassName: "border-rose-200 bg-rose-50 text-rose-700",
  },
  {
    value: "facebook",
    label: "Facebook",
    shortLabel: "FB",
    accentClassName: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    value: "x",
    label: "X",
    shortLabel: "X",
    accentClassName: "border-zinc-200 bg-zinc-50 text-zinc-700",
  },
];

export const CONTENT_TYPE_OPTIONS: Array<OptionItem<ContentJenis>> = [
  { value: "foto_poster", label: "Foto Poster" },
  { value: "video_reels", label: "Video Reels" },
  { value: "infografis", label: "Infografis" },
  { value: "carousel", label: "Carousel" },
  { value: "thread_teks", label: "Thread Teks" },
  { value: "live", label: "Live" },
];

export const CONTENT_TOPIC_OPTIONS = [
  "penghijauan",
  "daur_ulang",
  "kebersihan",
  "air_bersih",
  "energi_hijau",
  "kualitas_udara",
  "konservasi",
  "perubahan_iklim",
  "edukasi_lingkungan",
  "pengelolaan_sampah",
] as const;

export const CONTENT_TOPIC_LABELS: Record<(typeof CONTENT_TOPIC_OPTIONS)[number], string> = {
  penghijauan: "Penghijauan",
  daur_ulang: "Daur Ulang",
  kebersihan: "Kebersihan",
  air_bersih: "Air Bersih",
  energi_hijau: "Energi Hijau",
  kualitas_udara: "Kualitas Udara",
  konservasi: "Konservasi",
  perubahan_iklim: "Perubahan Iklim",
  edukasi_lingkungan: "Edukasi Lingkungan",
  pengelolaan_sampah: "Pengelolaan Sampah",
};

export const FILE_COUNT_OPTIONS: Array<OptionItem<ContentJumlahFile>> = [
  { value: "1", label: "1 file" },
  { value: "2-3", label: "2-3 file" },
  { value: "4-5", label: "4-5 file" },
  { value: "folder", label: "Folder" },
];

export const DURATION_OPTIONS: Array<OptionItem<ContentDurasi>> = [
  { value: "kurang_30_detik", label: "Kurang dari 30 detik" },
  { value: "30_60_detik", label: "30-60 detik" },
  { value: "1_3_menit", label: "1-3 menit" },
  { value: "3_10_menit", label: "3-10 menit" },
  { value: "lebih_10_menit", label: "Lebih dari 10 menit" },
];

export const TARGET_AUDIENCE_OPTIONS: Array<OptionItem<ContentTargetAudiens>> = [
  { value: "masyarakat_umum", label: "Masyarakat Umum" },
  { value: "pelajar", label: "Pelajar" },
  { value: "ibu_rumah_tangga", label: "Ibu Rumah Tangga" },
  { value: "pelaku_usaha", label: "Pelaku Usaha" },
  { value: "komunitas", label: "Komunitas" },
];

export const URGENCY_OPTIONS: Array<OptionItem<ContentUrgensi>> = [
  {
    value: "normal",
    label: "Normal",
    hint: "Masuk antrian reguler",
    accentClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    value: "prioritas",
    label: "Prioritas",
    hint: "Butuh perhatian lebih cepat",
    accentClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    value: "urgent",
    label: "Urgent",
    hint: "Mendesak dan sensitif waktu",
    accentClassName: "border-rose-200 bg-rose-50 text-rose-700",
  },
];

export const CONTENT_ENTRY_TYPE_OPTIONS: Array<OptionItem<ContentTipe>> = [
  { value: "baru", label: "Konten Baru" },
  { value: "revisi_repost", label: "Revisi / Repost" },
];

export const ACCESS_STATUS_OPTIONS = [
  { value: "publik", label: "Publik" },
  { value: "terbatas", label: "Terbatas" },
] as const;

export type BankContentAccessStatus = (typeof ACCESS_STATUS_OPTIONS)[number]["value"];

export const REVIEW_STEP_LABELS = {
  wcc: "WCC",
  superadmin: "Superadmin",
} as const;
