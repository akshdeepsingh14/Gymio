import { useMemo } from "react";

import { FormAlert, SelectField } from "@/components/common/FormFields";
import { CheckboxCards } from "@/components/settings/CheckboxCards";
import { ChoiceCards } from "@/components/settings/ChoiceCards";
import { SaveBar } from "@/components/settings/SaveBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { graceOptions, reminderOptions } from "@/data/options";
import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { todayISO } from "@/lib/dates";
import {
  countStatuses,
  getGymSettings,
  graceAccessOptions,
  planDurationChoices,
  statusDefinitions,
} from "@/lib/gymSettings";

const KEYS = ["graceDays", "reminderDays", "graceAccess", "planDurations", "defaultDuration"];

export default function MembershipSettingsPage() {
  const { user, updateGymSettings } = useAuth();
  const db = useDb();
  const saved = useMemo(() => getGymSettings(user.gym), [user.gym]);

  const { draft, update, dirty, saving, error, discard, submit } = useSettingsForm({
    saved,
    keys: KEYS,
    save: (values) => updateGymSettings(values),
    successMessage: "Membership settings saved.",
  });

  const today = todayISO();
  const { graceDays, reminderDays } = draft;
  const counts = useMemo(
    () => countStatuses(db.members, today, { graceDays, reminderDays }),
    [db.members, today, graceDays, reminderDays],
  );
  const definitions = statusDefinitions(draft);

  const changeDurations = (list) =>
    update({
      planDurations: list,
      defaultDuration: list.includes(draft.defaultDuration)
        ? draft.defaultDuration
        : list.includes("monthly")
          ? "monthly"
          : list[0],
    });

  const offered = planDurationChoices.filter((choice) => draft.planDurations.includes(choice.value));

  return (
    <>
      <title>Membership — Settings — Gymio</title>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Expiry and renewal</CardTitle>
            <CardDescription>
              When members are flagged, and how long they can still renew after their membership ends.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Grace period"
                options={graceOptions}
                value={String(draft.graceDays)}
                onChange={(event) => update({ graceDays: Number(event.target.value) })}
                hint="How long a member can still renew after their expiry date."
              />
              <SelectField
                label="Expiry reminder"
                options={reminderOptions}
                value={String(draft.reminderDays)}
                onChange={(event) => update({ reminderDays: Number(event.target.value) })}
                hint="Members are flagged as expiring soon from this point."
              />
            </div>

            <ChoiceCards
              legend="Members in grace can"
              description={
                draft.graceDays === 0
                  ? "The grace period is off, so this has no effect right now."
                  : "Applies to members whose membership ended within the grace period."
              }
              name="grace-access"
              value={draft.graceAccess}
              onChange={(graceAccess) => update({ graceAccess })}
              options={graceAccessOptions}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan durations</CardTitle>
            <CardDescription>
              The durations you can pick when creating a plan. Custom is always available, and existing plans keep
              their duration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <CheckboxCards
              legend="Offered durations"
              name="plan-durations"
              values={draft.planDurations}
              onChange={changeDurations}
              options={planDurationChoices}
              minSelected={1}
            />
            <SelectField
              label="Default for a new plan"
              options={offered.map(({ value, label }) => ({ value, label }))}
              value={draft.defaultDuration}
              onChange={(event) => update({ defaultDuration: event.target.value })}
              className="sm:max-w-xs"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What each status means</CardTitle>
            <CardDescription>
              {db.members.length > 0
                ? "The counts use the settings above, so you can see the effect before you save."
                : "Counts appear once you add members."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              {definitions.map(({ key, label, text }) => (
                <div
                  key={key}
                  className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[9rem_minmax(0,1fr)_3rem] sm:gap-4"
                >
                  <dt className="label-mono">{label}</dt>
                  <dd className="text-sm text-muted-foreground">{text}</dd>
                  <dd className="font-mono text-sm font-bold tabular-nums sm:text-right">
                    <span className="sr-only">Members: </span>
                    {counts[key]}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <FormAlert message={error} />
        <SaveBar dirty={dirty} saving={saving} onSave={submit} onDiscard={discard} />
      </div>
    </>
  );
}