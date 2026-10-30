import { useState } from "react";
import { Ellipsis, Eye, Pause, Pencil, Play, RefreshCw, UserCheck, UserX, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function MenuItem({ icon: Icon, children, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-sm px-3 text-sm font-semibold transition-colors hover:bg-muted focus-visible:bg-muted",
        danger && "text-destructive",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </button>
  );
}

export function MemberRowMenu({ member, onView, onRenew, onEdit, onDeactivate, onActivate, onSuspend, onLift }) {
  const [open, setOpen] = useState(false);
  const run = (action) => () => {
    setOpen(false);
    action(member);
  };

  const collecting = member.paymentStatus === "pending";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`}>
          <Ellipsis aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 gap-0.5 p-1.5">
        <MenuItem icon={Eye} onClick={run(onView)}>
          View details
        </MenuItem>

        {member.accessStatus !== "inactive" && (
          <MenuItem icon={collecting ? Wallet : RefreshCw} onClick={run(onRenew)}>
            {collecting ? "Collect payment" : "Renew membership"}
          </MenuItem>
        )}

        <MenuItem icon={Pencil} onClick={run(onEdit)}>
          Edit details
        </MenuItem>

        {member.accessStatus === "suspended" && (
          <MenuItem icon={Play} onClick={run(onLift)}>
            Lift suspension
          </MenuItem>
        )}
        {member.accessStatus === "active" && (
          <MenuItem icon={Pause} onClick={run(onSuspend)}>
            Suspend access
          </MenuItem>
        )}

        {member.accessStatus === "inactive" ? (
          <MenuItem icon={UserCheck} onClick={run(onActivate)}>
            Reactivate member
          </MenuItem>
        ) : (
          <MenuItem icon={UserX} onClick={run(onDeactivate)} danger>
            Deactivate member
          </MenuItem>
        )}
      </PopoverContent>
    </Popover>
  );
}