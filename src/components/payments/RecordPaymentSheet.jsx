import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormAlert, SelectField, TextAreaField, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { CreatePlanLink } from "@/components/common/CreatePlanLink";
import { MemberPicker } from "@/components/payments/MemberPicker";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { getGymSettings } from "@/lib/gymSettings";
import { enabledMethodOptions } from "@/lib/payments";
import { getRenewalPeriod, MAX_RENEWAL_LEAD_DAYS } from "@/lib/renewal";
import { buildRecordPaymentSchema } from "@/lib/validation/payment";
import { ServiceError } from "@/services/memberService";
import { recordPayment } from "@/services/paymentService";

function Summary({ rows }) {
  return (
    <dl className="space-y-2 rounded-sm border border-border bg-muted/50 p-4 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4">
          <dt className="label-mono text-muted-foreground">{label}</dt>
          <dd className="text-right font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecordForm({ members, plans, currency, onDone }) {
  const { user } = useAuth();
  const settings = useMemo(() => getGymSettings(user.gym), [user.gym]);
  const schema = useMemo(() => buildRecordPaymentSchema(settings, plans), [settings, plans]);

  const activePlans = plans.filter((plan) => plan.status === "active");
  const planNames = Object.fromEntries(plans.map((plan) => [plan.id, plan.name]));
  const today = todayISO();

  // Once the owner types an amount, changing the plan no longer overwrites it
  const [amountEdited, setAmountEdited] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      memberId: "",
      planId: "",
      amount: "",
      method: settings.paymentMethods[0],
      reference: "",
      date: today,
      note: "",
    },
  });

  const memberId = watch("memberId");
  const planId = watch("planId");
  const amount = watch("amount");
  const method = watch("method");
  const date = watch("date");

  const member = members.find((m) => m.id === memberId);
  const collecting = member?.paymentStatus === "pending";
  const plan = collecting ? plans.find((p) => p.id === member.planId) : activePlans.find((p) => p.id === planId);
  const noPlans = activePlans.length === 0;

  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "");
  const paidOn = validDate && date <= today ? date : today;
  const period =
    member && plan
      ? collecting
        ? { start: member.joinedOn, end: member.expiresOn, daysLeft: 0, lapsed: false }
        : getRenewalPeriod(member, plan, paidOn)
      : null;
  const tooFar = !collecting && period && period.daysLeft > MAX_RENEWAL_LEAD_DAYS;

  let timing = null;
  if (member && period && !collecting) {
    timing = period.lapsed
      ? `Expired ${Math.abs(period.daysLeft)} ${Math.abs(period.daysLeft) === 1 ? "day" : "days"} before the payment date. The new period starts on the payment date.`
      : `Current membership ends ${formatDate(member.expiresOn)}. The new period starts the next day, so no days are lost.`;
  }

  const setPlanAndAmount = (nextPlan) => {
    setValue("planId", nextPlan?.id ?? "");
    if (nextPlan && !amountEdited) setValue("amount", String(nextPlan.price));
  };

  const pickMember = (id) => {
    setValue("memberId", id);
    clearErrors("memberId");
    setAmountEdited(false);

    const picked = members.find((m) => m.id === id);
    if (!picked) {
      setValue("planId", "");
      setValue("amount", "");
      return;
    }

    // An unpaid first period is always settled with the plan the member joined on
    const nextPlan =
      picked.paymentStatus === "pending"
        ? plans.find((p) => p.id === picked.planId)
        : (activePlans.find((p) => p.id === picked.planId) ?? activePlans[0]);
    setValue("planId", nextPlan?.id ?? "");
    setValue("amount", nextPlan ? String(nextPlan.price) : "");
  };

  const priceDiffers = plan && /^\d+$/.test(amount ?? "") && Number(amount) !== plan.price;
  const noteRequired = settings.requireNoteOnDifference && priceDiffers;

  const onSubmit = async (values) => {
    try {
      const result = await recordPayment(values);
      toast.success(`${result.payment.receiptNo} recorded for ${member.name}.`);
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

        {noPlans && !collecting ? (
          <p className="text-sm text-muted-foreground">
            You have no active plans.{" "}
            <CreatePlanLink />
          </p>
        ) : null}

        <MemberPicker
          members={members}
          planNames={planNames}
          value={memberId}
          onChange={pickMember}
          error={errors.memberId?.message}
        />

        {member && (
          <>
            {collecting ? (
              <>
                <input type="hidden" {...register("planId")} />
                <p className="text-sm text-muted-foreground">
                  {member.name} was added with payment pending. This payment settles their first period on the{" "}
                  <span className="font-semibold text-foreground">{plan?.name ?? "chosen"}</span> plan. The membership
                  dates stay the same.
                </p>
              </>
            ) : (
              <SelectField
                label="Plan"
                error={errors.planId?.message}
                options={activePlans.map((p) => ({ value: p.id, label: `${p.name} · ${formatMoney(p.price, currency)}` }))}
                {...register("planId", {
                  onChange: (event) => setPlanAndAmount(activePlans.find((p) => p.id === event.target.value)),
                })}
              />
            )}

            {timing && <p className="text-sm text-muted-foreground">{timing}</p>}
            {tooFar && (
              <FormAlert message="This membership already runs for more than a year. No renewal is needed yet." />
            )}

            <TextField
              label={`Amount (${currency})`}
              inputMode="numeric"
              autoComplete="off"
              error={errors.amount?.message}
              hint={
                priceDiffers
                  ? `The plan price is ${formatMoney(plan.price, currency)}. ${
                      settings.requireNoteOnDifference
                        ? "A note is required when the amount differs."
                        : "Add a note if this is a discount or part payment."
                    }`
                  : "Whole amounts only."
              }
              {...register("amount", { onChange: () => setAmountEdited(true) })}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Payment method"
                options={enabledMethodOptions(settings)}
                error={errors.method?.message}
                {...register("method")}
              />
              <TextField
                label="Payment date"
                type="date"
                max={today}
                error={errors.date?.message}
                {...register("date")}
              />
            </div>

            {method !== "cash" && (
              <TextField
                label={settings.requireReference ? "Transaction reference" : "Transaction reference (optional)"}
                autoComplete="off"
                hint={
                  settings.requireReference
                    ? "Required for non-cash payments. Gymio does not verify it with a bank."
                    : "Saved as you enter it. Gymio does not verify it with a bank."
                }
                error={errors.reference?.message}
                {...register("reference")}
              />
            )}

            <TextAreaField
              label={noteRequired ? "Note (required)" : "Note (optional)"}
              rows={2}
              error={errors.note?.message}
              {...register("note")}
            />

            {plan && period && (
              <Summary
                rows={[
                  ["Covers", `${formatDate(period.start)} to ${formatDate(period.end)}`],
                  ["Expires after", formatDate(period.end)],
                ]}
              />
            )}
          </>
        )}
      </div>

      <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t border-border p-5">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          loading={isSubmitting}
          loadingText="Recording…"
          disabled={!member || !plan || tooFar}
        >
          Record payment
        </LoadingButton>
      </SheetFooter>
    </form>
  );
}

export function RecordPaymentSheet({ open, onOpenChange, members, plans, currency }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>Record payment</SheetTitle>
          <SheetDescription>
            Manually recorded. Gymio does not check it with a bank or UPI provider.
          </SheetDescription>
        </SheetHeader>

        <RecordForm members={members} plans={plans} currency={currency} onDone={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}