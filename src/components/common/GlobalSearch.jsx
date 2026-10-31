import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CornerDownLeft, FileText, Search, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { navGroups } from "@/data/ownerNav";
import { settingsNav } from "@/data/settingsNav";
import { staffSettingsNav } from "@/data/staffSettingsNav";
import { visibleStaffNav } from "@/data/staffNav";
import { useDb } from "@/hooks/useDb";
import { usePermissions } from "@/hooks/usePermissions";

const MAX_MEMBERS = 6;
const MAX_QUICK_LINKS = 8;

/** Every page this person can open, as { to, label }. Staff only get what their permissions allow. */
function pagesFor({ isOwner, base, permissions }) {
  if (isOwner) {
    return [
      ...navGroups.flatMap((group) => group.items),
      ...settingsNav.map((item) => ({ to: `${base}/settings/${item.path}`, label: `Settings: ${item.label}` })),
    ];
  }
  return [
    ...visibleStaffNav(permissions).flatMap((group) => group.items),
    ...staffSettingsNav.map((item) => ({ to: `${base}/settings/${item.path}`, label: `Settings: ${item.label}` })),
  ];
}

/**
 * The search button in the header, and the panel it opens. Also opens with Ctrl+K or Cmd+K.
 * It searches pages and members. Members only appear for people allowed to see members,
 * so the same component is safe in the owner and the staff portal.
 */
export function GlobalSearch() {
  const { isOwner, base, permissions, can } = usePermissions();
  const db = useDb();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const needle = query.trim().toLowerCase();
  const canSeeMembers = can("members.view");

  const results = useMemo(() => {
    const pages = pagesFor({ isOwner, base, permissions });

    const pageItems = (needle ? pages.filter((page) => page.label.toLowerCase().includes(needle)) : pages)
      .slice(0, needle ? pages.length : MAX_QUICK_LINKS)
      .map((page) => ({ key: page.to, to: page.to, title: page.label, hint: "Page", icon: FileText }));

    const memberItems =
      canSeeMembers && needle
        ? db.members
            .filter((member) => [member.name, member.id, member.phone, member.email].some((v) => v && v.toLowerCase().includes(needle)))
            .slice(0, MAX_MEMBERS)
            .map((member) => ({
              key: member.id,
              to: `${base}/members?member=${encodeURIComponent(member.id)}`,
              title: member.name,
              hint: member.id,
              icon: User,
            }))
        : [];

    return [...memberItems, ...pageItems];
  }, [needle, isOwner, base, permissions, canSeeMembers, db.members]);

  const changeOpen = (next) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const go = (to) => {
    changeOpen(false);
    navigate(to);
  };

  const onInputKeyDown = (event) => {
    if (event.key === "Enter" && results[0]) {
      event.preventDefault();
      go(results[0].to);
    }
  };

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setOpen(true)} aria-label="Search" aria-keyshortcuts="Control+K Meta+K">
        <Search aria-hidden="true" />
      </Button>

      <Sheet open={open} onOpenChange={changeOpen}>
        <SheetContent side="top" className="gap-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Search</SheetTitle>
            <SheetDescription>Find a page or a member.</SheetDescription>
          </SheetHeader>

          <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-5 sm:px-6">
            <div className="relative pr-14">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label="Search pages and members"
                placeholder={canSeeMembers ? "Search pages, member names, IDs or phones" : "Search pages"}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                className="h-11 pl-9"
              />
            </div>

            <p className="label-mono mt-4 text-muted-foreground">{needle ? "Results" : "Quick links"}</p>

            {results.length === 0 ? (
              <p role="status" className="mt-3 text-sm text-muted-foreground">
                Nothing matches &quot;{query.trim()}&quot;.
              </p>
            ) : (
              <ul className="mt-2 max-h-[50svh] divide-y divide-border overflow-y-auto rounded-sm border border-border">
                {results.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.key}>
                      <Link
                        to={item.to}
                        onClick={() => changeOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.title}</span>
                        <span className="label-mono shrink-0 text-muted-foreground">{item.hint}</span>
                        {index === 0 && needle && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}