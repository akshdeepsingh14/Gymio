
import {
  CircleCheck,
  CircleX,
  Clock,
  LoaderCircle,
} from "lucide-react";

import { LoadingButton } from "@/components/common/LoadingButton";
import { Button } from "@/components/ui/button";
import { Hex } from "@/components/ui/hex";
import { timeAgo } from "@/lib/format";

function Pulse() {
  return (
    <span
      className="relative flex size-2.5"
      aria-hidden="true"
    >
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/60 motion-reduce:animate-none" />
      <span className="relative inline-flex size-2.5 rounded-full bg-foreground" />
    </span>
  );
}

export function RequestStatusCard({
  request,
  onCancel,
  cancelling,
  onDismiss,
}) {
  if (request.status === "approved") {
    return (
      <div
        role="status"
        className="flex items-center gap-4 border border-border bg-card p-5"
      >
        <Hex className="size-12">
          <CircleCheck
            className="size-5"
            aria-hidden="true"
          />
        </Hex>

        <div>
          <p className="font-semibold">Approved</p>

          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Opening your member area
          </p>
        </div>
      </div>
    );
  }

  if (request.status === "rejected") {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-4 border border-border bg-card p-5">
          <Hex outline className="size-12 shrink-0">
            <CircleX
              className="size-5"
              aria-hidden="true"
            />
          </Hex>

          <div>
            <p className="font-semibold">
              {request.gymName} did not approve this request
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Speak to the gym if you think this is a mistake.
              They can send you a new access code.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={onDismiss}
        >
          Back to sign-in
        </Button>
      </div>
    );
  }

  // Handle expired and revoked requests.
  if (
    request.status === "expired" ||
    request.status === "revoked"
  ) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-4 border border-border bg-card p-5">
          <Hex outline className="size-12 shrink-0">
            <CircleX
              className="size-5"
              aria-hidden="true"
            />
          </Hex>

          <div>
            <p className="font-semibold">
              {request.status === "expired"
                ? `${request.gymName} did not answer in time`
                : `${request.gymName} withdrew this approval`}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {request.status === "expired"
                ? "The request closed by itself. Enter your details again to send a new one."
                : "Speak to the gym if you think this is a mistake."}
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={onDismiss}
        >
          Back to sign-in
        </Button>
      </div>
    );
  }

  // Pending request.
  return (
    <div className="space-y-5">
      <div
        role="status"
        aria-live="polite"
        className="border border-border bg-card p-5"
      >
        <div className="flex items-center gap-4">
          <Hex className="size-12 shrink-0">
            <Clock
              className="size-5"
              aria-hidden="true"
            />
          </Hex>

          <div className="min-w-0">
            <p className="font-semibold">
              Hi {request.firstName}, your request is with{" "}
              {request.gymName}
            </p>

            <p className="label-mono mt-1 text-muted-foreground">
              Sent {timeAgo(request.requestedAt)}
            </p>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <Pulse />
          Waiting for the gym. This page updates by itself.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        You can close this page. Your request stays open, and
        when you come back to this address you will see the
        result.
      </p>

      <LoadingButton
        variant="outline"
        size="lg"
        className="w-full"
        onClick={onCancel}
        loading={cancelling}
        loadingText="Cancelling…"
      >
        Cancel request
      </LoadingButton>
    </div>
  );
}
