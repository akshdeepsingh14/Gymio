
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  FormAlert,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/common/FormFields";
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
import { getPeriodEnd } from "@/lib/membership";
import { enabledMethodOptions } from "@/lib/payments";
import { buildNewMemberSchema, memberDetailsSchema } from "@/lib/validation/member";
import { createMember, ServiceError, updateMember } from "@/services/memberService";
import { usePermissions } from "@/hooks/usePermissions";

function MemberForm({ member, plans, currency, onDone }) {
  const editing = Boolean(member);
  const activePlans = plans.filter((plan) => plan.status === "active");

  const { user } = useAuth();
  const { can } = usePermissions();
  const canRecord = can("payments.record");
  const settings = useMemo(() => getGymSettings(user.gym), [user.gym]);
  const schema = useMemo(
    () => (editing ? memberDetailsSchema : buildNewMemberSchema(settings)),
    [editing, settings],
  );

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: editing
      ? {
          name: member.name,
          phone: member.phone ?? "",
          email: member.email ?? "",
          locality: member.locality ?? "",
          notes: member.notes ?? "",
        }
      : {
          name: "",
          phone: "",
          email: "",
          locality: "",
          notes: "",
          planId: (activePlans.find((p) => p.id === "plan_monthly") ?? activePlans[0])?.id ?? "",
          startsOn: todayISO(),
          paymentMode: canRecord ? "paid" : "later",
          method: settings.paymentMethods[0],
          reference: "",
        },
  });

  const planId = watch("planId");
  const startsOn = watch("startsOn");
  const paymentMode = watch("paymentMode");
  const method = watch("method");

  const plan = activePlans.find((p) => p.id === planId);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(startsOn ?? "");
  const endsOn = plan && validDate ? getPeriodEnd(startsOn, plan.duration) : null;
  const noPlans = !editing && activePlans.length === 0;

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await updateMember(member.id, values);
        toast.success("Member updated.");
      } else {
        const created = await createMember(values);
        toast.success(`${created.name} added as ${created.id}.`);
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

        <TextField label="Full name" autoComplete="off" error={errors.name?.message} {...register("name")} />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Phone (optional)"
            type="tel"
            autoComplete="off"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <TextField
            label="Email (optional)"
            type="email"
            autoComplete="off"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <TextField
          label="City / locality (optional)"
          autoComplete="off"
          error={errors.locality?.message}
          {...register("locality")}
        />

        {!editing && (
          <>
            <fieldset className="space-y-5 border-t border-border pt-5">
              <legend className="label-mono mb-4">Membership</legend>

              {noPlans ? (
                <p className="text-sm text-muted-foreground">
                  You have no active plans.{" "}
                  <CreatePlanLink />
                </p>
              ) : (
                <>
                  <SelectField
                    label="Plan"
                    error={errors.planId?.message}
                    options={activePlans.map((p) => ({
                      value: p.id,
                      label: `${p.name} · ${formatMoney(p.price, currency)}`,
                    }))}
                    {...register("planId")}
                  />
                  <TextField
                    label="Start date"
                    type="date"
                    error={errors.startsOn?.message}
                    hint={endsOn ? `Membership runs through ${formatDate(endsOn)}.` : undefined}
                    {...register("startsOn")}
                  />
                </>
              )}
            </fieldset>

            {!noPlans && !canRecord && (
              <p className="border-t border-border pt-5 text-sm text-muted-foreground">
                Your role cannot take payments, so this member is added as unpaid. Someone with payment access can
                collect it later.
              </p>
            )}
            {!noPlans && canRecord && (
              <fieldset className="space-y-5 border-t border-border pt-5">
                <legend className="label-mono mb-4">Payment</legend>
                <SelectField
                  label="Payment status"
                  options={[
                    { value: "paid", label: plan ? `Paid now (${formatMoney(plan.price, currency)})` : "Paid now" },
                    { value: "later", label: "Pay later (mark as unpaid)" },
                  ]}
                  {...register("paymentMode")}
                />
                {paymentMode === "paid" && (
                  <>
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
              </fieldset>
            )}
          </>
        )}

        <TextAreaField
          label="Notes (optional)"
          placeholder="Injury, preferred batch, anything useful"
          error={errors.notes?.message}
          {...register("notes")}
        />
      </div>

      <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t border-border p-5">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          loading={isSubmitting}
          loadingText="Saving…"
          disabled={noPlans}
        >
          {editing ? "Save changes" : "Add member"}
        </LoadingButton>
      </SheetFooter>
    </form>
  );
}

export function MemberSheet({ open, onOpenChange, member, plans, currency }) {
  const editing = Boolean(member);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{editing ? "Edit member" : "Add member"}</SheetTitle>
          <SheetDescription>
            {editing
              ? `${member.name} · ${member.id}`
              : "Only the name and plan are required. Collect the rest only if you need it."}
          </SheetDescription>
        </SheetHeader>

        {/* key remounts the form, so defaults reset every time the drawer opens */}
        <MemberForm
          key={member?.id ?? "new"}
          member={member}
          plans={plans}
          currency={currency}
          onDone={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
