
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormAlert, SelectField, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { CreatePlanLink } from "@/components/common/CreatePlanLink";
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
import { buildCollectSchema, buildRenewalSchema } from "@/lib/validation/renewal";
import { ServiceError } from "@/services/memberService";
import { collectPendingPayment, renewMember } from "@/services/renewalService";

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

function RenewForm({ member, plans, currency, graceDays, onDone }) {
  const collecting = member.paymentStatus === "pending";
  const activePlans = plans.filter((plan) => plan.status === "active");
  const today = todayISO();

  const { user } = useAuth();
  const settings = useMemo(() => getGymSettings(user.gym), [user.gym]);
  const schema = useMemo(
    () => (collecting ? buildCollectSchema(settings) : buildRenewalSchema(settings)),
    [collecting, settings],
  );

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      planId: (activePlans.find((plan) => plan.id === member.planId) ?? activePlans[0])?.id ?? "",
      method: settings.paymentMethods[0],
      reference: "",
    },
  });

  const planId = watch("planId");
  const method = watch("method");

  const plan = collecting
    ? plans.find((p) => p.id === member.planId)
    : activePlans.find((p) => p.id === planId);
  const period = collecting
    ? { start: member.joinedOn, end: member.expiresOn }
    : plan
      ? getRenewalPeriod(member, plan, today)
      : null;

  const noPlans = !collecting && activePlans.length === 0;
  const tooFar = !collecting && period && period.daysLeft > MAX_RENEWAL_LEAD_DAYS;

  let timing = null;
  if (!collecting && period) {
    if (period.lapsed) {
      const late = Math.abs(period.daysLeft);
      timing = `Expired ${late} ${late === 1 ? "day" : "days"} ago. ${
        late <= graceDays ? "Still inside the grace period." : "Past the grace period."
      } The new period starts today.`;
    } else {
      timing = `Current membership ends ${formatDate(member.expiresOn)}. The new period starts the next day, so no days are lost.`;
    }
  }

  const onSubmit = async (values) => {
    try {
      if (collecting) {
        await collectPendingPayment(member.id, values);
        toast.success(`Payment recorded for ${member.name}.`);
      } else {
        const result = await renewMember(member.id, values);
        toast.success(`${member.name} renewed until ${formatDate(result.end)}.`);
      }
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

        {noPlans ? (
          <p className="text-sm text-muted-foreground">
            You have no active plans.{" "}
            <CreatePlanLink />
          </p>
        ) : (
          <>
            {collecting ? (
              <p className="text-sm text-muted-foreground">
                {member.name} was added with payment pending. Recording it settles the current period. The
                membership dates stay the same.
              </p>
            ) : (
              <SelectField
                label="Plan"
                error={errors.planId?.message}
                options={activePlans.map((p) => ({
                  value: p.id,
                  label: `${p.name} · ${formatMoney(p.price, currency)}`,
                }))}
                {...register("planId")}
              />
            )}

            {timing && <p className="text-sm text-muted-foreground">{timing}</p>}
            {tooFar && (
              <FormAlert message="This membership already runs for more than a year. No renewal is needed yet." />
            )}

            {plan && period && (
              <Summary
                rows={[
                  ["Amount", formatMoney(plan.price, currency)],
                  ["Period", `${formatDate(period.start)} to ${formatDate(period.end)}`],
                ]}
              />
            )}

            <SelectField
              label="Payment method"
              options={enabledMethodOptions(settings)}
              error={errors.method?.message}
              {...register("method")}
            />
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
          disabled={noPlans || tooFar || !plan}
        >
          {collecting ? "Record payment" : "Record renewal"}
        </LoadingButton>
      </SheetFooter>
    </form>
  );
}

/** `member` is a snapshot taken when the sheet opens, so the form does not change while it closes. */
export function RenewSheet({ open, onOpenChange, member, plans, currency, graceDays }) {
  const collecting = member?.paymentStatus === "pending";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{collecting ? "Collect payment" : "Renew membership"}</SheetTitle>
          <SheetDescription>{member ? `${member.name} · ${member.id}` : ""}</SheetDescription>
        </SheetHeader>

        {member && (
          <RenewForm
            key={member.id}
            member={member}
            plans={plans}
            currency={currency}
            graceDays={graceDays}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}