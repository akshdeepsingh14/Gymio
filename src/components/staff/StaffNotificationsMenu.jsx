import { useState } from "react";
import { Link } from "react-router";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useReadNotifications } from "@/hooks/useReadNotifications";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useStaffGym } from "@/hooks/useStaffGym";
import { useStaffPrefs } from "@/hooks/useStaffPrefs";
import { todayISO } from "@/lib/dates";
import { getGymSettings } from "@/lib/gymSettings";
import { buildStaffNotifications } from "@/lib/staffNotifications";
import { cn } from "@/lib/utils";

function Item({ item, unread, onOpen }) {
  return (
    <li>
      <Link
        to={item.to}
        onClick={() => onOpen(item)}
        className="flex gap-3 border-b border-border p-3 transition-colors last:border-b-0 hover:bg-muted/50"
      >
        <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", unread ? "bg-destructive" : "bg-border")} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="text-sm text-muted-foreground">{item.text}</p>
          <p className="label-mono mt-1 text-muted-foreground">{item.time}</p>
        </div>
      </Link>
    </li>
  );
}

export function StaffNotificationsMenu() {
  const { user } = useStaffAuth();
  const { db, gym } = useStaffGym();
  const prefs = useStaffPrefs(user.id);
  const [open, setOpen] = useState(false);
  const { readIds, markRead } = useReadNotifications(user.id);

  const items = buildStaffNotifications({
    db,
    settings: getGymSettings(gym),
    today: todayISO(),
    currency: gym?.currency ?? "INR",
    permissions: user.permissions,
    prefs,
  });

  const unread = items.filter((item) => !readIds.has(item.id)).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative"
        >
          <Bell aria-hidden="true" />
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
          <Button variant="ghost" size="xs" onClick={() => markRead(items.map((item) => item.id))} disabled={unread === 0}>
            <CheckCheck aria-hidden="true" />
            Mark all read
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <Bell className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold">You&apos;re all caught up</p>
            <p className="text-sm text-muted-foreground">
              Requests, expiring memberships and payments you can act on will show up here. You can change what you
              see in Settings.
            </p>
          </div>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {items.map((item) => (
              <Item
                key={item.id}
                item={item}
                unread={!readIds.has(item.id)}
                onOpen={(clicked) => {
                  markRead([clicked.id]);
                  setOpen(false);
                }}
              />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}