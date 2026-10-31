
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  FormAlert,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ImageUpload } from "@/components/profile/ImageUpload";
import { OpeningHoursEditor } from "@/components/profile/OpeningHoursEditor";
import { UnsavedChangesGuard } from "@/components/settings/UnsavedChangesGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { currencyOptions, timeZoneOptions } from "@/data/options";
import { useAuth } from "@/hooks/useAuth";
import { getInitials, toProfileForm } from "@/lib/profile";
import { usernameSchema } from "@/lib/validation/auth";
import { profileSchema } from "@/lib/validation/profile";
import { AuthError, checkUsername } from "@/services/authService";

function Section({ title, description, children }) {
  return (
    <section className="grid gap-6 border-t border-border py-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="text-2xl font-extrabold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

function UsernameHint({ status, username }) {
  if (status === "checking") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <LoaderCircle
          className="size-3.5 animate-spin"
          aria-hidden="true"
        />
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

  return "Members type this on the member sign-in page. It is a name, not a password.";
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [saving, setSaving] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);
  const [check, setCheck] = useState({
    name: "",
    available: false,
  });

  const [emailPassword, setEmailPassword] = useState("");
  const [emailPasswordError, setEmailPasswordError] = useState("");

  const savedUsername = user.gym?.username ?? "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: toProfileForm(user),
  });

  const username = watch("username");
  const hours = watch("hours");
  const logo = watch("logo");
  const cover = watch("cover");
  const ownerPhoto = watch("ownerPhoto");
  const gymName = watch("gymName");
  const ownerName = watch("ownerName");

  const email = watch("email");

  // Changing the email you sign in with needs your password.
  const trimmedEmail =
    typeof email === "string"
      ? email.trim().toLowerCase()
      : "";

  const emailChanged =
    trimmedEmail !== "" &&
    trimmedEmail !== user.email;

  // Is the typed username a new, valid one that needs an availability check?
  const typed = usernameSchema.safeParse(username);

  const candidate =
    typed.success && typed.data !== savedUsername
      ? typed.data
      : null;

  useEffect(() => {
    if (!candidate) return;

    let active = true;

    const timer = setTimeout(async () => {
      const available = await checkUsername(candidate, user.id);

      if (active) {
        setCheck({
          name: candidate,
          available,
        });
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [candidate, user.id]);

  const usernameStatus = !candidate
    ? "idle"
    : check.name !== candidate
      ? "checking"
      : check.available
        ? "available"
        : "taken";

  const usernameChanged =
    typed.success && typed.data !== savedUsername;

  const save = async (values) => {
    setSaving(true);

    try {
      const next = await updateProfile({
        ...values,
        currentPassword: emailPassword,
      });

      reset(toProfileForm(next));

      setEmailPassword("");
      setEmailPasswordError("");

      toast.success("Gym profile saved.");
    } catch (error) {
      if (
        error instanceof AuthError &&
        error.field === "currentPassword"
      ) {
        setEmailPasswordError(error.message);
      } else if (
        error instanceof AuthError &&
        error.field
      ) {
        setError(error.field, {
          message: error.message,
        });
      } else {
        setError("root", {
          message:
            error.message ?? "Something went wrong. Try again.",
        });
      }
    } finally {
      setSaving(false);
      setPendingValues(null);
    }
  };

  // A changed username needs an explicit yes first.
  const onValid = (values) => {
    if (emailChanged && emailPassword === "") {
      setEmailPasswordError(
        "Enter your current password to change your email."
      );
      return;
    }

    if (usernameStatus === "taken") {
      setError("username", {
        message: "That username is already taken.",
      });
      return;
    }

    if (values.username !== savedUsername) {
      setPendingValues(values);
      return;
    }

    save(values);
  };

  const copyMonday = () => {
    const monday = getValues("hours.mon");

    for (const key of [
      "tue",
      "wed",
      "thu",
      "fri",
      "sat",
      "sun",
    ]) {
      setValue(
        `hours.${key}`,
        { ...monday },
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      );
    }
  };

  const setImage = (field) => (value) =>
    setValue(field, value, {
      shouldDirty: true,
      shouldValidate: true,
    });

  return (
    <>
      <title>Gym profile — Gymio</title>

      <PageHeader
        title="Gym profile"
        description="This is what members see in their portal and on their receipts."
      />

      <UnsavedChangesGuard when={isDirty} />

      <form
        noValidate
        onSubmit={handleSubmit(onValid)}
        className="mt-8"
      >
        <FormAlert message={errors.root?.message} />

        {/* Branding */}
        <Section
          title="Branding"
          description="Your logo and cover image appear in the member portal. Square logos look best."
        >
          <ImageUpload
            label="Logo"
            hint="JPG, PNG or WebP. Shrunk to fit the demo's storage."
            value={logo}
            onChange={setImage("logo")}
            maxSide={400}
            fallback={
              <span className="font-display text-2xl font-extrabold">
                {getInitials(gymName)}
              </span>
            }
          />

          <ImageUpload
            label="Cover image"
            hint="A wide photo of your gym."
            shape="wide"
            value={cover}
            onChange={setImage("cover")}
            maxSide={1000}
          />

          {(errors.logo || errors.cover) && (
            <p role="alert" className="text-sm text-destructive">
              {errors.logo?.message ?? errors.cover?.message}
            </p>
          )}
        </Section>

        {/* Gym details */}
        <Section
          title="Gym details"
          description="The name and public username of your gym."
        >
          <TextField
            label="Gym name"
            autoComplete="organization"
            error={errors.gymName?.message}
            {...register("gymName")}
          />

          <TextField
            label="Gym username"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            error={errors.username?.message}
            hint={
              <UsernameHint
                status={usernameStatus}
                username={username}
              />
            }
            {...register("username")}
          />

          {usernameChanged && (
            <p className="rounded-sm border border-warning/50 bg-warning/10 p-3 text-sm">
              Changing your username changes the name members type
              to find your gym. Tell your members the new one.
              Member access codes are not affected.
            </p>
          )}

          <TextAreaField
            label="Description"
            rows={3}
            placeholder="Strength training, group classes and a friendly crowd."
            hint="Up to 300 characters."
            error={errors.description?.message}
            {...register("description")}
          />
        </Section>

        {/* Contact and location */}
        <Section
          title="Contact and location"
          description="Shown to members and printed on receipts."
        >
          <TextField
            label="Phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register("phone")}
          />

          <TextField
            label="Street address"
            autoComplete="street-address"
            error={errors.address?.message}
            {...register("address")}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="City"
              autoComplete="address-level2"
              error={errors.city?.message}
              {...register("city")}
            />

            <TextField
              label="Locality"
              error={errors.locality?.message}
              {...register("locality")}
            />
          </div>

          <TextField
            label="Website"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://"
            error={errors.website?.message}
            {...register("website")}
          />

          <TextField
            label="Instagram"
            autoComplete="off"
            autoCapitalize="none"
            placeholder="@yourgym"
            error={errors.instagram?.message}
            {...register("instagram")}
          />
        </Section>

        {/* Opening hours */}
        <Section
          title="Opening hours"
          description="Members see these in their portal. Uncheck a day to mark it closed."
        >
          <OpeningHoursEditor
            register={register}
            errors={errors.hours}
            hours={hours}
            onCopyMonday={copyMonday}
          />
        </Section>

        {/* Region */}
        <Section
          title="Region"
          description="Used for prices, dates and reports."
        >
          <SelectField
            label="Currency"
            options={currencyOptions}
            hint="Changing this does not convert amounts you have already recorded."
            error={errors.currency?.message}
            {...register("currency")}
          />

          <SelectField
            label="Time zone"
            options={timeZoneOptions}
            error={errors.timeZone?.message}
            {...register("timeZone")}
          />
        </Section>

        {/* Owner */}
        <Section
          title="Owner"
          description="Your own details. Your email is what you sign in with."
        >
          <ImageUpload
            label="Profile photo"
            value={ownerPhoto}
            onChange={setImage("ownerPhoto")}
            maxSide={300}
            fallback={
              <span className="font-display text-2xl font-extrabold">
                {getInitials(ownerName)}
              </span>
            }
          />

          {errors.ownerPhoto && (
            <p role="alert" className="text-sm text-destructive">
              {errors.ownerPhoto.message}
            </p>
          )}

          <TextField
            label="Your name"
            autoComplete="name"
            error={errors.ownerName?.message}
            {...register("ownerName")}
          />

          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          {emailChanged && (
            <TextField
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={emailPassword}
              onChange={(event) => {
                setEmailPassword(event.target.value);
                setEmailPasswordError("");
              }}
              error={emailPasswordError}
              hint="Needed because this is the email you sign in with and where password resets go."
            />
          )}
        </Section>

        {/* Save bar */}
        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <p
            aria-live="polite"
            className="text-sm text-muted-foreground"
          >
            {isDirty
              ? "You have unsaved changes."
              : "All changes saved."}
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || saving}
              onClick={() => {
                reset(toProfileForm(user));
                setEmailPassword("");
                setEmailPasswordError("");
              }}
            >
              Discard
            </Button>

            <LoadingButton
              type="submit"
              disabled={!isDirty}
              loading={saving}
              loadingText="Saving…"
            >
              Save changes
            </LoadingButton>
          </div>
        </div>
      </form>

      {/* Username confirmation */}
      <ConfirmDialog
        open={pendingValues !== null}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setPendingValues(null);
          }
        }}
        title="Change username?"
        description={`Members will need to type “${pendingValues?.username}” instead of “${savedUsername}” on the member sign-in page. Anyone using the old name will not find your gym.`}
        confirmLabel="Change username"
        loading={saving}
        onConfirm={() => save(pendingValues)}
      />
    </>
  );
}
