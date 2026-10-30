import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormAlert, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/dates";
import { DELETION_WAIT_DAYS } from "@/lib/dataPrivacy";
import { buildDeleteSchema } from "@/lib/validation/privacy";
import { ServiceError } from "@/services/memberService";
import { cancelDeletion, deleteAccountNow, isDemoAccount, requestDeletion } from "@/services/privacyService";

const WHAT_GOES = [
  "Your gym profile, plans, members, payments and receipts",
  "Announcements, photos, staff accounts and the audit log",
  "Member portal access. Your members will no longer be able to sign in",
];

function RequestForm({ gymName, onDone }) {
  const schema = useMemo(() => buildDeleteSchema(gymName), [gymName]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { gymName: "", password: "", understand: false },
  });

  const onSubmit = async (values) => {
    try {
      const { scheduledFor } = await requestDeletion(values);
      toast.success(`Deletion scheduled for ${formatDate(scheduledFor)}.`);
      onDone();
    } catch (error) {
      if (error instanceof ServiceError && error.field) {
        setError(error.field, { message: error.message });
      } else {
        setError("root", { message: error.message ?? "Something went wrong. Try again." });
      }
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <FormAlert message={errors.root?.message} />

        <div className="rounded-sm border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-semibold text-destructive">This removes:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {WHAT_GOES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <TextField
          label={`Type “${gymName}” to confirm`}
          autoComplete="off"
          error={errors.gymName?.message}
          {...register("gymName")}
        />

        <TextField
          label="Your password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="space-y-2">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-foreground" {...register("understand")} />
            <span>I have downloaded the records I need, and I understand deletion cannot be undone.</span>
          </label>
          {errors.understand && (
            <p role="alert" className="text-sm text-destructive">
              {errors.understand.message}
            </p>
          )}
        </div>
      </div>

      <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t border-border p-5">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton type="submit" variant="destructive" loading={isSubmitting} loadingText="Checking…">
          Schedule deletion
        </LoadingButton>
      </SheetFooter>
    </form>
  );
}

/** `request` is { requestedAt, scheduledFor } while a deletion is scheduled, otherwise null. */
export function DeleteAccountCard({ request }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const demo = isDemoAccount(user);

  const cancel = async () => {
    setBusy(true);
    try {
      await cancelDeletion();
      toast.success("Deletion cancelled. Your gym stays as it is.");
    } catch (error) {
      toast.error(error.message ?? "Could not cancel. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const deleteNow = async () => {
    setBusy(true);
    try {
      await deleteAccountNow();
      toast.success("Your gym and its records were deleted.");
      navigate("/", { replace: true });
      await signOut();
    } catch (error) {
      toast.error(error.message ?? "Could not delete. Try again.");
      setBusy(false);
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          Permanently delete this gym and everything in it. After you ask, there is a {DELETION_WAIT_DAYS}-day wait in
          which you can change your mind.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {request ? (
          <>
            <div role="status" className="rounded-sm border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <p className="font-semibold text-destructive">Deletion scheduled for {formatDate(request.scheduledFor)}</p>
              <p className="mt-1 text-muted-foreground">
                Until then your gym works as usual. Cancel any time before that date to keep everything.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LoadingButton variant="outline" loading={busy} loadingText="Working…" onClick={cancel}>
                Cancel deletion
              </LoadingButton>
              <Button variant="destructive" disabled={busy} onClick={() => setConfirmOpen(true)}>
                Delete now
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Demo shortcut: Delete now skips the waiting period so you can try the full flow. The real service will
              always wait.
            </p>
          </>
        ) : (
          <>
            {demo && (
              <p role="note" className="rounded-sm border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                The demo account cannot be deleted. Create your own account to try this flow.
              </p>
            )}
            <Button variant="destructive" disabled={demo} onClick={() => setFormOpen(true)}>
              Delete my account…
            </Button>
          </>
        )}
      </CardContent>

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
          <SheetHeader className="border-b border-border p-5">
            <SheetTitle>Delete account</SheetTitle>
            <SheetDescription>Confirm with your gym name and password.</SheetDescription>
          </SheetHeader>
          <RequestForm gymName={user.gymName} onDone={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => !busy && setConfirmOpen(open)}
        title="Delete everything now?"
        description="Your gym, members, payments and receipts are removed from this browser straight away. This cannot be undone."
        confirmLabel="Delete permanently"
        destructive
        loading={busy}
        onConfirm={deleteNow}
      />
    </Card>
  );
}