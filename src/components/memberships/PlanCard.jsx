import { Archive, ArchiveRestore, Check, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { formatDuration } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PlanCard({ plan, currency, memberCount, onEdit, onArchive, onRestore }) {
  const archived = plan.status === "archived";

  return (
    <Card className={cn("h-full", archived && "opacity-70")}>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{formatDuration(plan.duration)}</CardDescription>
        <CardAction>
          <Badge variant={archived ? "secondary" : "outline"}>{archived ? "Archived" : "Active"}</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <p className="font-display text-5xl font-extrabold leading-none">
          {formatMoney(plan.price, currency)}
        </p>

        {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}

        {plan.benefits?.length > 0 && (
          <ul className="space-y-2 text-sm">
            {plan.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-2">
        <p className="label-mono text-muted-foreground">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(plan)}>
            <Pencil aria-hidden="true" />
            Edit
          </Button>
          {archived ? (
            <Button variant="outline" size="sm" onClick={() => onRestore(plan)}>
              <ArchiveRestore aria-hidden="true" />
              Restore
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onArchive(plan)}>
              <Archive aria-hidden="true" />
              Archive
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}