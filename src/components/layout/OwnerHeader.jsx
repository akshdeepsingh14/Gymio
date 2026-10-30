import { useLocation } from "react-router";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { allNavItems } from "@/data/ownerNav";

function usePageTitle() {
  const { pathname } = useLocation();
  const match = allNavItems.find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  );
  return match?.label ?? "Overview";
}

export function OwnerHeader({ collapsed, onToggleSidebar, onOpenMobileNav }) {
  const title = usePageTitle();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
      {/* Mobile: opens the drawer */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
      >
        <Menu aria-hidden="true" />
      </Button>

      {/* Desktop: collapses the sidebar */}
      <Button
        variant="outline"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={onToggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
      </Button>

      <p className="label-mono truncate">{title}</p>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <NotificationsMenu />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}