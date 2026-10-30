import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, LogOut } from "lucide-react";
import { toast } from "sonner";

import { FormAlert, SelectField, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  currencyOptions,
  graceOptions,
  reminderOptions,
  timeZoneOptions,
} from "@/data/options";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { onboardingSchema, usernameSchema } from "@/lib/validation/auth";
import { AuthError, checkUsername } from "@/services/authService";

const STEP_ONE_FIELDS = ["username", "ownerName", "phone"];

function UsernameHint({ status, username }) {
  if (status === "checking") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        Checking availability…
      </span>
    );
  }
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1.5 text-success">
        <Check className="size-3.5" aria-hidden="true" />
        “{username.trim().toLowerCase()}” is available
      </span>
    );
  }
  return "Members use this to find your gym. It is a name, not a password.";
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, completeOnboarding, signOut } = useAuth();
  const [step, setStep] = useState(1);
  const [usernameStatus, setUsernameStatus] = useState("idle");

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: slugify(user.gymName),
      ownerName: "",
      phone: "",
      city: "",
      locality: "",
      currency: "INR",
      timeZone: "Asia/Kolkata",
      graceDays: "10",
      reminderDays: "7",
    },
  });

  const username = watch("username");

  // Live availability check, debounced so we don't fire on every keystroke
  useEffect(() => {
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      setUsernameStatus("idle");
      return;
    }

    let active = true;
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const available = await checkUsername(parsed.data, user.id);
      if (active) setUsernameStatus(available ? "available" : "taken");
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username, user.id]);

  const goNext = async () => {
    const valid = await trigger(STEP_ONE_FIELDS);
    if (valid && usernameStatus !== "taken" && usernameStatus !== "checking") setStep(2);
  };

  const onSubmit = async (values) => {
    try {
      await completeOnboarding({
        ...values,
        graceDays: Number(values.graceDays),
        reminderDays: Number(values.reminderDays),
      });
      toast.success("Your gym is ready.");
      navigate("/app", { replace: true });
    } catch (error) {
      if (error instanceof AuthError && error.field === "username") {
        setStep(1);
        setUsernameStatus("taken");
        setError("username", { message: error.message });
      } else {
        setError("root", { message: error.message ?? "Something went wrong. Try again." });
      }
    }
  };

  return (
    <div className="flex min-h-svh flex-col">
      <title>Set up your gym — Gymio</title>
      <meta name="robots" content="noindex" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:pt-12">
        <div className="w-full max-w-xl animate-fade-up">
          <div className="flex items-center justify-between">
            <p className="label-mono">Step {step} of 2</p>
            <p className="label-mono text-muted-foreground">{user.gymName}</p>
          </div>
          <div className="mt-3 flex gap-2" aria-hidden="true">
            {[1, 2].map((n) => (
              <span key={n} className={cn("h-1 flex-1", n <= step ? "bg-foreground" : "bg-border")} />
            ))}
          </div>

          <h1 className="mt-8 text-[clamp(2.75rem,9vw,4.25rem)] font-extrabold">
            {step === 1 ? "Your gym identity" : "Location & rules"}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {step === 1
              ? "Pick the username members will use to find your gym."
              : "Defaults you can change later in Settings."}
          </p>

          <form
            noValidate
            onSubmit={
              step === 1
                ? (event) => {
                    event.preventDefault();
                    goNext();
                  }
                : handleSubmit(onSubmit)
            }
            className="mt-8 space-y-5"
          >
            <FormAlert message={errors.root?.message} />

            {step === 1 && (
              <>
                <TextField
                  label="Gym username"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="ironforge-fitness"
                  hint={<UsernameHint status={usernameStatus} username={username} />}
                  error={
                    errors.username?.message ??
                    (usernameStatus === "taken" ? "That username is already taken." : undefined)
                  }
                  {...register("username")}
                />
                <TextField
                  label="Your name"
                  autoComplete="name"
                  error={errors.ownerName?.message}
                  {...register("ownerName")}
                />
                <TextField
                  label="Phone (optional)"
                  type="tel"
                  autoComplete="tel"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="City"
                    autoComplete="address-level2"
                    error={errors.city?.message}
                    {...register("city")}
                  />
                  <TextField
                    label="Locality (optional)"
                    error={errors.locality?.message}
                    {...register("locality")}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <SelectField label="Currency" options={currencyOptions} {...register("currency")} />
                  <SelectField label="Time zone" options={timeZoneOptions} {...register("timeZone")} />
                </div>
                <SelectField
                  label="Renewal grace period"
                  options={graceOptions}
                  hint="Days after expiry during which a member can still renew."
                  {...register("graceDays")}
                />
                <SelectField
                  label="Expiry reminder"
                  options={reminderOptions}
                  {...register("reminderDays")}
                />
              </>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              {step === 2 ? (
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>
                  <ArrowLeft aria-hidden="true" />
                  Back
                </Button>
              ) : (
                <span />
              )}

              {step === 1 ? (
                <Button type="submit" size="lg" disabled={usernameStatus === "checking"}>
                  Continue
                  <ArrowRight aria-hidden="true" />
                </Button>
              ) : (
                <LoadingButton type="submit" size="lg" loading={isSubmitting} loadingText="Setting up…">
                  Finish setup
                </LoadingButton>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}