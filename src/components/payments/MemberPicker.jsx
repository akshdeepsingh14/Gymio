import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_RESULTS = 6;

/**
 * Search box for choosing one member. A plain dropdown is unusable with
 * hundreds of members. Inactive members are left out: they must be
 * reactivated before they can pay.
 */
export function MemberPicker({ members, planNames, value, onChange, error }) {
  const [query, setQuery] = useState("");
  const selected = members.find((member) => member.id === value);

  const { results, total } = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return { results: [], total: 0 };
    const found = members
      .filter((member) => member.accessStatus !== "inactive")
      .filter((member) => [member.name, member.id, member.phone].some((v) => v && v.toLowerCase().includes(text)))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { results: found.slice(0, MAX_RESULTS), total: found.length };
  }, [members, query]);

  const choose = (id) => {
    setQuery("");
    onChange(id);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="member-search">Member</Label>

      {selected ? (
        <div className="flex items-center justify-between gap-3 rounded-sm border border-border bg-muted/50 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{selected.name}</p>
            <p className="label-mono mt-1 text-muted-foreground">
              {selected.id} · {planNames[selected.planId] ?? "Unknown plan"}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => choose("")}>
            Change
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="member-search"
              type="search"
              autoComplete="off"
              placeholder="Search by name, ID or phone"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby="member-search-help"
              className="pl-9"
            />
          </div>

          {query.trim() === "" ? (
            <p id="member-search-help" className="text-sm text-muted-foreground">
              Start typing to find a member. Inactive members are hidden.
            </p>
          ) : results.length === 0 ? (
            <p id="member-search-help" className="text-sm text-muted-foreground">
              No active member matches “{query.trim()}”.
            </p>
          ) : (
            <>
              <ul aria-label="Matching members" className="divide-y divide-border rounded-sm border border-border">
                {results.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => choose(member.id)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{member.name}</span>
                        <span className="label-mono mt-0.5 block text-muted-foreground">
                          {[member.id, member.phone].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {member.paymentStatus === "pending" && <Badge variant="destructive">Unpaid</Badge>}
                    </button>
                  </li>
                ))}
              </ul>
              <p id="member-search-help" className="text-sm text-muted-foreground">
                {total > results.length ? `Showing ${results.length} of ${total}. Keep typing to narrow it down.` : `${total} found.`}
              </p>
            </>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}