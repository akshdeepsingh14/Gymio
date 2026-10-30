import { cn } from "@/lib/utils";

export function describeStatus({ status, inGrace, expiringSoon }) {
  if (status === "inactive") return { label: "Inactive", dot: "bg-muted-foreground" };
  if (status === "suspended") return { label: "Suspended", dot: "bg-warning" };
  if (status === "expired") return inGrace ? { label: "Grace", dot: "bg-warning" } : { label: "Expired", dot: "bg-destructive" };
  if (expiringSoon) return { label: "Expiring", dot: "bg-warning" };
  return { label: "Active", dot: "bg-success" };
}

export function MemberStatusBadge(props) {
  const { label, dot } = describeStatus(props);
  return (
    <span className="label-mono inline-flex items-center gap-2">
      <span className={cn("size-2 rounded-full", dot)} aria-hidden="true" />
      {label}
    </span>
  );
}