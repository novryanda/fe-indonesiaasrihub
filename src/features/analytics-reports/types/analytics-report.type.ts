export type AnalyticsPlatform = "instagram" | "tiktok" | "youtube" | "facebook" | "x";

export type AnalyticsFilterParams = {
  month: number;
  year: number;
  platform?: AnalyticsPlatform;
  wilayahId?: string;
};

export type AnalyticsCard = {
  key: string;
  label: string;
  value: number;
  subtitle: string;
  trend?: {
    direction: "up" | "down" | "same";
    delta: number;
  };
};

export type KpiSummaryResponse = {
  scope: "nasional" | "regional";
  period: string;
  label: string;
  cards: AnalyticsCard[];
  generatedAt: string;
};

export type RegionalLeaderboardRow = {
  rank: number;
  wilayah_id: string;
  wilayah_nama: string;
  wilayah_kode: string;
  score_timeliness: number;
  score_engagement: number;
  score_final: number;
  trend: {
    direction: "up" | "down" | "same";
    delta: number;
  };
  total_posting: {
    on_time: number;
    total: number;
    label: string;
  };
};

export type SocialAccountLeaderboardRow = {
  rank: number;
  id: string;
  platform: AnalyticsPlatform;
  username: string;
  profileName: string;
  picName: string;
  picId: string;
  wilayahId: string | null;
  wilayahNama: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  engagementRate: number;
  scoreFinal: number;
  scoreTimeliness: number;
  scoreEngagement: number;
  postingCount: number;
};

export type RegionalTrendPoint = {
  period_key: string;
  period_label: string;
  regions: Array<{
    wilayah_id: string;
    wilayah_nama: string;
    score_final: number;
  }>;
};

export type WccLeaderboardRow = {
  rank: number;
  id: string;
  wccId: string;
  wccName: string;
  wilayahId: string | null;
  wilayahNama: string;
  totalContentCreated: number;
  totalContentApproved: number;
  totalContentUsed: number;
  adoptionRate: number;
  totalViews: number;
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReposts: number;
  avgEngagementRate: number;
  scoreFinal: number;
};

export type RegionalDetailResponse = {
  pic_leaderboard: Array<{
    rank: number;
    pic_id: string;
    pic_name: string;
    platforms: AnalyticsPlatform[];
    accounts: Array<{
      id: string;
      platform: AnalyticsPlatform;
      username: string;
      profile_name: string;
    }>;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    reposts: number;
    engagement_rate: number;
    timeliness_rate: number;
    score_final: number;
  }>;
  top_content: Array<{
    id: string;
    title: string;
    wccName: string;
    platform: AnalyticsPlatform;
    picName: string;
    views: number;
    engagementRate: number;
    postedAt: string;
  }>;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: {
    period?: string;
    generatedAt?: string;
  };
  message?: string;
};
