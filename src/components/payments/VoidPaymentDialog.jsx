import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "radix-ui";
import { toast } from "sonner";

import { FormAlert, TextAreaField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { Button } from "@/components/ui/button";
import { useDb } from "@/hooks/useDb";
import { formatDate, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { getLatestCounted } from "@/lib/payments";
import { voidPaymentSchema } from "@/lib/validation/payment";
import { ServiceError } from "@/services/memberService";
import { voidPayment } from "@/services/paymentService";

/** What voiding does to the member. Mirrors the rules in paymentService.voidPayment. */
function getImpact(payments, payment) {
  const latest = getLatestCounted(payments, payment.memberId);
  if (latest && latest.id !== payment.id) return { kind: "blocked", latest };

  const previous = getLatestCounted(
    payments.filter((p) => p.id !== payment.id),
    payment.memberId,
  );
  return previous ? { kind: "rollback", expiresOn: previous.periodEnd } : { kind: "unpaid" };
}

function ImpactNote({ impact, today }) {
  if (impact.kind === "blocked") {
    return (
      <FormAlert
        message={`Void ${impact.latest.receiptNo} first. It is this member's newest payment, and voiding in order keeps their dates correct.`}
      />
    );
  }

  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
      <li>The record stays on file, marked as voided, and is left out of revenue.</li>
      {impact.kind === "rollback" ? (
        <li>
          The membership goes back to ending on <span className="font-semibold text-foreground">{formatDate(impact.expiresOn)}</span>
          {impact.expiresOn < today ? ", which has already passed, so the member will show as expired." : "."}
        </li>
      ) : (
        <li>This period becomes unpaid again. The membership dates stay the same.</li>
      )}
      <li>To fix an amount, void this payment and record a new one.</li>
    </ul>
  );
}

function VoidForm({ payment, currency, onDone }) {
  const db = useDb();
  const today = todayISO();
  // Worked out once when the dialog opens, so it does not change while it closes
  const [impact] = useState(() => getImpact(db.payments, payment));

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(voidPaymentSchema), defaultValues: { reason: "" } });

  const onSubmit = async (values) => {
    try {
      await voidPayment(payment.id, values);
      toast.success(`${payment.receiptNo} voided.`);
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
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
      <FormAlert message={errors.root?.message} />

      <p className="rounded-sm border border-border bg-muted/50 p-3 text-sm">
        <span className="font-semibold">{payment.receiptNo}</span> · {payment.memberName} ·{" "}
        <span className="font-mono font-semibold">{formatMoney(payment.amount, currency)}</span>
      </p>

      <ImpactNote impact={impact} today={today} />

      {impact.kind !== "blocked" && (
        <TextAreaField
          label="Reason"
          rows={2}
          hint="Saved in the audit trail."
          error={errors.reason?.message}
          {...register("reason")}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          variant="destructive"
          loading={isSubmitting}
          loadingText="Voiding…"
          disabled={impact.kind === "blocked"}
        >
          Void payment
        </LoadingButton>
      </div>
    </form>
  );
}

export function VoidPaymentDialog({ open, onOpenChange, payment, currency }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 border-foreground bg-popover p-6 text-popover-foreground shadow-hard outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <Dialog.Title className="font-display text-3xl font-extrabold uppercase leading-none">
            Void payment?
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Use this when a payment was recorded by mistake. It cannot be undone.
          </Dialog.Description>

          {payment && <VoidForm payment={payment} currency={currency} onDone={() => onOpenChange(false)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}