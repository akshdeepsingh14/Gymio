import { CircleAlert, KeyRound, LogIn, LogOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTIVITY_LABELS, formatDateTime } from "@/lib/security";
import { cn } from "@/lib/utils";

const ICONS = { signin: LogIn, failed: CircleAlert, password: KeyRound, sessions: LogOut };

export function LoginActivityCard({ activity }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login activity</CardTitle>
        <CardDescription>
          Recent sign-ins and account changes, newest first. If you see a sign-in or a failed attempt you do not
          recognise, change your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing recorded yet. New sign-ins will appear here.</p>
        ) : (
          <ul className="divide-y divide-border rounded-sm border border-border">
            {activity.map((entry) => {
              const Icon = ICONS[entry.kind] ?? LogIn;
              const failed = entry.kind === "failed";
              return (
                <li key={entry.id} className="flex items-start gap-3 p-4">
                  <Icon
                    className={cn("mt-0.5 size-4 shrink-0", failed ? "text-destructive" : "text-muted-foreground")}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("text-sm font-semibold", failed && "text-destructive")}>
                        {ACTIVITY_LABELS[entry.kind] ?? "Account activity"}
                      </p>
                      {entry.sample && <Badge variant="outline">Sample</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.device} ·{" "}
                      <time dateTime={entry.at} className="tabular-nums">
                        {formatDateTime(entry.at)}
                      </time>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}