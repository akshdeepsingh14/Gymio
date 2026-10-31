
import { useEffect, useState } from "react";

import { Link, Navigate, useNavigate } from "react-router";
import { toast } from "sonner";

import { AccessForm } from "@/components/members/AccessForm";
import { IdentityConfirm } from "@/components/members/IdentityConfirm";
import { MemberShell } from "@/components/members/MemberShell";
import { RequestStatusCard } from "@/components/members/RequestStatusCard";

import { useRequestStatus } from "@/hooks/useRequestStatus";

import {
  cancelRequest,
  claimSession,
  clearSessionNotice,
  dismissRequest,
  getMemberSession,
  getSessionNotice,
  requestAccess,
} from "@/services/accessService";

const STATUS_TITLES = {
  pending: "Waiting for approval",
  approved: "You're in",
  rejected: "Not approved",
  expired: "Request expired",
  revoked: "Access withdrawn",
};

const NOTICE_TEXT = {
  revoked: (gym) =>
    `${gym} withdrew your approval, so you were signed out. Speak to the gym, or send a new request below.`,
  deactivated: (gym) =>
    `${gym} has deactivated your membership, so you were signed out. Speak to the gym to get back in.`,
};

const footer = (
  <>
    Run a gym?{" "}
    <Link
      to="/sign-in"
      className="font-semibold text-foreground underline underline-offset-4"
    >
      Owner sign-in
    </Link>
    {" · "}
    Part of the team?{" "}
    <Link
      to="/staff/sign-in"
      className="font-semibold text-foreground underline underline-offset-4"
    >
      Staff sign-in
    </Link>
  </>
);

export default function MemberEntryPage() {
  const navigate = useNavigate();
  const { request, refresh } = useRequestStatus();

  const [existing] = useState(() => getMemberSession());

  // Why the gym ended an earlier session, if it did.
  // Read after getMemberSession, which may have just written it.
  const [notice, setNotice] = useState(() => getSessionNotice());

  // The notice is shown once. Keep the copy in state,
  // then clear the stored one.
  useEffect(() => {
    clearSessionNotice();
  }, []);

  // Memory only, never stored.
  const [identified, setIdentified] = useState(null);

  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const status = request?.status;

  // Approved: turn the request into a signed-in member and go in.
  useEffect(() => {
    if (status !== "approved") return;

    try {
      claimSession();
      navigate("/member/home", { replace: true });
    } catch {
      refresh();
    }
  }, [status, navigate, refresh]);

  if (existing) {
    return <Navigate to="/member/home" replace />;
  }

  const handleConfirm = async () => {
    setSending(true);
    setError("");

    try {
      await requestAccess({
        username: identified.username,
        code: identified.code,
      });

      setIdentified(null);
      refresh();

      toast.success("Request sent to your gym.");
    } catch (err) {
      setError(
        err.message ?? "Something went wrong. Try again."
      );
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);

    try {
      await cancelRequest();
      refresh();

      toast("Request cancelled.");
    } finally {
      setCancelling(false);
    }
  };

  const handleDismiss = () => {
    dismissRequest();
    refresh();
  };

  const handleBack = () => {
    setIdentified(null);
    setError("");
  };

  // Display the status card for all supported request statuses.
  if (request && STATUS_TITLES[status]) {
    return (
      <MemberShell
        title={STATUS_TITLES[status]}
        footer={footer}
      >
        <RequestStatusCard
          request={request}
          onCancel={handleCancel}
          cancelling={cancelling}
          onDismiss={handleDismiss}
        />
      </MemberShell>
    );
  }

  // Display a one-time notice if the gym ended an earlier session.
  const noticeBanner =
    notice && NOTICE_TEXT[notice.reason] ? (
      <div
        role="alert"
        className="flex items-start justify-between gap-3 border border-border bg-card p-4 text-sm"
      >
        <p>
          {NOTICE_TEXT[notice.reason](
            notice.gymName ?? "Your gym"
          )}
        </p>

        <button
          type="button"
          onClick={() => setNotice(null)}
          className="shrink-0 font-semibold underline underline-offset-4"
        >
          Dismiss
        </button>
      </div>
    ) : null;

  if (identified) {
    return (
      <MemberShell
        title="Is this you?"
        description="Check these details before you send your request."
        footer={footer}
      >
        <IdentityConfirm
          preview={identified.preview}
          sending={sending}
          error={error}
          onConfirm={handleConfirm}
          onBack={handleBack}
        />
      </MemberShell>
    );
  }

  return (
    <MemberShell
      title="Member sign-in"
      description="Enter your gym's username and the access code the gym gave you."
      footer={footer}
    >
      <div className="space-y-5">
        {noticeBanner}

        <AccessForm onIdentified={setIdentified} />
      </div>
    </MemberShell>
  );
}
