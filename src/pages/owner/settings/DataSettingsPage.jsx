import { useMemo } from "react";
import { Link } from "react-router";

import { AuditLogCard } from "@/components/settings/AuditLogCard";
import { DeleteAccountCard } from "@/components/settings/DeleteAccountCard";
import { ExportCard } from "@/components/settings/ExportCard";
import { RetentionCard } from "@/components/settings/RetentionCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { getDataPolicy } from "@/lib/dataPrivacy";

const STORED = [
  "Your gym profile, plans and settings",
  "For each member: name, member ID, plan and dates. Email, phone, locality and notes only if you enter them",
  "Payments you record, with receipt numbers, and the audit log of changes",
  "Staff names and emails, and your announcements and photos",
];

const NOT_STORED = [
  "Card numbers, bank details or UPI PINs. Gymio records payments you enter and does not verify them",
  "Member passwords. Members sign in with an access code you give them",
  "Anything about your members you did not type in yourself",
];

const linkClass = "font-semibold text-foreground underline underline-offset-4";

export default function DataSettingsPage() {
  const { user } = useAuth();
  const db = useDb();
  const currency = user.gym?.currency ?? "INR";
  const policy = useMemo(() => getDataPolicy(db.dataPolicy), [db.dataPolicy]);

  return (
    <>
      <title>Data and privacy — Settings — Gymio</title>

      <div className="space-y-6">
        <ExportCard db={db} user={user} currency={currency} />

        <Card>
          <CardHeader>
            <CardTitle>Privacy information</CardTitle>
            <CardDescription>
              What Gymio keeps for your gym, in plain words. Only you can see and export it. The full{" "}
              <Link to="/privacy" className={linkClass}>
                privacy policy
              </Link>{" "}
              is written before Gymio handles real member data.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="label-mono text-muted-foreground">Gymio stores</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                {STORED.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label-mono text-muted-foreground">Gymio does not store</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                {NOT_STORED.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground md:col-span-2">
              Demo: all of this is kept in this browser only. Nothing is sent to a server.
            </p>
          </CardContent>
        </Card>

        <RetentionCard policy={policy} members={db.members} />
        <AuditLogCard entries={db.auditLog} currency={currency} />
        <DeleteAccountCard request={db.deletionRequest} />
      </div>
    </>
  );
}