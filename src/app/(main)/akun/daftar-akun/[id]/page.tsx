import { SocialAccountDetailPageView } from "./_components/social-account-detail-page-view";

export default async function SocialAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <SocialAccountDetailPageView id={id} />;
}
