import { getChecklistTemplates } from "@/lib/actions/checklists";
import { ChecklistTemplatesClient } from "./client";

export default async function ChecklistTemplatesPage() {
  const templates = await getChecklistTemplates();
  return <ChecklistTemplatesClient initial={templates} />;
}

