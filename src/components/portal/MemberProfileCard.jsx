import { Mail, MapPin, Phone, User } from "lucide-react";

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="label-mono text-muted-foreground">{label}</dt>
        <dd className="mt-1 break-words font-semibold">{children || "Not given"}</dd>
      </div>
    </div>
  );
}

/** The member's own contact details, as the gym holds them. Read only: the gym changes them. */
export function MemberProfileCard({ profile }) {
  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="font-display text-2xl font-extrabold uppercase leading-none">
        Your details
      </h2>

      <div className="mt-4 border border-border bg-card p-4 text-sm sm:p-5">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Row icon={User} label="Name">
            {profile.name}
          </Row>
          <Row icon={Phone} label="Phone">
            {profile.phone}
          </Row>
          <Row icon={Mail} label="Email">
            {profile.email}
          </Row>
          <Row icon={MapPin} label="City / locality">
            {profile.locality}
          </Row>
        </dl>
        <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
          Something wrong? Ask the gym to update it. Your access code is never shown here.
        </p>
      </div>
    </section>
  );
}