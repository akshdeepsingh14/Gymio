import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Bell, BellOff, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { useReadNotifications } from "@/hooks/useReadNotifications";
import { todayISO } from "@/lib/dates";
import { getGymSettings } from "@/lib/gymSettings";
import { buildNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";

function Item({ item, unread, onOpen }) {
  return (
    <li>
      <Link
        to={item.to}
        onClick={() => onOpen(item)}
        className="flex gap-3 border-b border-border p-3 transition-colors last:border-b-0 hover:bg-muted/50"
      >
        <span
          aria-hidden="true"
          className={cn("mt-1.5 size-2 shrink-0 rounded-full", unread ? "bg-destructive" : "bg-border")}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="text-sm text-muted-foreground">{item.text}</p>
          <p className="label-mono mt-1 text-muted-foreground">{item.time}</p>
        </div>
      </Link>
    </li>
  );
}

function EmptyNote({ off }) {
  const Icon = off ? BellOff : Bell;
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-semibold">{off ? "Notifications are off" : "You're all caught up"}</p>
      <p className="text-sm text-muted-foreground">
        {off
          ? "Turn in-app notifications back on in Settings to see them here."
          : "New requests, expiring memberships, payments and posts will show up here."}
      </p>
    </div>
  );
}

export function NotificationsMenu() {
  const { user } = useAuth();
  const db = useDb();
  const [open, setOpen] = useState(false);
  const { readIds, markRead } = useReadNotifications(user.id);

  const settings = useMemo(() => getGymSettings(user.gym), [user.gym]);
  const items = buildNotifications({
    db,
    settings,
    today: todayISO(),
    currency: user.gym?.currency ?? "INR",
  });

  const isUnread = (item) => !readIds.has(item.id);
  const unread = items.filter(isUnread).length;

  const openItem = (item) => {
    markRead([item.id]);
    setOpen(false);
  };

  const label = !settings.notifyInApp
    ? "Notifications, turned off"
    : unread
      ? `Notifications, ${unread} unread`
      : "Notifications";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label={label} className="relative">
          {settings.notifyInApp ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />}
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-destructive font-mono text-[0.6rem] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <p className="label-mono">Notifications</p>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => markRead(items.map((item) => item.id))}
            disabled={unread === 0}
          >
            <CheckCheck aria-hidden="true" />
            Mark all read
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyNote off={!settings.notifyInApp} />
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {items.map((item) => (
              <Item key={item.id} item={item} unread={isUnread(item)} onOpen={openItem} />
            ))}
          </ul>
        )}

        <p className="border-t border-border p-3 text-xs text-muted-foreground">
          <Link
            to="/app/settings/notifications"
            onClick={() => setOpen(false)}
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Notification settings
          </Link>
        </p>
      </PopoverContent>
    </Popover>
  );
}