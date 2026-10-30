import { useState } from "react";
import { toast } from "sonner";

const pick = (source, keys) => Object.fromEntries(keys.map((key) => [key, source[key]]));

/**
 * Draft state for one settings tab.
 *  - saved: the gym's current settings (from getGymSettings)
 *  - keys: the settings this tab edits. Only these are compared and saved.
 *  - save(values): async, throws an Error with a readable message on failure
 */
export function useSettingsForm({ saved, keys, save, successMessage }) {
  const [draft, setDraft] = useState(() => pick(saved, keys));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const original = pick(saved, keys);
  const dirty = keys.some((key) => JSON.stringify(draft[key]) !== JSON.stringify(original[key]));

  const update = (patch) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError("");
  };

  const discard = () => {
    setDraft(pick(saved, keys));
    setError("");
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await save(draft);
      toast.success(successMessage);
    } catch (caught) {
      setError(caught.message ?? "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return { draft, update, dirty, saving, error, discard, submit };
}