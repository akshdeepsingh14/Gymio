import { Hammer } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { useStaffAuth } from "@/hooks/useStaffAuth";

export default function StaffSectionPage({ title, stage }) {
  const { user } = useStaffAuth();

  return (
    <>
      <title>{`${title} — ${user.gymName} — Gymio staff`}</title>
      <PageHeader title={title} description={`Your ${user.roleLabel.toLowerCase()} role can open this section.`} />
      <div className="mt-8">
        <EmptyState
          icon={Hammer}
          title="Screen coming next"
          text={`The staff version of ${title.toLowerCase()} is built in ${stage}. The permission check on this page already works.`}
        />
      </div>
    </>
  );
}