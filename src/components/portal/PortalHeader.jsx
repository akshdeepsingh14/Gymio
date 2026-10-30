import { LogOut } from "lucide-react";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";

export function PortalHeader({ gymName, onSignOut }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-extrabold uppercase leading-none">{gymName}</p>
          <p className="label-mono mt-1 text-muted-foreground">Member portal</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={onSignOut}>
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}