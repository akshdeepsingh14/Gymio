import { Megaphone } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/dates";

/** One announcement, as a member sees it. The owner's preview uses this too. */
export function UpdateItem({ item }) {
  return (
    <li className="border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="min-w-0 break-words font-semibold">{item.title}</p>
        <p className="label-mono text-muted-foreground">{formatDate(item.publishedOn)}</p>
      </div>
      <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
        {item.excerpt}
      </p>
    </li>
  );
}

export function UpdatesSection({ items }) {
  return (
    <section aria-labelledby="updates-heading">
      <h2 id="updates-heading" className="font-display text-2xl font-extrabold uppercase leading-none">
        Gym updates
      </h2>

      {items.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Megaphone}
          title="Nothing posted"
          text="Announcements from your gym will show up here."
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <UpdateItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}