/**
 * Notification store.
 *
 * A single FIFO queue drives one toast at a time; everything is also archived
 * so the player can re-read it in the Notification Center. Duplicate event ids
 * are refused, and the archive is capped at 50 entries (read ones drop first).
 */

import { LIMITS, type AppNotification, type NotificationKind } from "./phase3Types";

export interface NotificationInput {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  target?: AppNotification["target"];
}

export const TOAST_DURATION_MS = 5000;

export function trimNotifications(items: AppNotification[]): AppNotification[] {
  if (items.length <= LIMITS.notifications) return items;
  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
  const unread = sorted.filter((n) => !n.read);
  const read = sorted.filter((n) => n.read);
  const keptRead = read.slice(0, Math.max(0, LIMITS.notifications - unread.length));
  return [...unread, ...keptRead]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, LIMITS.notifications);
}

export interface PushResult {
  notifications: AppNotification[];
  processedIds: string[];
  /** the entries that were actually new */
  added: AppNotification[];
}

/** Adds notifications, skipping any event id already processed. */
export function pushNotifications(
  notifications: AppNotification[],
  processedIds: string[],
  inputs: NotificationInput[],
  now = Date.now(),
): PushResult {
  const seen = new Set(processedIds);
  const added: AppNotification[] = [];
  for (const input of inputs) {
    if (!input.id || seen.has(input.id)) continue;
    seen.add(input.id);
    added.push({
      id: input.id,
      kind: input.kind,
      title: input.title,
      body: input.body,
      createdAt: now,
      read: false,
      target: input.target,
    });
  }
  if (added.length === 0) {
    return { notifications, processedIds, added };
  }
  return {
    notifications: trimNotifications([...added, ...notifications]),
    processedIds: Array.from(seen).slice(-(LIMITS.notifications * 4)),
    added,
  };
}

export function unreadCount(items: AppNotification[]): number {
  return items.filter((n) => !n.read).length;
}

export function markAllRead(items: AppNotification[]): AppNotification[] {
  if (items.every((n) => n.read)) return items;
  return items.map((n) => (n.read ? n : { ...n, read: true }));
}

export function markRead(items: AppNotification[], id: string): AppNotification[] {
  return items.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n));
}

export const NOTIFICATION_LABEL: Record<NotificationKind, string> = {
  achievement: "Achievement",
  board: "Board",
  title: "Title",
  badge: "Badge",
  level: "Level up",
  mission: "Daily mission",
  weekly: "Weekly challenge",
  streak: "Play streak",
  login: "Login reward",
};
