"use server";

import { db } from "@/db";
import { eq, desc, count } from "drizzle-orm";
import { notifications } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function getNotificationsAction() {
  return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(5);
}

export async function getUnreadCountAction() {
  const result = await db.select({ count: count() }).from(notifications).where(eq(notifications.read, false));
  return result[0]?.count ?? 0;
}

export async function markAsReadAction(id: string) {
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  revalidatePath("/adm");
}

export async function markAllAsReadAction() {
  await db.update(notifications).set({ read: true }).where(eq(notifications.read, false));
  revalidatePath("/adm");
}

export async function dismissNotificationAction(id: string) {
  await db.delete(notifications).where(eq(notifications.id, id));
  revalidatePath("/adm");
}

export async function emitNotification(
  type: "info" | "warning" | "deadline" | "insight" | "suggestion" | "system",
  title: string,
  message: string,
  priority: "low" | "medium" | "high" = "medium"
) {
  await db.insert(notifications).values({
    type,
    title,
    message,
    priority,
    read: false,
  });

  revalidatePath("/adm/notifications");
}