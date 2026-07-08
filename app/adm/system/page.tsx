import { getSystemHealth } from "@/lib/actions/system";
import { SystemClient } from "./client";

export default async function SystemPage() {
  const health = await getSystemHealth();
  return <SystemClient health={health} />;
}
