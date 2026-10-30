import { useCallback } from "react";

import { useAppearance } from "@/hooks/useAppearance";
import { setAppearance } from "@/lib/appearance";

/**
 * Whether the desktop sidebar is collapsed.
 * It shares one saved value with Settings > Appearance, so the two always agree.
 */
export function useSidebarCollapsed() {
  const { sidebar } = useAppearance();
  const collapsed = sidebar === "collapsed";

  const toggle = useCallback(() => {
    setAppearance({ sidebar: collapsed ? "expanded" : "collapsed" });
  }, [collapsed]);

  return { collapsed, toggle };
}