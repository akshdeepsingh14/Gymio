import { useState } from "react";
import { Copy, KeyRound, RefreshCw, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LoadingButton } from "@/components/common/LoadingButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCredentialState } from "@/lib/credentials";
import { formatDate, todayISO } from "@/lib/dates";
import { issueCredential, revokeCredential } from "@/services/credentialService";

const STATE_BADGE = {
  none: { label: "No code", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  expired: { label: "Expired", variant: "outline" },
  revoked: { label: "Revoked", variant: "destructive" },
};

function stateText(state, credential) {
  switch (state) {
    case "active":
      return `Valid until ${formatDate(credential.expiresOn)}. For security, the code itself cannot be shown again.`;
    case "expired":
      return `Expired on ${formatDate(credential.expiresOn)}. Create a new code if the member still needs one.`;
    case "revoked":
      return "This code was revoked. Create a new code if the member needs access again.";
    default:
      return "No code yet. Create one so this member can request access to the member portal.";
  }
}

const confirmCopy = {
  replace: {
    title: "Replace access code?",
    label: "Replace code",
    text: "The current code stops working immediately. You will see the new code once, so be ready to share it.",
  },
  revoke: {
    title: "Revoke access code?",
    label: "Revoke",
    text: "This code stops working right away. You can create a new one at any time.",
  },
};

export function CredentialPanel({ member }) {
  const [issued, setIssued] = useState(null); // { code, expiresOn }, kept only while this drawer is open
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // "replace" | "revoke"

  const state = getCredentialState(member.credential, todayISO());
  const badge = STATE_BADGE[state];
  const blockedReason =
    member.accessStatus === "inactive"
      ? "Reactivate this member to create a code."
      : member.accessStatus === "suspended"
        ? "Lift the suspension to create a code."
        : null;
  const showIssued = issued && state === "active";

  const generate = async () => {
    setBusy(true);
    try {
      const result = await issueCredential(member.id);
      setIssued(result);
      setConfirm(null);
      toast.success("Access code created.");
    } catch (error) {
      toast.error(error.message ?? "Could not create the code.");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    setBusy(true);
    try {
      await revokeCredential(member.id);
      setIssued(null);
      setConfirm(null);
      toast.success("Access code revoked.");
    } catch (error) {
      toast.error(error.message ?? "Could not revoke the code.");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(issued.code);
      toast.success("Code copied.");
    } catch {
      // The clipboard is unavailable on plain http:// pages, such as a LAN address
      toast.error("Could not copy. Select the code and copy it by hand.");
    }
  };

  const onPrimary = () => (state === "active" ? setConfirm("replace") : generate());
  const copy = confirm ? confirmCopy[confirm] : null;

  return (
    <section className="space-y-3">
      <h3 className="label-mono border-b border-border pb-2 text-muted-foreground">Access code</h3>

      <div className="flex items-center gap-3">
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{stateText(state, member.credential)}</p>

      {showIssued && (
        <div className="space-y-3 rounded-sm border-2 border-foreground p-4">
          <p className="label-mono text-muted-foreground">New access code</p>
          <p className="select-all break-all font-mono text-2xl font-bold tracking-[0.18em]">{issued.code}</p>
          <p className="text-sm text-muted-foreground">
            Copy it now and give it to {member.name} privately. It is shown only once and works until{" "}
            {formatDate(issued.expiresOn)}.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyCode}>
              <Copy aria-hidden="true" />
              Copy code
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIssued(null)}>
              Hide
            </Button>
          </div>
        </div>
      )}

      {blockedReason && <p className="text-sm text-muted-foreground">{blockedReason}</p>}

      <div className="flex flex-wrap gap-2">
        <LoadingButton
          variant="outline"
          size="sm"
          loading={busy && !confirm}
          loadingText="Creating…"
          disabled={Boolean(blockedReason) || busy}
          onClick={onPrimary}
        >
          {state === "none" ? <KeyRound aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
          {state === "none" ? "Create access code" : "Replace code"}
        </LoadingButton>

        {state === "active" && (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirm("revoke")}>
            <ShieldOff aria-hidden="true" />
            Revoke
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
        title={copy?.title ?? ""}
        description={copy?.text ?? ""}
        confirmLabel={copy?.label}
        destructive={confirm === "revoke"}
        loading={busy}
        onConfirm={confirm === "revoke" ? revoke : generate}
      />
    </section>
  );
}