import { Suspense } from "react";
import { NavLink, Outlet } from "react-router";

import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { settingsNav } from "@/data/settingsNav";
import { cn } from "@/lib/utils";

export default function SettingsLayout() {
  return (
    <>
      <PageHeader title="Settings" description="Choose how Gymio looks and works for your gym." />

      <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex gap-1 lg:flex-col">
            {settingsNav.map(({ path, label, icon: Icon }) => (
              <li key={path} className="shrink-0">
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    cn(
                      "flex h-10 items-center gap-3 rounded-sm px-3 text-sm font-semibold whitespace-nowrap transition-colors",
                      "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          <Suspense
            fallback={
              <div role="status" aria-label="Loading settings" className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </div>
    </>
  );
}