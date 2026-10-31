import { useState } from "react";
import { Ellipsis, Eye } from "lucide-react";

import { STAFF_ACTION_META } from "@/components/settings/staffActions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { availableActions } from "@/lib/staff";
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

/**
 * `onView(member)` opens the details. `onAction(actionId, member)` handles everything else.
 * The actions listed come from availableActions(), so the menu only offers what is allowed.
 */
export function StaffRowMenu({ member, onView, onAction }) {
  const [open, setOpen] = useState(false);
  const actions = availableActions(member);

  const run = (callback) => () => {
    setOpen(false);
    callback();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`}>
          <Ellipsis aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-0.5 p-1.5">
        <MenuItem icon={Eye} onClick={run(() => onView(member))}>
          View details
        </MenuItem>

        {actions.map((id) => {
          const { label, icon, danger } = STAFF_ACTION_META[id];
          return (
            <MenuItem key={id} icon={icon} danger={danger} onClick={run(() => onAction(id, member))}>
              {label}
            </MenuItem>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}