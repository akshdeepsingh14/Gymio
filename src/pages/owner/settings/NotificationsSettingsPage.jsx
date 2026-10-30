import { useMemo } from "react";
import { Link } from "react-router";
import { BellOff } from "lucide-react";

import { FormAlert } from "@/components/common/FormFields";
import { CheckboxCards } from "@/components/settings/CheckboxCards";
import { ChoiceCards } from "@/components/settings/ChoiceCards";
import { SaveBar } from "@/components/settings/SaveBar";
import { SwitchRow } from "@/components/settings/SwitchRow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { todayISO } from "@/lib/dates";
import { emailEventOptions, emailFrequencyOptions, getGymSettings } from "@/lib/gymSettings";
import { buildNotifications } from "@/lib/notifications";

const KEYS = [
  "notifyInApp",
  "notifyExpiry",
  "notifyAccessRequests",
  "notifyPayments",
  "notifyAnnouncements",
  "emailEnabled",
  "emailEvents",
  "emailFrequency",
];

const linkClass = "font-semibold text-foreground underline underline-offset-4";

export default function NotificationsSettingsPage() {
  const { user, updateGymSettings } = useAuth();
  const db = useDb();
  const saved = useMemo(() => getGymSettings(user.gym), [user.gym]);

  const { draft, update, dirty, saving, error, discard, submit } = useSettingsForm({
    saved,
    keys: KEYS,
    save: (values) => updateGymSettings(values),
    successMessage: "Notification settings saved.",
  });

  const currency = user.gym?.currency ?? "INR";

  // The settings as they would be after saving, run through the same builder the header bell uses
  const preview = useMemo(() => {
    const live = getGymSettings({ ...user.gym, ...draft });
    return buildNotifications({ db, settings: live, today: todayISO(), currency });
  }, [db, user.gym, draft, currency]);

  const inAppOff = !draft.notifyInApp;

  return (
    <>
      <title>Notifications — Settings — Gymio</title>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>In-app notifications</CardTitle>
            <CardDescription>
              What appears under the bell in the header. A switch that is off stops that kind of notification from
              being created at all.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SwitchRow
              label="Show notifications in the app"
              description="The master switch. Turn it off to hide every notification below."
              checked={draft.notifyInApp}
              onChange={(notifyInApp) => update({ notifyInApp })}
            />

            <div className="space-y-6 border-t border-border pt-6">
              <SwitchRow
                label="Expiry reminders"
                description={
                  <>
                    One reminder when memberships are within {saved.reminderDays} days of expiring. Change the number
                    in{" "}
                    <Link to="/app/settings/membership" className={linkClass}>
                      Membership settings
                    </Link>
                    .
                  </>
                }
                checked={draft.notifyExpiry}
                onChange={(notifyExpiry) => update({ notifyExpiry })}
                disabled={inAppOff}
              />
              <SwitchRow
                label="New access requests"
                description="When a member asks to open their member area. Stays until you approve or reject it."
                checked={draft.notifyAccessRequests}
                onChange={(notifyAccessRequests) => update({ notifyAccessRequests })}
                disabled={inAppOff}
              />
              <SwitchRow
                label="Payment confirmations"
                description="When a payment is recorded. Kept for 3 days."
                checked={draft.notifyPayments}
                onChange={(notifyPayments) => update({ notifyPayments })}
                disabled={inAppOff}
              />
              <SwitchRow
                label="Announcements"
                description="When you publish an announcement. Kept for 3 days."
                checked={draft.notifyAnnouncements}
                onChange={(notifyAnnouncements) => update({ notifyAnnouncements })}
                disabled={inAppOff}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What the bell will show</CardTitle>
            <CardDescription>
              A preview built from your current data and the choices above, before you save.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {preview.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <BellOff className="size-4 shrink-0" aria-hidden="true" />
                {inAppOff ? "Nothing. In-app notifications are off." : "Nothing right now."}
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-sm border border-border">
                {preview.map((item) => (
                  <li key={item.id} className="p-3">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                    <p className="label-mono mt-1 text-muted-foreground">{item.time}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>
              Choose what Gymio should email you about. Email works separately from the in-app switches above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div role="note" className="rounded-sm border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              Demo only: Gymio does not send real emails yet. Your choices are saved, and the backend will use them
              when it is built.
            </div>

            <SwitchRow
              label="Send me emails"
              description={
                <>
                  Emails go to {user.email}. Change it in{" "}
                  <Link to="/app/profile" className={linkClass}>
                    Gym profile
                  </Link>
                  .
                </>
              }
              checked={draft.emailEnabled}
              onChange={(emailEnabled) => update({ emailEnabled })}
            />

            {draft.emailEnabled && (
              <div className="space-y-8 border-t border-border pt-6">
                <CheckboxCards
                  legend="Email me about"
                  name="email-events"
                  values={draft.emailEvents}
                  onChange={(emailEvents) => update({ emailEvents })}
                  options={emailEventOptions}
                  minSelected={1}
                />
                <ChoiceCards
                  legend="How often"
                  name="email-frequency"
                  value={draft.emailFrequency}
                  onChange={(emailFrequency) => update({ emailFrequency })}
                  options={emailFrequencyOptions}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <FormAlert message={error} />
        <SaveBar dirty={dirty} saving={saving} onSave={submit} onDiscard={discard} />
      </div>
    </>
  );
}