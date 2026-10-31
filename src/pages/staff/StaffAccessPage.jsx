
import { Check, Minus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { OWNER_ONLY, PERMISSIONS } from "@/lib/staff";
import { assertCan } from "@/services/actor";

// Temporary permission tests. These buttons do not modify any data.
const CHECKS = [
  ["members.manage", "Add or edit members"],
  ["payments.adjust", "Void a payment"],
  ["updates.publish", "Publish an update"],
];

function tryAction(permission, label) {
  try {
    assertCan(permission, `Your role cannot: ${label.toLowerCase()}.`);
    toast.success(`Allowed: ${label}.`);
  } catch (caught) {
    toast.error(caught.message);
  }
}

// What the signed-in staff member's role can do, read from the same permission list
// the owner edits in Settings.
export default function StaffAccessPage() {
  const { user } = useStaffAuth();

  return (
    <>
      <title>{`My access — ${user.gymName} — Gymio staff`}</title>

      <PageHeader
        title="My access"
        description={`${user.name} · ${user.email}`}
        actions={<Badge variant="secondary">{user.roleLabel}</Badge>}
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>What your role can do</CardTitle>
          <CardDescription>
            Set by the gym owner. If something you need is missing, ask them to
            change your role&apos;s permissions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ul className="divide-y divide-border rounded-sm border border-border">
            {PERMISSIONS.map((permission) => {
              const allowed = user.permissions.includes(permission.key);

              return (
                <li
                  key={permission.key}
                  className="flex items-start gap-3 p-4"
                >
                  {allowed ? (
                    <Check
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Minus
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}

                  <div className="min-w-0">
                    <p
                      className={
                        allowed
                          ? "text-sm font-semibold"
                          : "text-sm font-semibold text-muted-foreground"
                      }
                    >
                      {permission.label}
                      <span className="sr-only">
                        {allowed ? " (allowed)" : " (not allowed)"}
                      </span>
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-sm text-muted-foreground">
            Only the gym owner can reach {OWNER_ONLY.join(", ").toLowerCase()}.
          </p>
        </CardContent>
      </Card>

      {/* Temporary permission testing section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Try the permission check</CardTitle>
          <CardDescription>
            Demo only. Each button runs the same check the services run before
            changing anything. Nothing is saved.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-2">
          {CHECKS.map(([permission, label]) => (
            <Button
              key={permission}
              variant="outline"
              onClick={() => tryAction(permission, label)}
            >
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
