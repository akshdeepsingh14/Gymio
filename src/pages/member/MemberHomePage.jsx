import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { Ban, Clock, TriangleAlert } from "lucide-react";

import { GallerySection } from "@/components/portal/GallerySection";
import { GymInfoCard } from "@/components/portal/GymInfoCard";
import { MemberProfileCard } from "@/components/portal/MemberProfileCard";
import { MembershipCard } from "@/components/portal/MembershipCard";
import { PaymentsSection } from "@/components/portal/PaymentsSection";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalNotice } from "@/components/portal/PortalNotice";
import { PortalReceiptSheet } from "@/components/portal/PortalReceiptSheet";
import { UpdatesSection } from "@/components/portal/UpdatesSection";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortal } from "@/hooks/usePortal";
import { useTheme } from "@/hooks/useTheme";
import { formatDate } from "@/lib/dates";
import { endMemberSession } from "@/services/accessService";

function PortalSkeleton() {
  return (
    <div role="status" aria-label="Loading your membership" className="space-y-5">
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function renewalHelp(info) {
  return info.phone
    ? `Visit the gym or call ${info.phone} to renew. Once the gym records your renewal, this page updates.`
    : "Visit the gym front desk to renew. Once the gym records your renewal, this page updates.";
}

const graceLeftText = (days) =>
  days === 0 ? "today is the last day" : `${days} ${days === 1 ? "day" : "days"} left`;

function Notices({ data }) {
  if (data.access === "suspended") {
    return (
      <PortalNotice icon={Ban} tone="danger" title="Your access is paused">
        The gym has paused your access. Speak to the gym to find out why and how to get it back.
      </PortalNotice>
    );
  }

  if (data.access === "ended") {
    return (
      <PortalNotice icon={Clock} tone="danger" title="Your membership has ended">
        It expired on {formatDate(data.expiresOn)} and the grace period finished on {formatDate(data.graceEndsOn)}.{" "}
        {renewalHelp(data.gymInfo)}
      </PortalNotice>
    );
  }

  return (
    <>
      {data.access === "grace" && (
        <PortalNotice icon={TriangleAlert} tone="warning" title="Your membership has expired">
          You are in the grace period. Renew by {formatDate(data.graceEndsOn)} ({graceLeftText(data.graceDaysLeft)}) to
          keep your access. {renewalHelp(data.gymInfo)}
        </PortalNotice>
      )}
      {data.access === "full" && data.standing.expiringSoon && (
        <PortalNotice icon={Clock} tone="warning" title="Your membership ends soon">
          {data.daysLeft === 0
            ? "It ends today."
            : `It ends in ${data.daysLeft} ${data.daysLeft === 1 ? "day" : "days"}, on ${formatDate(data.expiresOn)}.`}{" "}
          {renewalHelp(data.gymInfo)}
        </PortalNotice>
      )}

      {data.access === "grace-limited" && (
        <PortalNotice icon={TriangleAlert} tone="warning" title="Your membership has expired">
          You are in the grace period, and the gym limits this page until you renew. Renew by{" "}
          {formatDate(data.graceEndsOn)} ({graceLeftText(data.graceDaysLeft)}). Your payments, updates and photos come
          back once the gym records your renewal. {renewalHelp(data.gymInfo)}
        </PortalNotice>
      )}
      {data.paymentPending && (
        <PortalNotice icon={Clock} tone="warning" title="Payment pending">
          Your first payment has not been recorded yet. Please pay at the gym desk.
        </PortalNotice>
      )}
    </>
  );
}

export default function MemberHomePage() {
  const navigate = useNavigate();
  const { status, data } = usePortal();
  const { setFallbackTheme } = useTheme();
  const [receipt, setReceipt] = useState({ open: false, value: null });

  // The gym's default theme applies until this device picks its own. Leaving the portal puts it back.
  const defaultTheme = data?.defaultTheme;
  useEffect(() => {
    if (!defaultTheme) return;
    setFallbackTheme(defaultTheme);
    return () => setFallbackTheme(null);
  }, [defaultTheme, setFallbackTheme]);

  if (status === "signed-out") return <Navigate to="/member" replace />;

  const signOut = () => {
    endMemberSession();
    navigate("/member", { replace: true });
  };

  // ended / suspended: notice and gym info only
  const blocked = data && (data.access === "ended" || data.access === "suspended");
  // grace-limited: the membership card is shown, but not payments, updates or photos
  const limited = data?.access === "grace-limited";

  return (
    <div className="flex min-h-svh flex-col">
      <title>{data ? `${data.gymName} — Gymio` : "Member portal — Gymio"}</title>
      <meta name="robots" content="noindex" />

      <PortalHeader gymName={data?.gymName ?? "Gymio"} onSignOut={signOut} />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        {status === "loading" || !data ? (
          <PortalSkeleton />
        ) : (
          <>
            <h1 className="text-[clamp(2.5rem,8vw,3.75rem)] font-extrabold">Hi, {data.firstName}</h1>

            <div className="space-y-3">
              <Notices data={data} />
            </div>

            {!blocked && <MembershipCard data={data} />}

            {!blocked && !limited && (
              <>
                <PaymentsSection
                  payments={data.payments}
                  currency={data.currency}
                  onReceipt={(value) => setReceipt({ open: true, value })}
                />
                <UpdatesSection items={data.announcements} />
                <GallerySection photos={data.photos} />
                <MemberProfileCard profile={data.profile} />
              </>
            )}

            <GymInfoCard gymName={data.gymName} info={data.gymInfo} />
          </>
        )}
      </main>

      <footer className="border-t border-border px-4 py-5 text-center">
        <p className="label-mono text-muted-foreground">Powered by Gymio</p>
      </footer>

      <PortalReceiptSheet
        open={receipt.open}
        onOpenChange={(open) => setReceipt((current) => ({ ...current, open }))}
        receipt={receipt.value}
      />
    </div>
  );
}