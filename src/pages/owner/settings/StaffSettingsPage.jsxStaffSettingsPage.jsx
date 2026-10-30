import { RolePermissionsCard } from "@/components/settings/RolePermissionsCard";
import { StaffTeamCard } from "@/components/settings/StaffTeamCard";
import { useDb } from "@/hooks/useDb";

export default function StaffSettingsPage() {
  const db = useDb();

  return (
    <>
      <title>Staff and permissions — Settings — Gymio</title>

      <div className="space-y-6">
        <StaffTeamCard staff={db.staff} />
        <RolePermissionsCard />
      </div>
    </>
  );
}