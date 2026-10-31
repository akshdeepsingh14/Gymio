import { useLocation } from "react-router";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { GlobalSearch } from "@/components/common/GlobalSearch";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { StaffNotificationsMenu } from "@/components/staff/StaffNotificationsMenu";
import { StaffUserMenu } from "@/components/staff/StaffUserMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { allStaffNavItems } from "@/data/staffNav";
import { useStaffAuth } from "@/hooks/useStaffAuth";

function usePageTitle() {
  const { pathname } = useLocation();
  const match = allStaffNavItems.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));
  return match?.label ?? "Overview";
}

export function StaffHeader({ collapsed, onToggleSidebar, onOpenMobileNav }) {
  const title = usePageTitle();
  const { user } = useStaffAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
      <Button variant="outline" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation menu">
        <Menu aria-hidden="true" />
      </Button>

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
        <div className="hidden min-w-0 text-right md:block">
          <p className="max-w-48 truncate text-sm font-semibold">{user.gymName}</p>
          <Badge variant="secondary" className="mt-0.5">
            {user.roleLabel}
          </Badge>
        </div>
        <GlobalSearch />
        <StaffNotificationsMenu />
        <ThemeToggle />
        <StaffUserMenu />
      </div>
    </header>
  );
}