import { Link, NavLink } from "react-router";

import { LogoMark } from "@/components/common/Logo";
import { navGroups } from "@/data/ownerNav";
import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { cn } from "@/lib/utils";

function NavItem({ item, collapsed, onNavigate, count = 0 }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex h-10 items-center gap-3 rounded-sm px-3 text-sm font-semibold tracking-wide transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      <Icon className="size-[1.1rem] shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}

      {count > 0 ? (
        collapsed ? (
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" aria-hidden="true" />
        ) : (
          <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-sm bg-destructive px-1 font-mono text-[0.65rem] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )
      ) : null}
    </NavLink>
  );
}

/** Used in the desktop sidebar and inside the mobile drawer. */
export function SidebarNav({ collapsed = false, onNavigate }) {
  const { user } = useAuth();
  const { accessRequests } = useDb();
  const counts = { pendingRequests: accessRequests.filter((r) => r.status === "pending").length };

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center border-b border-border px-4", collapsed && "justify-center px-0")}>
        <Link
          to="/app"
          onClick={onNavigate}
          aria-label="Gymio, overview"
          className="inline-flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogoMark decorative className="size-9" />
          {!collapsed && (
            <span aria-hidden="true" className="font-display text-[1.6rem] font-extrabold uppercase leading-none tracking-[0.02em]">
              Gymio
            </span>
          )}
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-border" aria-hidden="true" />
            ) : (
              <p className="label-mono mb-2 px-3 text-muted-foreground">{group.label}</p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavItem
                    item={item}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                    count={item.countKey ? counts[item.countKey] : 0}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="flex shrink-0 items-center gap-3 border-t border-border p-4">
          {user.gym?.logo && (
            <img src={user.gym.logo} alt="" className="size-10 shrink-0 rounded-sm border border-border object-cover" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.gymName}</p>
            <p className="label-mono mt-1 truncate text-muted-foreground">@{user.gym?.username}</p>
          </div>
        </div>
      )}
    </div>
  );
}