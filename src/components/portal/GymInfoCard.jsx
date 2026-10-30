import { AtSign, Clock, Globe, MapPin, Phone } from "lucide-react";

import { hoursRows } from "@/lib/profile";

// Only ever link to web addresses, whatever was saved.
const isWebLink = (value) => /^https?:\/\//i.test(value);

export function GymInfoCard({ gymName, info }) {
  const rows = hoursRows(info.hours);
  const instagram = info.instagram.replace(/^@/, "");
  const hasDetails = info.address || info.phone || info.description || info.website || instagram || rows.length > 0;

  return (
    <section aria-labelledby="gym-heading">
      <h2 id="gym-heading" className="font-display text-2xl font-extrabold uppercase leading-none">
        {gymName}
      </h2>

      <div className="mt-4 space-y-4 border border-border bg-card p-4 text-sm">
        {info.description && <p className="leading-relaxed">{info.description}</p>}

        {info.address && (
          <p className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>{info.address}</span>
          </p>
        )}
        {info.phone && (
          <p className="flex items-start gap-3">
            <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <a href={`tel:${info.phone}`} className="underline underline-offset-4">
              {info.phone}
            </a>
          </p>
        )}
        {info.website && isWebLink(info.website) && (
          <p className="flex items-start gap-3">
            <Globe className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <a
              href={info.website}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all underline underline-offset-4"
            >
              {info.website.replace(/^https?:\/\//i, "")}
            </a>
          </p>
        )}
        {instagram && (
          <p className="flex items-start gap-3">
            <AtSign className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <a
              href={`https://instagram.com/${encodeURIComponent(instagram)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              @{instagram}
            </a>
          </p>
        )}

        {rows.length > 0 && (
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dl className="grid flex-1 grid-cols-[3rem_1fr] gap-x-3 gap-y-1">
              {rows.map((row) => (
                <div key={row.key} className="contents">
                  <dt className="text-muted-foreground">{row.day}</dt>
                  <dd>{row.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {!hasDetails && (
          <p className="text-muted-foreground">The gym has not added its details yet.</p>
        )}
      </div>
    </section>
  );
}