import { UserDetailPageView } from "./_components/user-detail-page-view";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <UserDetailPageView id={id} />;
}
