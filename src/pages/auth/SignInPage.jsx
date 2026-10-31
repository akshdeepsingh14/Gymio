import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormAlert, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ownerSignInSchema } from "@/lib/validation/auth";
import { DEMO_CREDENTIALS } from "@/services/authService";

export default function SignInPage() {
  const { signIn } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ownerSignInSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (values) => {
    try {
      await signIn(values);
      toast.success("Welcome back.");
      // GuestRoute sees the new session and redirects.
    } catch (error) {
      setError("root", { message: error.message ?? "Something went wrong. Try again." });
    }
  };

  const fillDemo = () => {
    setValue("email", DEMO_CREDENTIALS.email, { shouldValidate: true });
    setValue("password", DEMO_CREDENTIALS.password, { shouldValidate: true });
  };

  return (
    <AuthLayout
      eyebrow="Owner portal"
      title="Sign in"
      description="Open your gym dashboard."
      footer={
        <>
          New to Gymio?{" "}
          <Link to="/sign-up" className="font-semibold text-foreground underline underline-offset-4">
            Create your gym
          </Link>
          <span className="mt-3 block">
            Staff or member?{" "}
            <Link to="/staff/sign-in" className="font-semibold text-foreground underline underline-offset-4">
              Staff sign in
            </Link>
            {" · "}
            <Link to="/member" className="font-semibold text-foreground underline underline-offset-4">
              Member sign in
            </Link>
          </span>
        </>
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

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between gap-4">
          <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" className="size-4 accent-foreground" {...register("remember")} />
            Keep me signed in
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>

        <LoadingButton type="submit" size="lg" className="w-full" loading={isSubmitting} loadingText="Signing in…">
          Sign in
        </LoadingButton>

        <Button type="button" variant="outline" size="lg" className="w-full" onClick={fillDemo}>
          Fill demo account
        </Button>
      </form>
    </AuthLayout>
  );
}