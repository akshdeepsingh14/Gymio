// Shared by the Gym Profile screen, its validation, and the member portal.

export const DAYS = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
];

/** 24-hour "HH:MM", the format <input type="time"> produces. */
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function defaultHours() {
  return Object.fromEntries(
    DAYS.map(({ key }) => [key, { open: key !== "sun", from: "06:00", to: "22:00" }]),
  );
}

/** "18:30" becomes "6:30 PM". */
export function formatTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** One row per day for display. Returns [] when the gym has not set any hours. */
export function hoursRows(hours) {
  if (!hours) return [];
  return DAYS.map(({ key, short }) => {
    const day = hours[key];
    const valid = day?.open && TIME_PATTERN.test(day.from) && TIME_PATTERN.test(day.to);
    return { key, day: short, text: valid ? `${formatTime(day.from)} – ${formatTime(day.to)}` : "Closed" };
  });
}

/** Turns the saved owner account into the values the profile form starts with. */
export function toProfileForm(user) {
  const gym = user.gym ?? {};
  return {
    gymName: user.gymName ?? "",
    username: gym.username ?? "",
    description: gym.description ?? "",
    logo: gym.logo ?? "",
    cover: gym.cover ?? "",
    phone: gym.phone ?? "",
    address: gym.address ?? "",
    city: gym.city ?? "",
    locality: gym.locality ?? "",
    website: gym.website ?? "",
    instagram: gym.instagram ?? "",
    hours: gym.hours ?? defaultHours(),
    currency: gym.currency ?? "INR",
    timeZone: gym.timeZone ?? "Asia/Kolkata",
    ownerName: user.ownerName ?? "",
    email: user.email ?? "",
    ownerPhoto: user.ownerPhoto ?? "",
  };
}

export function getInitials(name) {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}