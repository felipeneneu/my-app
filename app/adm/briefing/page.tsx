import { getAllBriefings } from "@/lib/actions/briefing";
import { BriefingListClient } from "./client";

export default async function BriefingListPage() {
  const briefings = await getAllBriefings();
  return <BriefingListClient briefings={briefings} />;
}
