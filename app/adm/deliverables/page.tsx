import { getDeliverables } from "@/lib/actions/deliverables";
import { DeliverablesClient } from "./client";

export default async function DeliverablesPage() {
  const result = await getDeliverables();
  const items = result.success ? result.data : [];
  return <DeliverablesClient initialItems={items} />;
}
