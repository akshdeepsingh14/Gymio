import { useState } from "react";
import { Link } from "react-router";
import { Building2, LogOut, Settings } from "lucide-react";

import { Hex } from "@/components/ui/hex";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/profile";

const itemClass =
  "flex h-10 w-full items-center gap-3 rounded-sm px-3 text-sm font-semibold transition-colors hover:bg-muted focus-visible:bg-muted";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const displayName = user.ownerName || user.gymName;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Hex className="size-10 overflow-hidden">
            {user.ownerPhoto ? (
              <img src={user.ownerPhoto} alt="" className="size-full object-cover" />
            ) : (
              <span className="font-mono text-xs font-bold">{getInitials(displayName)}</span>
            )}
          </Hex>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 gap-1 p-2">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <div className="my-1 h-px bg-border" />
        <Link to="/app/profile" onClick={() => setOpen(false)} className={itemClass}>
          <Building2 className="size-4" aria-hidden="true" />
          Gym profile
        </Link>
        <Link to="/app/settings" onClick={() => setOpen(false)} className={itemClass}>
          <Settings className="size-4" aria-hidden="true" />
          Settings
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