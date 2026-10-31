
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "radix-ui";
import { toast } from "sonner";

import { FormAlert, TextAreaField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { rejectRequestSchema } from "@/lib/validation/access";
import { rejectRequest } from "@/services/accessRequestService";

function RejectForm({ row, onDone }) {
  const { can } = usePermissions();
  const hasLiveCode =
    can("members.manage") &&
    Boolean(row.member?.credential) &&
    row.member.credential.status !== "revoked";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(rejectRequestSchema),
    defaultValues: { reason: "", revokeCode: false },
  });

  const onSubmit = async (values) => {
    try {
      await rejectRequest(row.id, values);
      toast.success(`Request from ${row.name} rejected.`);
      onDone();
    } catch (error) {
      setError("root", { message: error.message ?? "Something went wrong. Try again." });
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
      <FormAlert message={errors.root?.message} />

      <p className="rounded-sm border border-border bg-muted/50 p-3 text-sm">
        <span className="font-semibold">{row.name}</span> ·{" "}
        <span className="font-mono">{row.memberId}</span>
      </p>

      <TextAreaField
        label="Note (optional)"
        rows={2}
        hint="Only the gym team can see this. It is saved in the audit trail."
        error={errors.reason?.message}
        {...register("reason")}
      />

      {hasLiveCode && (
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-foreground"
            {...register("revokeCode")}
          />
          <span>
            <span className="font-semibold">Also revoke their access code</span>
            <span className="block text-muted-foreground">
              Choose this if you do not recognise the request. They will need a new code to ask again.
            </span>
          </span>
        </label>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton type="submit" variant="destructive" loading={isSubmitting} loadingText="Rejecting…">
          Reject request
        </LoadingButton>
      </div>
    </form>
  );
}

export function RejectRequestDialog({ open, onOpenChange, row }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 border-foreground bg-popover p-6 text-popover-foreground shadow-hard outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <Dialog.Title className="font-display text-3xl font-extrabold uppercase leading-none">
            Reject request?
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The member will see that the gym did not approve this request. If it was a mistake, you can create a new
            access code for them.
          </Dialog.Description>

          {row && <RejectForm row={row} onDone={() => onOpenChange(false)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
