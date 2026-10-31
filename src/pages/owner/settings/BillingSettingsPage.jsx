import { Check, ReceiptText } from "lucide-react";
import { Link } from "react-router";

import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { freePlanFeatures } from "@/data/landingContent";
import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { formatDate } from "@/lib/dates";
import { formatMoney, formatNumber } from "@/lib/format";
import { isOnTeam } from "@/lib/staff";
import { isCounted } from "@/lib/payments";
import { cn } from "@/lib/utils";

export default function BillingSettingsPage() {
  const { user } = useAuth();
  const db = useDb();
  const currency = user.gym?.currency ?? "INR";

  const usage = [
    { label: "Members", value: db.members.length },
    { label: "Membership plans", value: db.plans.length },
    { label: "Staff accounts", value: db.staff.filter((member) => isOnTeam(member)).length },
    { label: "Payments recorded", value: db.payments.filter(isCounted).length },
    { label: "Announcements", value: db.announcements.length },
    { label: "Gym photos", value: db.photos.length },
  ];

  return (
    <>
      <title>Subscription and billing — Settings — Gymio</title>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your plan</CardTitle>
            <CardDescription>The Gymio plan this gym is on.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Badge>Current plan</Badge>
                <p className="mt-3 font-display text-4xl font-extrabold uppercase leading-none">Gymio Free</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatMoney(0, currency)}, for every gym. Member since {formatDate(user.createdAt.slice(0, 10))}.
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <p className="label-mono text-muted-foreground">Included</p>
              <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {freePlanFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>What this gym has right now. The free plan has no usage limits.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {usage.map((item) => (
                <div key={item.label} className="bg-card p-4">
                  <dt className="label-mono text-muted-foreground">{item.label}</dt>
                  <dd className="mt-2 font-mono text-2xl font-bold tabular-nums">{formatNumber(item.value)}</dd>
                  <dd className="label-mono mt-1 text-muted-foreground">No limit</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change plan</CardTitle>
            <CardDescription>
              Gymio has one plan, and it is free, so there is nothing to upgrade or downgrade.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing history</CardTitle>
            <CardDescription>Invoices and payments made to Gymio.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={ReceiptText}
              title="No invoices"
              text="You have never been charged, and Gymio holds no card or bank details for you."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cancel</CardTitle>
            <CardDescription>
              There is no subscription to cancel. If you want to stop using Gymio, you can delete your account. Download
              your records first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/app/settings/data" className={cn(buttonVariants({ variant: "outline" }))}>
              Go to Data and privacy
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}