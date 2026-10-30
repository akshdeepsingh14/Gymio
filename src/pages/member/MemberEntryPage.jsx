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
  dismissRequest,
  getMemberSession,
  requestAccess,
} from "@/services/accessService";

const STATUS_TITLES = {
  pending: "Waiting for approval",
  approved: "You're in",
  rejected: "Not approved",
};

const footer = (
  <>
    Run a gym?{" "}
    <Link to="/sign-in" className="font-semibold text-foreground underline underline-offset-4">
      Owner sign-in
    </Link>
  </>
);

export default function MemberEntryPage() {
  const navigate = useNavigate();
  const { request, refresh } = useRequestStatus();

  const [existing] = useState(() => getMemberSession());
  const [identified, setIdentified] = useState(null); // { username, code, preview }. Memory only, never stored.
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

  if (existing) return <Navigate to="/member/home" replace />;

  const handleConfirm = async () => {
    setSending(true);
    setError("");
    try {
      await requestAccess({ username: identified.username, code: identified.code });
      setIdentified(null);
      refresh();
      toast.success("Request sent to your gym.");
    } catch (err) {
      setError(err.message ?? "Something went wrong. Try again.");
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

  if (request && STATUS_TITLES[status]) {
    return (
      <MemberShell title={STATUS_TITLES[status]} footer={footer}>
        <RequestStatusCard
          request={request}
          onCancel={handleCancel}
          cancelling={cancelling}
          onDismiss={handleDismiss}
        />
      </MemberShell>
    );
  }

  if (identified) {
    return (
      <MemberShell title="Is this you?" description="Check these details before you send your request." footer={footer}>
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
      <AccessForm onIdentified={setIdentified} />
    </MemberShell>
  );
}