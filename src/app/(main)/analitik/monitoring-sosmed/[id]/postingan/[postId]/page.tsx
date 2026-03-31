import { SocialAccountPostDetailView } from "@/features/monitoring-sosmed/components/social-account-post-detail-view";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = await params;

  return <SocialAccountPostDetailView accountId={id} postId={postId} />;
}
