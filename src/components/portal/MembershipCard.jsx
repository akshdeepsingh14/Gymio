import { MemberStatusBadge } from "@/components/members/MemberStatusBadge";
import { formatDate } from "@/lib/dates";

function Fact({ label, children }) {
  return (
    <div>
      <dt className="label-mono text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold">{children}</dd>
    </div>
  );
}

function daysText(daysLeft) {
  if (daysLeft === 0) return "Expires today";
  if (daysLeft > 0) return `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
  const ago = Math.abs(daysLeft);
  return `Expired ${ago} ${ago === 1 ? "day" : "days"} ago`;
}

export function MembershipCard({ data }) {
  return (
    <section aria-labelledby="membership-heading" className="border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-mono text-muted-foreground">Current plan</p>
          <h2 id="membership-heading" className="mt-1 font-display text-3xl font-extrabold uppercase leading-none">
            {data.planName}
          </h2>
        </div>
        <MemberStatusBadge {...data.standing} />
      </div>

      <p className="mt-4 font-mono text-sm font-semibold">{daysText(data.daysLeft)}</p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5 sm:grid-cols-4">
        <Fact label="Member ID">
          <span className="font-mono">{data.memberId}</span>
        </Fact>
        <Fact label="Period starts">{formatDate(data.periodStart)}</Fact>
        <Fact label="Expires">{formatDate(data.expiresOn)}</Fact>
        <Fact label="Member since">{formatDate(data.memberSince)}</Fact>
      </dl>
    </section>
  );
}