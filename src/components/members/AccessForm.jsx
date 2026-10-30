import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormAlert, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { Button } from "@/components/ui/button";
import { accessLookupSchema } from "@/lib/validation/access";
import { AccessError, getLockState, identifyMember } from "@/services/accessService";

const DEMO_USERNAME = "ironforge-fitness";

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function AccessForm({ onIdentified }) {
  const [secondsLeft, setSecondsLeft] = useState(() => getLockState().secondsLeft);
  const locked = secondsLeft > 0;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(accessLookupSchema),
    defaultValues: { username: "", code: "" },
  });

  // Count the lock down once a second, and stop when it ends.
  useEffect(() => {
    if (!locked) return undefined;
    const timer = setInterval(() => setSecondsLeft(getLockState().secondsLeft), 1000);
    return () => clearInterval(timer);
  }, [locked]);

  const onSubmit = async (values) => {
    try {
      const preview = await identifyMember(values);
      onIdentified({ username: values.username, code: values.code, preview });
    } catch (error) {
      setSecondsLeft(getLockState().secondsLeft);
      setError("root", {
        message: error instanceof AccessError ? error.message : "Something went wrong. Try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormAlert message={locked ? `Too many attempts. Try again in ${clock(secondsLeft)}.` : errors.root?.message} />

      <TextField
        label="Gym username"
        placeholder="ironforge-fitness"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        error={errors.username?.message}
        {...register("username")}
      />

      <TextField
        label="Access code"
        placeholder="K7QM-4TXD-9HWB"
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        hint="The gym gave you this code. It works for a limited time."
        error={errors.code?.message}
        {...register("code")}
      />

      <LoadingButton
        type="submit"
        size="lg"
        className="w-full"
        loading={isSubmitting}
        loadingText="Checking…"
        disabled={locked}
      >
        Continue
      </LoadingButton>

      <div className="space-y-3 border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="label-mono text-foreground">Demo mode</p>
        <p>
          Sign in as the demo owner in another tab, open a member in Members, and create an access code. Then enter
          it here.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setValue("username", DEMO_USERNAME, { shouldValidate: true })}
        >
          Use demo gym username
        </Button>
      </div>
    </form>
  );
}