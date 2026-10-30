import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { LoginActivityCard } from "@/components/settings/LoginActivityCard";
import { SessionsCard } from "@/components/settings/SessionsCard";
import { SwitchRow } from "@/components/settings/SwitchRow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { endOtherSessions, getSecurity, setTwoFactor } from "@/services/securityService";

const linkClass = "font-semibold text-foreground underline underline-offset-4";

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [security, setSecurity] = useState(() => getSecurity(user.id));
  const [savingTwoFactor, setSavingTwoFactor] = useState(false);

  const refresh = () => setSecurity(getSecurity(user.id));

  const endOthers = async () => setSecurity(await endOtherSessions(user.id));

  const changeTwoFactor = async (enabled) => {
    setSavingTwoFactor(true);
    try {
      setSecurity(await setTwoFactor(user.id, enabled));
      toast.success(enabled ? "Two-factor switch turned on (demo)." : "Two-factor switch turned off.");
    } catch (error) {
      toast.error(error.message ?? "Could not save. Try again.");
    } finally {
      setSavingTwoFactor(false);
    }
  };

  return (
    <>
      <title>Security — Settings — Gymio</title>

      <div className="space-y-6">
        <ChangePasswordCard ownerId={user.id} onChanged={refresh} />

        <SessionsCard sessions={security.sessions} currentId={security.currentSessionId} onEndOthers={endOthers} />

        <LoginActivityCard activity={security.activity} />

        <Card>
          <CardHeader>
            <CardTitle>Two-factor authentication</CardTitle>
            <CardDescription>
              An extra code from an authenticator app when you sign in, on top of your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div role="note" className="rounded-sm border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              Demo only: this switch is saved, but sign-in does not ask for a code yet, so it does not protect your
              account. Real authenticator codes need the backend.
            </div>
            <SwitchRow
              label="Require a code at sign-in"
              description={security.twoFactor ? "On, in this demo." : "Off."}
              checked={security.twoFactor}
              onChange={changeTwoFactor}
              disabled={savingTwoFactor}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account recovery</CardTitle>
            <CardDescription>How you get back in if you forget your password.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <div className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                <dt className="label-mono">Recovery email</dt>
                <dd className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{user.email}</span>. Change it in{" "}
                  <Link to="/app/profile" className={linkClass}>
                    Gym profile
                  </Link>
                  .
                </dd>
              </div>
              <div className="grid gap-1 py-3 last:pb-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                <dt className="label-mono">How it works</dt>
                <dd className="text-sm text-muted-foreground">
                  Sign out, then choose Forgot password on the sign-in page. A reset link goes to your recovery email.
                  In this demo no email is sent, and the page gives you a button to open the reset form.
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}