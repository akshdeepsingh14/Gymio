import { useState } from "react";
import { Ellipsis, Pencil, Play, RotateCcw, Send, Trash2, UserCheck, UserX } from "lucide-react";

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

export function StaffRowMenu({ member, onEdit, onResend, onAccept, onSuspend, onReactivate, onRemove }) {
  const [open, setOpen] = useState(false);
  const run = (action) => () => {
    setOpen(false);
    action(member);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`}>
          <Ellipsis aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-0.5 p-1.5">
        <MenuItem icon={Pencil} onClick={run(onEdit)}>
          Edit details
        </MenuItem>

        {member.status === "invited" && (
          <>
            <MenuItem icon={Send} onClick={run(onResend)}>
              Resend invite
            </MenuItem>
            <MenuItem icon={Play} onClick={run(onAccept)}>
              Simulate accepting (demo)
            </MenuItem>
          </>
        )}
        {member.status === "active" && (
          <MenuItem icon={UserX} onClick={run(onSuspend)}>
            Suspend access
          </MenuItem>
        )}
        {member.status === "suspended" && (
          <MenuItem icon={UserCheck} onClick={run(onReactivate)}>
            Reactivate
          </MenuItem>
        )}

        <MenuItem icon={member.status === "invited" ? RotateCcw : Trash2} onClick={run(onRemove)} danger>
          {member.status === "invited" ? "Cancel invite" : "Remove from team"}
        </MenuItem>
      </PopoverContent>
    </Popover>
  );
}