"use server";
import { db } from "@/db";
import { workspaceConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getWorkspaceConfig() {
  const config = await db.select().from(workspaceConfig).limit(1).then((r) => r[0]);
  return config ?? null;
}

export async function updateWorkspaceConfig(data: Partial<{
  workspaceName: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userInitials: string;
  businessAlias: string;
  monthlyGoal: number;
}>) {
  const existing = await db.select().from(workspaceConfig).limit(1);
  if (existing.length > 0) {
    await db.update(workspaceConfig).set(data).where(eq(workspaceConfig.id, existing[0].id));
  } else {
    await db.insert(workspaceConfig).values(data as any);
  }
  revalidatePath("/adm");
}