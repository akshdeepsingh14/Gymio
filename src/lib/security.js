// Labels and helpers for the Security tab.

export const ACTIVITY_LABELS = {
  signin: "Signed in",
  failed: "Failed sign-in attempt",
  password: "Password changed",
  sessions: "Signed out other sessions",
};

/** "Chrome on Windows". Reads the browser's user-agent text, so it is a good guess, not a guarantee. */
export function describeDevice(userAgent = "") {
  const ua = String(userAgent);

  // Order matters: Edge and Opera also say "Chrome", and Chrome also says "Safari"
  let browser = "Browser";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua)) browser = "Opera";
  else if (/Firefox\/|FxiOS/.test(ua)) browser = "Firefox";
  else if (/Chrome\/|CriOS/.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let system = "";
  if (/iPhone|iPod/.test(ua)) system = "iPhone";
  else if (/iPad/.test(ua)) system = "iPad";
  else if (/Android/.test(ua)) system = "Android";
  else if (/Windows/.test(ua)) system = "Windows";
  else if (/Mac OS X|Macintosh/.test(ua)) system = "Mac";
  else if (/Linux|X11/.test(ua)) system = "Linux";

  return system ? `${browser} on ${system}` : browser;
}

export function formatDateTime(iso) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}