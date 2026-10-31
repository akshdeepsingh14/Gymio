import { LoadingButton } from "@/components/common/LoadingButton";
import { UnsavedChangesGuard } from "@/components/settings/UnsavedChangesGuard";
import { Button } from "@/components/ui/button";

/** Bottom row of a settings tab: shows whether anything is unsaved, with Discard and Save. Leaving with unsaved changes asks first. */
export function SaveBar({ dirty, saving, onSave, onDiscard }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
      <UnsavedChangesGuard when={dirty} />
      <p role="status" className="text-sm text-muted-foreground">
        {dirty ? "You have unsaved changes." : "No unsaved changes."}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onDiscard} disabled={!dirty || saving}>
          Discard
        </Button>
        <LoadingButton type="button" onClick={onSave} loading={saving} loadingText="Saving…" disabled={!dirty}>
          Save changes
        </LoadingButton>
      </div>
    </div>
  );
}