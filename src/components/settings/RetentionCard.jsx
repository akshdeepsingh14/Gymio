import { useMemo } from "react";
import { Link } from "react-router";

import { FormAlert } from "@/components/common/FormFields";
import { ChoiceCards } from "@/components/settings/ChoiceCards";
import { SaveBar } from "@/components/settings/SaveBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { todayISO } from "@/lib/dates";
import { countPastRetention, RETENTION_OPTIONS, retentionMonths } from "@/lib/dataPrivacy";
import { saveDataPolicy } from "@/services/privacyService";

const KEYS = ["inactiveRetention"];

export function RetentionCard({ policy, members }) {
  const { draft, update, dirty, saving, error, discard, submit } = useSettingsForm({
    saved: policy,
    keys: KEYS,
    save: (values) => saveDataPolicy(values),
    successMessage: "Retention setting saved.",
  });

  const months = retentionMonths(draft.inactiveRetention);
  const due = useMemo(() => countPastRetention(members, todayISO(), months), [members, months]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data retention</CardTitle>
        <CardDescription>
          How long to keep the records of members you marked inactive. Keeping less personal data lowers the risk if
          something goes wrong.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChoiceCards
          legend="Review inactive members after"
          name="inactive-retention"
          value={draft.inactiveRetention}
          onChange={(inactiveRetention) => update({ inactiveRetention })}
          options={RETENTION_OPTIONS}
        />

        <div className="rounded-sm border border-border bg-muted/50 p-4 text-sm">
          {months === null ? (
            <p className="text-muted-foreground">Nothing is flagged. Inactive members stay until you remove them.</p>
          ) : (
            <p aria-live="polite">
              <span className="font-mono font-bold tabular-nums">{due}</span>{" "}
              <span className="text-muted-foreground">
                inactive {due === 1 ? "member is" : "members are"} past this period. Find them in{" "}
                <Link to="/app/members" className="font-semibold text-foreground underline underline-offset-4">
                  Members
                </Link>
                .
              </span>
            </p>
          )}
        </div>

        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Demo: Gymio only flags members and deletes nothing by itself. The backend will run the review.</li>
          <li>
            Payments and receipts are not covered by this setting. They are your accounting records, so ask your
            accountant how long to keep them.
          </li>
        </ul>

        <FormAlert message={error} />
        <SaveBar dirty={dirty} saving={saving} onSave={submit} onDiscard={discard} />
      </CardContent>
    </Card>
  );
}