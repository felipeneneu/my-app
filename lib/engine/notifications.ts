import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getNotificationsFromEngine } from "./engine";

export async function generateAndStoreNotifications() {
  const { generated } = await getNotificationsFromEngine();

  for (const notif of generated) {
    const existing = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.title, notif.title),
          eq(notifications.read, false),
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(notifications).values({
        type: notif.type,
        title: notif.title,
        message: notif.message,
        priority: notif.priority,
      });
    }
  }
}

export async function getUnreadCount() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(eq(notifications.read, false))
    .then((r) => r[0]?.count ?? 0);
  return result;
}

export async function getRecentNotifications(limit = 5) {
  return db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getAllNotifications() {
  return db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt));
}

export async function markAsRead(id: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, id));
}

export async function markAllAsRead() {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.read, false));
}

export async function dismissNotification(id: string) {
  await db.delete(notifications).where(eq(notifications.id, id));
}