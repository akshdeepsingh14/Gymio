import { Suspense, useState } from "react";
import { Outlet } from "react-router";

import { StaffHeader } from "@/components/staff/StaffHeader";
import { StaffSidebarNav } from "@/components/staff/StaffSidebarNav";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { cn } from "@/lib/utils";

function ContentFallback() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-6">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-16 w-2/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function StaffLayout() {
  const { collapsed, toggle } = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh">
      <meta name="robots" content="noindex" />
      <a
        href="#staff-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 border-r border-border bg-background transition-[width] duration-200 motion-reduce:transition-none lg:block",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <StaffSidebarNav collapsed={collapsed} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0 lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Main menu for the staff portal</SheetDescription>
          </SheetHeader>
          <StaffSidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <StaffHeader collapsed={collapsed} onToggleSidebar={toggle} onOpenMobileNav={() => setMobileOpen(true)} />
        <main id="staff-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Suspense fallback={<ContentFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}