import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetDemoData } from "@/services/demoService";

/** Only shown on the demo account. */
export function ResetDemoCard() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setBusy(true);
    resetDemoData();
    toast.success("Demo data reset.");
    // A full reload, so every screen starts from the fresh sample data
    window.location.assign("/app");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset demo data</CardTitle>
        <CardDescription>
          Put the sample gym back to how it started: members, payments, staff, announcements and the audit log. Demo
          staff passwords go back to the sample password. Your gym profile and settings stay as they are.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <RotateCcw aria-hidden="true" />
          Reset demo data
        </Button>
      </CardContent>

      <ConfirmDialog
        open={open}
        onOpenChange={(next) => !busy && setOpen(next)}
        title="Reset the demo data?"
        description="Everything you added or changed in the sample gym is replaced by the original sample data. This cannot be undone."
        confirmLabel="Reset"
        destructive
        loading={busy}
        onConfirm={reset}
      />
    </Card>
  );
}