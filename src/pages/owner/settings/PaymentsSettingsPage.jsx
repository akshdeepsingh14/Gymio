import { useMemo } from "react";
import { toast } from "sonner";

import { SegmentedControl } from "@/components/common/SegmentedControl";
import { FormAlert, SelectField, TextField } from "@/components/common/FormFields";
import { ReceiptPaper } from "@/components/payments/ReceiptPaper";
import { CheckboxCards } from "@/components/settings/CheckboxCards";
import { SaveBar } from "@/components/settings/SaveBar";
import { SwitchRow } from "@/components/settings/SwitchRow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { todayISO } from "@/lib/dates";
import {
  getGymSettings,
  parseGymSettingsPatch,
  paymentMethodChoices,
  receiptDigitOptions,
  receiptLayoutOptions,
  TAX_NAME_MAX,
  TAX_NUMBER_MAX,
} from "@/lib/gymSettings";
import { getPeriodEnd } from "@/lib/membership";
import { formatReceiptNo, highestReceiptNumber, nextReceiptNumber } from "@/lib/payments";
import { buildReceipt } from "@/lib/receipt";

const KEYS = [
  "paymentMethods",
  "receiptPrefix",
  "receiptDigits",
  "receiptNext",
  "taxName",
  "taxNumber",
  "receiptLayout",
  "requireReference",
  "requireNoteOnDifference",
];

const layoutItems = receiptLayoutOptions.map(({ value, label }) => ({ id: value, label }));

// The two number fields are typed as text, so the form keeps them as text
const toForm = (settings) => ({
  ...settings,
  receiptDigits: String(settings.receiptDigits),
  receiptNext: String(settings.receiptNext),
});

export default function PaymentsSettingsPage() {
  const { user, updateGymSettings } = useAuth();
  const db = useDb();
  const saved = useMemo(() => toForm(getGymSettings(user.gym)), [user.gym]);

  const { draft, update, dirty, saving, error, discard, submit } = useSettingsForm({
    saved,
    keys: KEYS,
    save: (values) => updateGymSettings(values),
    successMessage: "Payment settings saved.",
  });

  // The same check the save runs, so a problem shows next to its field before the owner clicks Save
  const check = useMemo(() => parseGymSettingsPatch(draft, user.gym), [draft, user.gym]);
  const fieldError = (field) => (check.error?.field === field ? check.error.message : undefined);

  // The settings as they would be after saving. Bad values fall back to safe ones, so the preview never breaks.
  const live = useMemo(() => getGymSettings({ ...user.gym, ...draft }), [user.gym, draft]);

  const counter = nextReceiptNumber(db.payments, live);
  const nextNo = formatReceiptNo(live, counter);
  const highest = highestReceiptNumber(db.payments, live.receiptPrefix);
  const raised = counter > live.receiptNext;
  const outOfDigits = counter >= 10 ** live.receiptDigits;

  const receipt = useMemo(() => {
    const today = todayISO();
    const plan = db.plans.find((p) => p.status === "active") ?? db.plans[0];
    const method = live.paymentMethods[0];

    return buildReceipt({
      payment: {
        receiptNo: nextNo,
        memberName: "Sample Member",
        memberId: `${db.memberPrefix}-0001`,
        planName: plan?.name ?? "Monthly",
        date: today,
        periodStart: today,
        periodEnd: getPeriodEnd(today, plan?.duration ?? { unit: "months", value: 1 }),
        amount: plan?.price ?? 1500,
        method,
        reference: method === "cash" ? "" : "SAMPLE-0001",
        note: "",
        status: "recorded",
        taxName: live.taxName,
        taxNumber: live.taxNumber,
      },
      gym: { ...user.gym, receiptLayout: live.receiptLayout },
      gymName: user.gymName,
      currency: user.gym?.currency ?? "INR",
    });
  }, [db.plans, db.memberPrefix, live, nextNo, user.gym, user.gymName]);

  const onSave = () => {
    if (check.error) {
      toast.error("Fix the highlighted field first.");
      return;
    }
    submit();
  };

  const activeLayout = receiptLayoutOptions.find((option) => option.value === draft.receiptLayout);

  return (
    <>
      <title>Payments and receipts — Settings — Gymio</title>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment methods</CardTitle>
            <CardDescription>
              The methods you can pick when recording a payment, renewing or adding a member. Old payments keep their
              method, and the payment filters still list every method.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CheckboxCards
              legend="Accepted methods"
              name="payment-methods"
              values={draft.paymentMethods}
              onChange={(paymentMethods) => update({ paymentMethods })}
              options={paymentMethodChoices}
              minSelected={1}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receipt numbers</CardTitle>
            <CardDescription>
              Each new payment gets the next number. Numbers are never reused, and receipts already issued keep
              theirs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-3">
              <TextField
                label="Prefix"
                autoComplete="off"
                maxLength={8}
                value={draft.receiptPrefix}
                onChange={(event) => update({ receiptPrefix: event.target.value.toUpperCase() })}
                error={fieldError("receiptPrefix")}
                hint="Letters, numbers or hyphens."
              />
              <SelectField
                label="Digits"
                options={receiptDigitOptions}
                value={draft.receiptDigits}
                onChange={(event) => update({ receiptDigits: event.target.value })}
                error={fieldError("receiptDigits")}
                hint={`Pads with zeros, like ${formatReceiptNo(live, 42)}.`}
              />
              <TextField
                label="Next number"
                inputMode="numeric"
                autoComplete="off"
                value={draft.receiptNext}
                onChange={(event) => update({ receiptNext: event.target.value.replace(/\D/g, "").replace(/^0+/, "") })}
                error={fieldError("receiptNext")}
                hint="Where this prefix continues from."
              />
            </div>

            <div className="rounded-sm border border-border bg-muted/50 p-4">
              <p className="label-mono text-muted-foreground">Next receipt</p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums" aria-live="polite">
                {nextNo}
              </p>
              {outOfDigits ? (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  {live.receiptDigits} digits are full. Add a digit, or payments cannot be recorded.
                </p>
              ) : (
                raised && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Receipts with the prefix {live.receiptPrefix} already go up to {highest}, so the next one
                    continues after that.
                  </p>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax details</CardTitle>
            <CardDescription>
              Optional. Printed under your gym name on new receipts. Receipts issued before you add them stay as they
              were, with no tax line.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Tax name"
                autoComplete="off"
                placeholder="GSTIN"
                maxLength={TAX_NAME_MAX}
                value={draft.taxName}
                onChange={(event) => update({ taxName: event.target.value })}
                onBlur={() => update({ taxName: draft.taxName.trim() })}
                error={fieldError("taxName")}
              />
              <TextField
                label="Tax number"
                autoComplete="off"
                maxLength={TAX_NUMBER_MAX}
                value={draft.taxNumber}
                onChange={(event) => update({ taxNumber: event.target.value })}
                onBlur={() => update({ taxNumber: draft.taxNumber.trim() })}
                error={fieldError("taxNumber")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receipt layout</CardTitle>
            <CardDescription>
              The preview uses sample data and updates as you change anything on this page. The layout applies to
              every receipt on screen, in print and in the PDF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
              <div className="space-y-3">
                <SegmentedControl
                  label="Receipt layout"
                  value={draft.receiptLayout}
                  onChange={(receiptLayout) => update({ receiptLayout })}
                  items={layoutItems}
                />
                <p className="text-sm text-muted-foreground">{activeLayout?.description}</p>
              </div>

              <div className="rounded-sm bg-muted/40 p-4">
                <ReceiptPaper receipt={receipt} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment rules</CardTitle>
            <CardDescription>
              Checked in the forms and again when a payment is saved. They apply to new payments only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SwitchRow
              label="Require a transaction reference"
              description="UPI and other non-cash payments cannot be saved without one. Cash never needs it."
              checked={draft.requireReference}
              onChange={(requireReference) => update({ requireReference })}
            />
            <SwitchRow
              label="Require a note when the amount differs from the plan price"
              description="For a discount or part payment, the owner has to say why before the payment is saved."
              checked={draft.requireNoteOnDifference}
              onChange={(requireNoteOnDifference) => update({ requireNoteOnDifference })}
            />
          </CardContent>
        </Card>

        <FormAlert message={error} />
        <SaveBar dirty={dirty} saving={saving} onSave={onSave} onDiscard={discard} />
      </div>
    </>
  );
}
