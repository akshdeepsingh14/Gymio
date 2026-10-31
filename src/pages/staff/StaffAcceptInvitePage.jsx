import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, CircleCheck, Clock, LinkIcon, LoaderCircle } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormAlert, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { acceptInviteSchema } from "@/lib/validation/staffAuth";
import { acceptInvite, getInvitePreview } from "@/services/staffAuthService";

const staffPoints = [
  { n: "01", title: "Check the invitation", text: "We confirm it is still open and which gym and role it is for." },
  { n: "02", title: "Confirm it is you", text: "Type the email it was sent to, then choose your own password." },
  { n: "03", title: "Sign in", text: "Your account is separate from the owner's and limited to your role." },
];

// What to show when an invitation cannot be used.
const BLOCKED = {
  invalid: {
    icon: LinkIcon,
    title: "Link not valid",
    text: "This invitation link is incomplete, has been replaced by a newer one, or does not exist. Check that you copied the whole link, or ask your gym owner to send it again.",
  },
  expired: {
    icon: Clock,
    title: "Invitation expired",
    text: "Invitations stop working after a few days. Ask your gym owner to send a new one.",
  },
  cancelled: {
    icon: Ban,
    title: "Invitation cancelled",
    text: "The gym owner cancelled this invitation. If that is a surprise, ask them directly.",
  },
  used: {
    icon: CircleCheck,
    title: "Already used",
    text: "This invitation has already been used to create an account. You can sign in with it.",
  },
};

function BlockedInvite({ code }) {
  const info = BLOCKED[code] ?? BLOCKED.invalid;
  const Icon = info.icon;

  return (
    <AuthLayout eyebrow="Staff portal" title={info.title} points={staffPoints}>
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Icon className="mt-1 size-5 shrink-0" aria-hidden="true" />
          <p className="text-base leading-relaxed text-muted-foreground">{info.text}</p>
        </div>
        <Link to="/staff/sign-in" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          Go to staff sign in
        </Link>
      </div>
    </AuthLayout>
  );
}

function Accepted({ result }) {
  return (
    <AuthLayout
      eyebrow="Staff portal"
      title="You're in"
      description={`Your account is ready, ${result.name.split(/\s+/)[0]}.`}
      points={staffPoints}
    >
      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border text-sm">
        <div className="bg-card p-3">
          <dt className="label-mono text-muted-foreground">Gym</dt>
          <dd className="mt-1 font-semibold">{result.gymName}</dd>
        </div>
        <div className="bg-card p-3">
          <dt className="label-mono text-muted-foreground">Your role</dt>
          <dd className="mt-1 font-semibold">{result.roleLabel}</dd>
        </div>
      </dl>

      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Sign in with the email from your invitation and the password you just chose.
      </p>

      <Link to="/staff/sign-in" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
        Continue to staff sign in
      </Link>
    </AuthLayout>
  );
}

function AcceptForm({ token, invite, onBlocked, onAccepted }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { name: invite.name, phone: "", confirmEmail: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values) => {
    try {
      onAccepted(await acceptInvite(token, values));
    } catch (error) {
      // The invitation changed while the page was open: show the page for that state
      if (BLOCKED[error.code]) return onBlocked(error.code);
      if (error.code === "email_mismatch") return setError("confirmEmail", { message: error.message });
      setError("root", { message: error.message ?? "Something went wrong. Try again." });
    }
  };

  return (
    <AuthLayout
      eyebrow="Staff portal"
      title="Join the team"
      description={`${invite.invitedBy} invited you to join ${invite.gymName} as ${invite.roleLabel}.`}
      points={staffPoints}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/staff/sign-in" className="font-semibold text-foreground underline underline-offset-4">
            Staff sign in
          </Link>
        </>
      }
    >
      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border text-sm">
        <div className="bg-card p-3">
          <dt className="label-mono text-muted-foreground">Gym</dt>
          <dd className="mt-1 font-semibold">{invite.gymName}</dd>
        </div>
        <div className="bg-card p-3">
          <dt className="label-mono text-muted-foreground">Your role</dt>
          <dd className="mt-1 font-semibold">{invite.roleLabel}</dd>
        </div>
        <div className="col-span-2 bg-card p-3">
          <dt className="label-mono text-muted-foreground">Open until</dt>
          <dd className="mt-1 font-semibold">{formatDate(invite.expiresOn)}</dd>
        </div>
      </dl>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormAlert message={errors.root?.message} />

        <TextField label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />

        <TextField
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <TextField
          label="Confirm your email"
          type="email"
          autoComplete="off"
          placeholder={invite.emailHint}
          hint="Type the full address this invitation was sent to. It shows the invitation is really for you."
          error={errors.confirmEmail?.message}
          {...register("confirmEmail")}
        />

        <TextField
          label="Choose a password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
          {...register("password")}
        />

        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <LoadingButton type="submit" size="lg" className="w-full" loading={isSubmitting} loadingText="Creating account…">
          Accept invitation
        </LoadingButton>
      </form>
    </AuthLayout>
  );
}

export default function StaffAcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("invite") ?? "";
  const [state, setState] = useState({ status: "loading", invite: null, code: null, result: null });

  useEffect(() => {
    let active = true;

    getInvitePreview(token)
      .then((invite) => active && setState({ status: "ready", invite, code: null, result: null }))
      .catch((error) => active && setState({ status: "blocked", invite: null, code: error.code ?? "invalid", result: null }));

    return () => {
      active = false;
    };
  }, [token]);

  if (state.status === "loading") {
    return (
      <AuthLayout eyebrow="Staff portal" title="Checking invitation" points={staffPoints}>
        <div role="status" className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          One moment…
        </div>
      </AuthLayout>
    );
  }

  if (state.status === "blocked") return <BlockedInvite code={state.code} />;
  if (state.status === "accepted") return <Accepted result={state.result} />;

  return (
    <AcceptForm
      token={token}
      invite={state.invite}
      onBlocked={(code) => setState({ status: "blocked", invite: null, code, result: null })}
      onAccepted={(result) => setState({ status: "accepted", invite: null, code: null, result })}
    />
  );
}