import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormAlert, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { buttonVariants } from "@/components/ui/button";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { hasPendingReset, resetPassword } from "@/services/authService";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [linkValid] = useState(() => hasPendingReset());
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async ({ password }) => {
    try {
      await resetPassword(password);
      toast.success("Password updated. Sign in with your new password.");
      navigate("/sign-in", { replace: true });
    } catch (error) {
      setError("root", { message: error.message ?? "Something went wrong. Try again." });
    }
  };

  if (!linkValid) {
    return (
      <AuthLayout title="Link expired" description="This reset link is no longer valid.">
        <Link to="/forgot-password" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="New password" description="Choose a new password for your account.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormAlert message={errors.root?.message} />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
          {...register("password")}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <LoadingButton type="submit" size="lg" className="w-full" loading={isSubmitting} loadingText="Saving…">
          Update password
        </LoadingButton>
      </form>
    </AuthLayout>
  );
}