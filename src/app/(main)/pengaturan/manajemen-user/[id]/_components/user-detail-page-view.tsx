import { UserDetailView } from "@/features/user-management/components/user-detail-view";

export function UserDetailPageView({ id }: { id: string }) {
  return <UserDetailView id={id} />;
}
