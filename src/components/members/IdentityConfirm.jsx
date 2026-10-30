import { FormAlert } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";

function Standing({ standing }) {
  if (standing.status === "active") {
    return <p>Your membership is active until {formatDate(standing.expiresOn)}.</p>;
  }
  if (standing.inGrace) {
    return (
      <p>
        Your membership ended on {formatDate(standing.expiresOn)}. You are inside the renewal window until{" "}
        {formatDate(standing.graceEndsOn)}. You can request access now, and ask the gym to renew you.
      </p>
    );
  }
  return (
    <p>
      Your membership ended on {formatDate(standing.expiresOn)} and the renewal window has closed. Ask the gym to
      renew your membership, then come back.
    </p>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-sm last:border-b-0">
      <dt className="label-mono text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium">{children}</dd>
    </div>
  );
}

export function IdentityConfirm({ preview, sending, error, onConfirm, onBack }) {
  const { standing } = preview;

  return (
    <div className="space-y-5">
      <FormAlert message={error} />

      <div className="border border-border bg-card p-5">
        <p className="font-display text-4xl font-extrabold uppercase leading-none">Hi, {preview.firstName}</p>
        <dl className="mt-4">
          <Row label="Gym">{preview.gymName}</Row>
          <Row label="Member ID">
            <span className="font-mono">{preview.memberId}</span>
          </Row>
          <Row label="Plan">{preview.planName}</Row>
        </dl>
        <div className="mt-4 text-sm text-muted-foreground">
          <Standing standing={standing} />
          {preview.hasPending && standing.canRequest && (
            <p className="mt-2">A request from you is already waiting. Sending again will not create a second one.</p>
          )}
        </div>
      </div>

      {standing.canRequest && (
        <LoadingButton size="lg" className="w-full" onClick={onConfirm} loading={sending} loadingText="Sending…">
          Yes, that's me. Request access
        </LoadingButton>
      )}

      <Button type="button" variant="outline" size="lg" className="w-full" onClick={onBack} disabled={sending}>
        {standing.canRequest ? "Not me" : "Back"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Your gym will see this request and decide whether to approve it. Nobody gets in until they do.
      </p>
    </div>
  );
}