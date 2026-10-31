import { useState } from "react";
import { Ban, Ellipsis, History, Pencil, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePermissions } from "@/hooks/usePermissions";
import { isCounted } from "@/lib/payments";
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

export function PaymentRowMenu({ payment, onReceipt, onHistory, onAmend, onVoid }) {
  const [open, setOpen] = useState(false);
  const { can } = usePermissions();
  const canAdjust = can("payments.adjust");

  const run = (action) => () => {
    setOpen(false);
    action(payment);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${payment.receiptNo}`}>
          <Ellipsis aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 gap-0.5 p-1.5">
        <MenuItem icon={ReceiptText} onClick={run(onReceipt)}>
          View receipt
        </MenuItem>
        <MenuItem icon={History} onClick={run(onHistory)}>
          View history
        </MenuItem>
        {canAdjust && isCounted(payment) && (
          <>
            <MenuItem icon={Pencil} onClick={run(onAmend)}>
              Edit reference / note
            </MenuItem>
            <MenuItem icon={Ban} onClick={run(onVoid)} danger>
              Void payment
            </MenuItem>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}