import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormAlert, TextAreaField, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { amendPaymentSchema } from "@/lib/validation/payment";
import { amendPayment } from "@/services/paymentService";

function AmendForm({ payment, currency, onDone }) {
  const isCash = payment.method === "cash";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(amendPaymentSchema),
    defaultValues: { reference: payment.reference ?? "", note: payment.note ?? "" },
  });

  const onSubmit = async (values) => {
    try {
      await amendPayment(payment.id, values);
      toast.success(`${payment.receiptNo} updated.`);
      onDone();
    } catch (error) {
      setError("root", { message: error.message ?? "Something went wrong. Try again." });
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <FormAlert message={errors.root?.message} />

        <dl className="space-y-2 rounded-sm border border-border bg-muted/50 p-4 text-sm">
          {[
            ["Member", payment.memberName],
            ["Amount", formatMoney(payment.amount, currency)],
            ["Method", payment.methodLabel],
            ["Date", formatDate(payment.date)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <dt className="label-mono text-muted-foreground">{label}</dt>
              <dd className="text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">
          The amount, method and dates cannot be edited. If any of them is wrong, void this payment and record a new
          one.
        </p>

        {!isCash && (
          <TextField
            label="Transaction reference"
            autoComplete="off"
            error={errors.reference?.message}
            {...register("reference")}
          />
        )}
        <TextAreaField label="Note" rows={3} error={errors.note?.message} {...register("note")} />
      </div>

      <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t border-border p-5">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton type="submit" loading={isSubmitting} loadingText="Saving…" disabled={!isDirty}>
          Save changes
        </LoadingButton>
      </SheetFooter>
    </form>
  );
}

export function AmendPaymentSheet({ open, onOpenChange, payment, currency }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>Edit reference and note</SheetTitle>
          <SheetDescription>{payment ? `${payment.receiptNo} · ${payment.memberName}` : ""}</SheetDescription>
        </SheetHeader>

        {payment && <AmendForm key={payment.id} payment={payment} currency={currency} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}