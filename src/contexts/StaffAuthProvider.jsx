import { useCallback, useEffect, useMemo, useState } from "react";

import { StaffAuthContext } from "./staff-auth-context";
import * as staffAuth from "@/services/staffAuthService";

// Shown on the staff sign-in page when a session ends because the gym changed something.
const NOTICES = {
  suspended: "The gym owner suspended your access, so you were signed out.",
  removed: "You are no longer on this gym's team, so you were signed out.",
  inactive: "Your account is not active, so you were signed out.",
  gone: "Your session ended. Please sign in again.",
};

/** Reads the staff session and, if it is no longer allowed, ends it and says why. */
function evaluate() {
  const result = staffAuth.resolveStaffSession();
  if (result.status === "ok") return { user: result.user, notice: null };
  if (result.status === "none") return { user: null, notice: null };

  staffAuth.endStaffSession();
  return { user: null, notice: NOTICES[result.status] ?? NOTICES.gone };
}

const sameUser = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function StaffAuthProvider({ children }) {
  const [state, setState] = useState(evaluate);

  const refresh = useCallback(() => {
    const next = evaluate();
    // Keep the same object when nothing changed, so screens do not re-render for no reason
    setState((current) => (sameUser(current.user, next.user) && current.notice === next.notice ? current : next));
  }, []);

  // Check again when the tab is used or when another tab changes staff data. This is how a
  // suspension made by the owner reaches a staff member who already has the page open.
  useEffect(() => {
    const onStorage = (event) => {
      const key = event.key;
      if (
        key === null ||
        key.startsWith("gymio-staff") ||
        key.startsWith("gymio-db") ||
        key === "gymio-demo-accounts"
      ) {
        refresh();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const signIn = useCallback(async (credentials) => {
    const user = await staffAuth.staffSignIn(credentials);
    setState({ user, notice: null });
    return user;
  }, []);

  const signOut = useCallback(async () => {
    await staffAuth.staffSignOut();
    setState({ user: null, notice: null });
  }, []);

  const value = useMemo(
    () => ({ user: state.user, notice: state.notice, signIn, signOut, refresh }),
    [state.user, state.notice, signIn, signOut, refresh],
  );

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}