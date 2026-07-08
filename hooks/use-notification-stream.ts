"use client";

import { useEffect, useState } from "react";

export type StreamNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority: string;
  createdAt: string;
};

export function useNotificationStream() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<StreamNotification[]>([]);
  const [nextBlock, setNextBlock] = useState<{ label: string; hoursUntil: number; minutesUntil: number } | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onopen = () => setConnected(true);

    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "notifications") {
          setUnreadCount(data.unread);
          setNotifications(data.notifications);
        }

        if (data.type === "block_update") {
          setNextBlock({ label: data.nextBlock, hoursUntil: data.hoursUntil, minutesUntil: data.minutesUntil });
        }
      } catch {
        // ignore parse errors
      }
    });

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return { unreadCount, notifications, nextBlock, connected };
}