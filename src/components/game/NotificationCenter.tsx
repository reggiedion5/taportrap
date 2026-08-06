import { Bell, Check, Trash2 } from "lucide-react";
import { NOTIFICATION_LABEL } from "@/game/notifications";
import type { AppNotification } from "@/game/phase3Types";
import { Sheet } from "./Sheet";
import { ArcButton, ChromeCard } from "./ArcUI";

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NotificationCenterProps {
  open: boolean;
  notifications: AppNotification[];
  onOpenTarget: (target: AppNotification["target"]) => void;
  onRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
  onClose: () => void;
}

export function NotificationCenter({
  open,
  notifications,
  onOpenTarget,
  onRead,
  onMarkAllRead,
  onClear,
  onClose,
}: NotificationCenterProps) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Sheet open={open} title="Notifications" onClose={onClose}>
      <p className="ui-title text-sm tracking-[0.16em] text-neon-gold glow-gold">
        {unread > 0 ? `${unread} UNREAD` : "ALL CAUGHT UP"}
      </p>
      <p className="ui-body mt-1.5 text-[15px] text-arcade-muted">
        Everything you unlocked recently, kept on this device only.
      </p>

      {notifications.length > 0 && (
        <div className="mt-4 flex gap-2">
          <ArcButton
            tone="steel"
            onClick={onMarkAllRead}
            icon={<Check className="size-4" aria-hidden />}
          >
            Mark all read
          </ArcButton>
          <ArcButton
            tone="steel"
            onClick={onClear}
            icon={<Trash2 className="size-4" aria-hidden />}
          >
            Clear
          </ArcButton>
        </div>
      )}

      {notifications.length === 0 ? (
        <ChromeCard faceClassName="mt-4 p-5 text-center">
          <Bell className="mx-auto size-6 text-arcade-muted" aria-hidden />
          <p className="ui-body mt-2 text-[15px] text-arcade-muted">
            No notifications yet. Play a run to start unlocking.
          </p>
        </ChromeCard>
      ) : (
        <ul className="mt-4 grid gap-3">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className="btn-arc chrome-card w-full text-left"
                onClick={() => {
                  onRead(n.id);
                  if (n.target) onOpenTarget(n.target);
                }}
              >
                <span className="chrome-face block px-4 py-3">
                  <span className="flex items-center justify-between gap-3">
                    <span className="ui-title text-[10px] tracking-[0.22em] text-neon-gold">
                      {NOTIFICATION_LABEL[n.kind].toUpperCase()}
                    </span>
                    <span className="ui-title text-[10px] tracking-[0.14em] text-arcade-muted">
                      {relativeTime(n.createdAt)}
                    </span>
                  </span>
                  <span className="ui-body-tight mt-1.5 flex items-center gap-2 text-[15px] font-bold text-arcade-text">
                    {!n.read && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-logo-green"
                        aria-label="Unread"
                      />
                    )}
                    {n.title}
                  </span>
                  <span className="ui-body mt-1 block text-[14px] text-arcade-muted">{n.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
