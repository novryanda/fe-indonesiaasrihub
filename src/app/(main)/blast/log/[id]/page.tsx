import { BlastLogDetailView } from "@/features/blast-activity/components/blast-log-detail-view";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BlastLogDetailView id={id} />;
}
