import { useContext } from "react";
import { StaffAuthContext } from "@/contexts/staff-auth-context";

export function useStaffAuth() {
  const context = useContext(StaffAuthContext);
  if (context === null) {
    throw new Error("useStaffAuth must be used inside <StaffAuthProvider>");
  }
  return context;
}