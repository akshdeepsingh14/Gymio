import { useState } from "react";
import { LogOut } from "lucide-react";

import { StaffPasswordCard } from "@/components/staff/StaffPasswordCard";
import { LoginActivityCard } from "@/components/settings/LoginActivityCard";
import { SessionsCard } from "@/components/settings/SessionsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { endOtherStaffSessions, getStaffSecurity } from "@/services/staffSecurityService";

export default function StaffSecurityPage() {
  const { user, signOut } = useStaffAuth();
  const [security, setSecurity] = useState(() => getStaffSecurity(user.id));

  const refresh = () => setSecurity(getStaffSecurity(user.id));
  const endOthers = async () => setSecurity(await endOtherStaffSessions(user.id));

  return (
    <>
      <title>{`Password and sessions — ${user.gymName} — Gymio staff`}</title>

      <div className="space-y-6">
        <StaffPasswordCard onChanged={refresh} />

        <SessionsCard sessions={security.sessions} currentId={security.currentSessionId} onEndOthers={endOthers} />

        <LoginActivityCard activity={security.activity} />

        <Card>
          <CardHeader>
            <CardTitle>Sign out of this device</CardTitle>
            <CardDescription>
              Ends your staff session here. Use it on a shared computer at the front desk when you step away.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={signOut}>
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}