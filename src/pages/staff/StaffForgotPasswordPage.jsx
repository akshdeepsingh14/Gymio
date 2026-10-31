import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormAlert, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { requestStaffPasswordReset } from "@/services/staffAuthService";

export default function StaffForgotPasswordPage() {
  const [sentTo, setSentTo] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }) => {
    try {
      await requestStaffPasswordReset(email);
      setSentTo(email);
    } catch {
      setError("root", { message: "Something went wrong. Try again." });
    }
  };

  if (sentTo) {
    return (
      <AuthLayout eyebrow="Staff portal" title="Check your email">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <MailCheck className="mt-1 size-5 shrink-0" aria-hidden="true" />
            <p className="text-base leading-relaxed text-muted-foreground">
              If a staff account exists for <span className="font-semibold text-foreground">{sentTo}</span>, a reset
              link is on its way.
            </p>
          </div>

          <div className="border border-dashed border-border p-4">
            <p className="label-mono">Demo build</p>
            <p className="mt-2 text-sm text-muted-foreground">
              No email is sent in the demo. Staff password reset is switched on together with staff accounts, in the
              next build step.
            </p>
          </div>

          <Link to="/staff/sign-in" className="inline-block text-sm underline underline-offset-4">
            Back to staff sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Staff portal"
      title="Reset password"
      description="Enter the email your invitation was sent to and we'll send you a reset link."
      footer={
        <Link to="/staff/sign-in" className="font-semibold text-foreground underline underline-offset-4">
          Back to staff sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormAlert message={errors.root?.message} />
        <TextField
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <LoadingButton type="submit" size="lg" className="w-full" loading={isSubmitting} loadingText="Sending…">
          Send reset link
        </LoadingButton>
      </form>
    </AuthLayout>
  );
}