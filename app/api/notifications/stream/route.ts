import { generateAndStoreNotifications } from "@/lib/engine/notifications";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let running = true;

      const sendEvent = (data: object) => {
        if (!running) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const checkAndSend = async () => {
        if (!running) return;
        try {
          await generateAndStoreNotifications();
          const { getUnreadCount, getRecentNotifications } = await import("@/lib/engine/notifications");
          const unread = await getUnreadCount();
          const recent = await getRecentNotifications(5);
          sendEvent({ type: "notifications", unread, notifications: recent });
        } catch {
          // silent
        }
      };

      const { getNextBlock } = require("@/lib/engine/scheduler");
      const sendBlockUpdate = () => {
        const next = getNextBlock();
        if (next) {
          sendEvent({ type: "block_update", nextBlock: next.label, hoursUntil: next.hoursUntil, minutesUntil: next.minutesUntil });
        }
      };

      checkAndSend();
      sendBlockUpdate();

      const checkInterval = setInterval(checkAndSend, 45000);
      const blockInterval = setInterval(sendBlockUpdate, 30000);

      req.signal.addEventListener("abort", () => {
        running = false;
        clearInterval(checkInterval);
        clearInterval(blockInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}