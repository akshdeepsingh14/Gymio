import { useState } from "react";
import { Laptop, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";

const isPhone = (device) => /iPhone|iPad|Android/.test(device);

export function SessionsCard({ sessions, currentId, onEndOthers }) {
  const [confirming, setConfirming] = useState(false);
  const [ending, setEnding] = useState(false);

  const others = sessions.filter((session) => session.id !== currentId);

  // The session in use first, then the most recently active
  const ordered = [...sessions].sort((a, b) =>
    a.id === currentId ? -1 : b.id === currentId ? 1 : b.lastActiveAt.localeCompare(a.lastActiveAt),
  );

  const confirm = async () => {
    setEnding(true);
    try {
      await onEndOthers();
      toast.success("Other sessions signed out.");
      setConfirming(false);
    } catch (error) {
      toast.error(error.message ?? "Could not sign out the other sessions.");
    } finally {
      setEnding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>
          Places where your account is signed in. Demo: sessions are kept in this browser, and entries marked Sample
          are made up to show the screen. Real devices are tracked once the backend exists.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="divide-y divide-border rounded-sm border border-border">
          {ordered.map((session) => {
            const Icon = isPhone(session.device) ? Smartphone : Laptop;
            const current = session.id === currentId;
            return (
              <li key={session.id} className="flex items-start gap-3 p-4">
                <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{session.device}</p>
                    {current && <Badge>This device</Badge>}
                    {session.sample && <Badge variant="outline">Sample</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {current ? "Active now" : `Last active ${timeAgo(session.lastActiveAt).toLowerCase()}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {others.length === 0
              ? "No other sessions."
              : `${others.length} other ${others.length === 1 ? "session" : "sessions"} signed in.`}
          </p>
          <Button variant="outline" onClick={() => setConfirming(true)} disabled={others.length === 0}>
            Sign out other sessions
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => !ending && setConfirming(open)}
        title="Sign out other sessions?"
        description="Every session except this one will be ended. Anyone using them will need to sign in again."
        confirmLabel="Sign them out"
        destructive
        loading={ending}
        onConfirm={confirm}
      />
    </Card>
  );
}