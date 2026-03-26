import { PicSosmedDetailView } from "@/features/monitor-pic-sosmed/components/pic-sosmed-detail-view";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PicSosmedDetailView id={id} />;
}
