import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormAlert, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useAuth } from "@/hooks/useAuth";
import { signUpSchema } from "@/lib/validation/auth";
import { AuthError } from "@/services/authService";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { gymName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async ({ gymName, email, password }) => {
    try {
      await signUp({ gymName, email, password });
      toast.success("Account created. One more step.");
      // GuestRoute sends new accounts to /onboarding.
    } catch (error) {
      if (error instanceof AuthError && error.field) {
        setError(error.field, { message: error.message });
      } else {
        setError("root", { message: error.message ?? "Something went wrong. Try again." });
      }
    }
  };

  return (
    <AuthLayout
      title="Create your gym"
      description="Set up your account in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/sign-in" className="font-semibold text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormAlert message={errors.root?.message} />

        <TextField
          label="Gym name"
          autoComplete="organization"
          placeholder="Ironforge Fitness"
          error={errors.gymName?.message}
          {...register("gymName")}
        />

        <TextField
          label="Owner email"
          type="email"
          autoComplete="email"
          placeholder="you@yourgym.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <TextField
          label="Password"
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
          Create account
        </LoadingButton>

        <p className="text-center text-sm text-muted-foreground">
          By continuing you agree to the{" "}
          <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}