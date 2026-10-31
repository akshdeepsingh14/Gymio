import { useMemo } from "react";
import { Bell } from "lucide-react";

import { FormAlert } from "@/components/common/FormFields";
import { SaveBar } from "@/components/settings/SaveBar";
import { SwitchRow } from "@/components/settings/SwitchRow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useStaffGym } from "@/hooks/useStaffGym";
import { useStaffPrefs } from "@/hooks/useStaffPrefs";
import { todayISO } from "@/lib/dates";
import { getGymSettings } from "@/lib/gymSettings";
import { buildStaffNotifications } from "@/lib/staffNotifications";
import { DEFAULT_STAFF_PREFS, saveStaffPrefs, STAFF_NOTIFICATION_KINDS } from "@/lib/staffAccount";

const KEYS = Object.keys(DEFAULT_STAFF_PREFS);

export default function StaffNotificationsPage() {
  const { user } = useStaffAuth();
  const { db, gym } = useStaffGym();
  const saved = useStaffPrefs(user.id);

  const { draft, update, dirty, saving, error, discard, submit } = useSettingsForm({
    saved,
    keys: KEYS,
    save: async (values) => saveStaffPrefs(user.id, { ...saved, ...values }),
    successMessage: "Notification choices saved.",
  });

  // Only the kinds this role can act on are offered
  const kinds = STAFF_NOTIFICATION_KINDS.filter((kind) => user.permissions.includes(kind.permission));
  const currency = gym?.currency ?? "INR";

  // The bell as it would look after saving, built by the same function the header uses
  const preview = useMemo(
    () =>
      buildStaffNotifications({
        db,
        settings: getGymSettings(gym),
        today: todayISO(),
        currency,
        permissions: user.permissions,
        prefs: draft,
      }),
    [db, gym, currency, user.permissions, draft],
  );

  return (
    <>
      <title>{`Notifications — ${user.gymName} — Gymio staff`}</title>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your notifications</CardTitle>
            <CardDescription>
              What appears under the bell in your header. Only things your role can act on are listed. These choices are
              yours alone and do not change what the owner or other staff see.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormAlert message={error} />

            <SwitchRow
              label="Show notifications in the app"
              description="The master switch. Turn it off to hide every notification below."
              checked={draft.inApp}
              onChange={(inApp) => update({ inApp })}
            />

            {kinds.length === 0 ? (
              <p className="border-t border-border pt-6 text-sm text-muted-foreground">
                Your role has no permissions that produce notifications yet. If you expected some, ask the gym owner
                to review your role.
              </p>
            ) : (
              <div className="space-y-6 border-t border-border pt-6">
                {kinds.map((kind) => (
                  <SwitchRow
                    key={kind.key}
                    label={kind.label}
                    description={kind.description}
                    checked={draft[kind.key]}
                    onChange={(value) => update({ [kind.key]: value })}
                    disabled={!draft.inApp}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What the bell will show</CardTitle>
            <CardDescription>A preview from the gym&apos;s current data and the choices above, before you save.</CardDescription>
          </CardHeader>
          <CardContent>
            {preview.length === 0 ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Bell className="size-4 shrink-0" aria-hidden="true" />
                Nothing right now.
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-sm border border-border">
                {preview.map((item) => (
                  <li key={item.id} className="p-4">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                    <p className="label-mono mt-1 text-muted-foreground">{item.time}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <SaveBar dirty={dirty} saving={saving} onSave={submit} onDiscard={discard} />
      </div>
    </>
  );
}