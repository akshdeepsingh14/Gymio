import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormAlert, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { signInSchema } from "@/lib/validation/auth";
import { DEMO_INVITE_TOKENS, DEMO_STAFF_LOGINS, DEMO_STAFF_PASSWORD } from "@/services/staffAuthService";

const staffPoints = [
  { n: "01", title: "Your own account", text: "You sign in with your own email and password, never the owner's." },
  { n: "02", title: "Only what your role needs", text: "The owner decides what you can see and do. The menu shows just that." },
  { n: "03", title: "Everything is recorded", text: "Payments and member changes carry your name, so the gym's books stay clear." },
];

export default function StaffSignInPage() {
  const { signIn, notice } = useStaffAuth();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    try {
      await signIn(values);
      // StaffGuestRoute sees the new session and redirects.
    } catch (error) {
      setError("root", { message: error.message ?? "Something went wrong. Try again." });
    }
  };

  const fillDemo = (email) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", DEMO_STAFF_PASSWORD, { shouldValidate: true });
  };

  return (
    <AuthLayout
      eyebrow="Staff portal"
      title="Staff sign in"
      description="Use the account your gym owner invited you to."
      points={staffPoints}
      footer={
        <>
          Gym owner?{" "}
          <Link to="/sign-in" className="font-semibold text-foreground underline underline-offset-4">
            Owner sign in
          </Link>
          {" · "}
          Member?{" "}
          <Link to="/member" className="font-semibold text-foreground underline underline-offset-4">
            Member sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormAlert message={errors.root?.message ?? notice} />

        <TextField
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          hint="The address your invitation was sent to."
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

        <div className="flex justify-end">
          <Link
            to="/staff/forgot-password"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>

        <LoadingButton type="submit" size="lg" className="w-full" loading={isSubmitting} loadingText="Signing in…">
          Sign in
        </LoadingButton>
      </form>

      <div className="mt-8 space-y-4 border border-dashed border-border p-4 text-sm">
        <div>
          <p className="font-semibold">Haven&apos;t joined yet?</p>
          <p className="mt-1 text-muted-foreground">
            Open the invitation link your gym owner sent you. If it has expired or you can&apos;t find it, ask the
            owner to send a new one. If your account was suspended, the owner can turn it back on.
          </p>
        </div>

        <div>
          <p className="label-mono text-muted-foreground">Demo build: sample staff sign-ins</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {DEMO_STAFF_LOGINS.map((login) => (
              <li key={login.email}>
                <button
                  type="button"
                  onClick={() => fillDemo(login.email)}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  {login.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">Fills the form. The password for all of them is {DEMO_STAFF_PASSWORD}</p>
        </div>

        <div>
          <p className="label-mono text-muted-foreground">Demo build: preview an invitation</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {DEMO_INVITE_TOKENS.map((link) => (
              <li key={link.token}>
                <Link
                  to={`/staff/accept-invite?invite=${link.token}`}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AuthLayout>
  );
}