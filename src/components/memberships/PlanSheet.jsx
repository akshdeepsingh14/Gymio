import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormAlert, SelectField, TextAreaField, TextField } from "@/components/common/FormFields";
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
import { useAuth } from "@/hooks/useAuth";
import { getGymSettings } from "@/lib/gymSettings";
import {
  benefitsToText,
  customUnitOptions,
  durationFromForm,
  durationToForm,
  durationTypeOptions,
  formatDuration,
} from "@/lib/plans";
import { planSchema } from "@/lib/validation/plan";
import { ServiceError } from "@/services/memberService";
import { createPlan, updatePlan } from "@/services/planService";

function PlanForm({ plan, currency, onDone }) {
  const editing = Boolean(plan);
  const { user } = useAuth();
  const { planDurations, defaultDuration } = getGymSettings(user.gym);

  // Offer the durations the gym enabled, plus Custom. A plan keeps showing its own
  // duration even if the gym stopped offering it later.
  const currentType = editing ? durationToForm(plan.duration).durationType : null;
  const typeOptions = durationTypeOptions.filter(
    (option) => option.value === "custom" || planDurations.includes(option.value) || option.value === currentType,
  );

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: editing
      ? {
          name: plan.name,
          ...durationToForm(plan.duration),
          price: String(plan.price),
          description: plan.description ?? "",
          benefits: benefitsToText(plan.benefits),
        }
      : {
          name: "",
          durationType: defaultDuration,
          customValue: "",
          customUnit: "days",
          price: "",
          description: "",
          benefits: "",
        },
  });

  const durationType = watch("durationType");
  const customValue = watch("customValue");
  const customUnit = watch("customUnit");
  const custom = durationType === "custom";

  const customReady = /^\d+$/.test(customValue ?? "") && Number(customValue) > 0;
  const preview =
    !custom || customReady
      ? formatDuration(durationFromForm({ durationType, customValue, customUnit }))
      : null;

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await updatePlan(plan.id, values);
        toast.success("Plan updated.");
      } else {
        const created = await createPlan(values);
        toast.success(`${created.name} created.`);
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

        {editing && (
          <p className="rounded-sm border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            Changes apply to future sign-ups and renewals. Existing memberships and past payments stay as
            they are.
          </p>
        )}

        <TextField
          label="Plan name"
          autoComplete="off"
          placeholder="Monthly"
          error={errors.name?.message}
          {...register("name")}
        />

        <SelectField
          label="Duration"
          options={typeOptions}
          hint={preview ? `Each purchase or renewal covers ${preview}.` : undefined}
          error={errors.durationType?.message}
          {...register("durationType")}
        />

        {custom && (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Length"
              inputMode="numeric"
              autoComplete="off"
              error={errors.customValue?.message}
              {...register("customValue")}
            />
            <SelectField label="Unit" options={customUnitOptions} {...register("customUnit")} />
          </div>
        )}

        <TextField
          label={`Price (${currency})`}
          inputMode="numeric"
          autoComplete="off"
          placeholder="1500"
          error={errors.price?.message}
          {...register("price")}
        />

        <TextAreaField
          label="Description (optional)"
          rows={2}
          placeholder="Who this plan is for"
          error={errors.description?.message}
          {...register("description")}
        />

        <TextAreaField
          label="Benefits (optional)"
          rows={4}
          placeholder={"One per line, for example:\nLocker access\nFree diet consultation"}
          hint="Up to 6 lines."
          error={errors.benefits?.message}
          {...register("benefits")}
        />
      </div>

      <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t border-border p-5">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton type="submit" loading={isSubmitting} loadingText="Saving…">
          {editing ? "Save changes" : "Create plan"}
        </LoadingButton>
      </SheetFooter>
    </form>
  );
}

export function PlanSheet({ open, onOpenChange, plan, currency }) {
  const editing = Boolean(plan);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{editing ? "Edit plan" : "New plan"}</SheetTitle>
          <SheetDescription>
            {editing ? plan.name : "Set a duration and price. You can archive it later."}
          </SheetDescription>
        </SheetHeader>

        {/* The drawer unmounts its content when closed, so the form resets every time it opens */}
        <PlanForm key={plan?.id ?? "new"} plan={plan} currency={currency} onDone={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}