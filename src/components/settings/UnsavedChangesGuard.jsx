import { useEffect } from "react";
import { useBlocker } from "react-router";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";

/**
 * Stops edits from being thrown away by accident. While `when` is true:
 *  - moving to another page (a different settings tab, the sidebar, Back) asks first
 *  - closing or reloading the tab shows the browser's own warning
 * Only the pathname counts, so staying on the same page never asks.
 */
export function UnsavedChangesGuard({ when }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!when) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [when]);

  return (
    <ConfirmDialog
      open={blocker.state === "blocked"}
      onOpenChange={(open) => {
        if (!open && blocker.state === "blocked") blocker.reset();
      }}
      title="Leave without saving?"
      description="You have changes on this page that are not saved. If you leave now, they are lost."
      confirmLabel="Leave page"
      destructive
      onConfirm={() => blocker.proceed?.()}
    />
  );
}