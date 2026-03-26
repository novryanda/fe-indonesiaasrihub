import { SocialAccountMonitoringDetailView } from "@/features/monitoring-sosmed/components/social-account-monitoring-detail-view";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SocialAccountMonitoringDetailView id={id} />;
}
