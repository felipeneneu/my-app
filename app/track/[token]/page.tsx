import { getProjectByToken } from "@/lib/actions/tracking";
import { notFound } from "next/navigation";
import { TrackClient } from "./client";

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getProjectByToken(token);
  if (!data) notFound();

  return <TrackClient data={data} />;
}
