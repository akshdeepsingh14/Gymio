import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormAlert, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { buttonVariants } from "@/components/ui/button";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { requestPasswordReset } from "@/services/authService";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
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
      await requestPasswordReset(email);
      setSentTo(email);
    } catch {
      setError("root", { message: "Something went wrong. Try again." });
    }
  };

  if (sentTo) {
    return (
      <AuthLayout title="Check your email">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <MailCheck className="mt-1 size-5 shrink-0" aria-hidden="true" />
            <p className="text-base leading-relaxed text-muted-foreground">
              If an account exists for <span className="font-semibold text-foreground">{sentTo}</span>,
              a reset link is on its way.
            </p>
          </div>

          <div className="border border-dashed border-border p-4">
            <p className="label-mono">Demo build</p>
            <p className="mt-2 text-sm text-muted-foreground">
              No email is sent in the demo. Use the button below to open the reset page.
            </p>
            <Link
              to="/reset-password"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 h-10")}
            >
              Open reset page
            </Link>
          </div>

          <Link to="/sign-in" className="inline-block text-sm underline underline-offset-4">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      description="Enter your email and we'll send you a reset link."
      footer={
        <Link to="/sign-in" className="font-semibold text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormAlert message={errors.root?.message} />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@yourgym.com"
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