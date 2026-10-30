import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";

import { FormAlert } from "@/components/common/FormFields";
import { ChoiceCards } from "@/components/settings/ChoiceCards";
import { SaveBar } from "@/components/settings/SaveBar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { getGymSettings, memberThemeOptions } from "@/lib/gymSettings";
import { hoursRows } from "@/lib/profile";

const KEYS = ["memberTheme"];

function Fact({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="label-mono text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium">
        {children || <span className="font-normal text-muted-foreground">Not set</span>}
      </dd>
    </div>
  );
}

export default function GymDetailsPage() {
  const { user, updateGymSettings } = useAuth();
  const gym = user.gym ?? {};
  const saved = useMemo(() => getGymSettings(user.gym), [user.gym]);

  const form = useSettingsForm({
    saved,
    keys: KEYS,
    save: (values) => updateGymSettings(values),
    successMessage: "Member portal theme saved.",
  });

  const location = [gym.address, gym.locality, gym.city].filter(Boolean).join(", ");
  const rows = hoursRows(gym.hours);
  const openDays = rows.filter((row) => row.text !== "Closed").length;
  const hoursText = rows.length === 0 ? "" : `Open ${openDays} ${openDays === 1 ? "day" : "days"} a week`;

  return (
    <>
      <title>Gym details — Settings — Gymio</title>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What members see</CardTitle>
            <CardDescription>The gym information shown on the member portal. Change it in Gym profile.</CardDescription>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link to="/app/profile">
                  Gym profile
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <dl>
              <Fact label="Gym name">{user.gymName}</Fact>
              <Fact label="Username">{gym.username ? `@${gym.username}` : ""}</Fact>
              <Fact label="Location">{location}</Fact>
              <Fact label="Phone">{gym.phone}</Fact>
              <Fact label="Opening hours">{hoursText}</Fact>
              <Fact label="Description">{gym.description}</Fact>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member portal theme</CardTitle>
            <CardDescription>
              What members see the first time they open the portal on a device. They can switch it with the toggle in
              the portal header, and that choice is remembered on their device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChoiceCards
              legend="Default theme"
              name="member-theme"
              value={form.draft.memberTheme}
              onChange={(memberTheme) => form.update({ memberTheme })}
              options={memberThemeOptions}
            />
          </CardContent>
        </Card>

        <FormAlert message={form.error} />
        <SaveBar dirty={form.dirty} saving={form.saving} onSave={form.submit} onDiscard={form.discard} />
      </div>
    </>
  );
}