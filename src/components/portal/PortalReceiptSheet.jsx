import { useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/common/LoadingButton";
import { ReceiptPaper } from "@/components/payments/ReceiptPaper";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/** Receipt preview for a member. The receipt is already built from their own payment. */
export function PortalReceiptSheet({ open, onOpenChange, receipt }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { downloadReceiptPdf } = await import("@/lib/receiptPdf");
      await downloadReceiptPdf(receipt);
      toast.success(`${receipt.receiptNo} downloaded.`);
    } catch {
      toast.error("Could not create the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>Receipt</SheetTitle>
          <SheetDescription>{receipt ? receipt.receiptNo : ""}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-6">
          {receipt && <ReceiptPaper receipt={receipt} />}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border p-4">
          <Button variant="outline" size="lg" onClick={() => window.print()} disabled={!receipt}>
            <Printer aria-hidden="true" />
            Print
          </Button>
          <LoadingButton
            size="lg"
            onClick={handleDownload}
            loading={downloading}
            loadingText="Creating PDF"
            disabled={!receipt}
          >
            <Download aria-hidden="true" />
            Download PDF
          </LoadingButton>
        </div>
      </SheetContent>

      {/* Hidden on screen. When printing, everything else is hidden and only this shows. */}
      {open && receipt && createPortal(
        <div className="receipt-print-root hidden">
          <ReceiptPaper receipt={receipt} />
        </div>,
        document.body,
      )}
    </Sheet>
  );
}