import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import * as authService from "@/services/authService";
import { logProfileChange, logSettingsChange } from "@/services/settingsAuditService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getSessionUser());

  // Keep tabs in sync (sign out in one tab signs out the others)
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === null || event.key.startsWith("gymio-demo")) {
        setUser(authService.getSessionUser());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const userId = user?.id;

  const signIn = useCallback(async (credentials) => {
    const next = await authService.signIn(credentials);
    setUser(next);
    return next;
  }, []);

  const signUp = useCallback(async (details) => {
    const next = await authService.signUp(details);
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  const completeOnboarding = useCallback(
    async (data) => {
      const next = await authService.completeOnboarding(userId, data);
      setUser(next);
      return next;
    },
    [userId],
  );

  const updateProfile = useCallback(
    async (data) => {
      const before = authService.getSessionUser();
      const next = await authService.updateProfile(userId, data);
      logProfileChange(before, next);
      setUser(next);
      return next;
    },
    [userId],
  );

  const updateGymSettings = useCallback(
    async (patch) => {
      const before = authService.getSessionUser();
      const next = await authService.updateGymSettings(userId, patch);
      logSettingsChange(before, next);
      setUser(next);
      return next;
    },
    [userId],
  );

  const value = useMemo(
    () => ({ user, signIn, signUp, signOut, completeOnboarding, updateProfile, updateGymSettings }),
    [user, signIn, signUp, signOut, completeOnboarding, updateProfile, updateGymSettings],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}