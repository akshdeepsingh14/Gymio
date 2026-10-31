import { useState } from "react";
import { Link } from "react-router";
import { LogOut, Settings, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Hex } from "@/components/ui/hex";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { getInitials } from "@/lib/profile";

const itemClass =
  "flex h-10 w-full items-center gap-3 rounded-sm px-3 text-sm font-semibold transition-colors hover:bg-muted focus-visible:bg-muted";

export function StaffUserMenu() {
  const { user, signOut } = useStaffAuth();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Hex className="size-10 overflow-hidden">
            {user.photo ? (
              <img src={user.photo} alt="" className="size-full object-cover" />
            ) : (
              <span className="font-mono text-xs font-bold">{getInitials(user.name)}</span>
            )}
          </Hex>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 gap-1 p-2">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{user.roleLabel}</Badge>
            <span className="truncate text-xs text-muted-foreground">{user.gymName}</span>
          </div>
        </div>
        <div className="my-1 h-px bg-border" />
        <Link to="/staff/settings" onClick={() => setOpen(false)} className={itemClass}>
          <Settings className="size-4" aria-hidden="true" />
          Settings
        </Link>
        <Link to="/staff/my-access" onClick={() => setOpen(false)} className={itemClass}>
          <ShieldCheck className="size-4" aria-hidden="true" />
          My access
        </Link>
        <div className="my-1 h-px bg-border" />
        <button type="button" onClick={signOut} className={itemClass}>
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}