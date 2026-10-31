import { MANUAL_ENTRY_TEXT } from "@/lib/payments";
import { cn } from "@/lib/utils";

/** The "recorded manually, not bank-verified" line, shown under any UPI payment. */
export function ManualEntryTag({ method, className }) {
  if (method !== "upi") return null;
  return <p className={cn("text-xs text-muted-foreground", className)}>{MANUAL_ENTRY_TEXT}</p>;
}