import { listOS } from "@/lib/actions/os";
import { OSListClient } from "./client";

export default async function OSListPage() {
  const docs = await listOS();
  return <OSListClient docs={docs.map(d => ({ id: d.id, contentJson: d.contentJson }))} />;
}
