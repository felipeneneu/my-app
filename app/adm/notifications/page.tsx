import { getAllNotifications } from "@/lib/engine/notifications";
import { NotificationsClient } from "./client";

export default async function NotificationsPage() {
  const notifications = await getAllNotifications();
  return <NotificationsClient initialNotifications={notifications} />;
}
