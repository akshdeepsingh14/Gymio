// Look-and-feel preferences for this browser: corners, spacing, cards, sidebar.
// DEMO ONLY: saved in localStorage. The light/dark theme has its own provider.
//
// A tiny store (read, change, subscribe) so any component can react to a change,
// and applyAppearance() writes the choices onto <html> where appearance.css reads them.

const STORAGE_KEY = "gymio-appearance";

export const APPEARANCE_OPTIONS = {
  radius: [
    { value: "sharp", label: "Sharp", description: "Square corners. The Gymio default." },
    { value: "soft", label: "Soft", description: "Slightly rounded corners." },
    { value: "round", label: "Round", description: "Friendly, generously rounded corners." },
  ],
  density: [
    { value: "comfortable", label: "Comfortable", description: "More space around everything." },
    { value: "compact", label: "Compact", description: "Tighter cards, so more fits on screen." },
  ],
  cards: [
    { value: "outlined", label: "Outlined", description: "A thin border around each card." },
    { value: "filled", label: "Filled", description: "A solid tint instead of a border." },
  ],
  sidebar: [
    { value: "expanded", label: "Expanded", description: "Icons with names." },
    { value: "collapsed", label: "Collapsed", description: "Icons only, with more room for content." },
  ],
};

export const DEFAULT_APPEARANCE = {
  radius: "sharp",
  density: "comfortable",
  cards: "outlined",
  sidebar: "expanded",
};

/** Keeps only values we know, so a damaged or old saved value can never break the app. */
function sanitize(input) {
  const result = { ...DEFAULT_APPEARANCE };
  for (const key of Object.keys(DEFAULT_APPEARANCE)) {
    const allowed = APPEARANCE_OPTIONS[key].map((option) => option.value);
    if (allowed.includes(input?.[key])) result[key] = input[key];
  }
  return result;
}

function load() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

const listeners = new Set();
let state = typeof window === "undefined" ? { ...DEFAULT_APPEARANCE } : load();

export const getAppearance = () => state;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Writes the choices onto <html> as data attributes. Safe to call repeatedly. */
export function applyAppearance(next = state) {
  const root = document.documentElement;
  root.dataset.radius = next.radius;
  root.dataset.density = next.density;
  root.dataset.cards = next.cards;
}

function commit(next) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the choice lasts until the page is closed.
  }
  applyAppearance(next);
  listeners.forEach((listener) => listener());
}

/** Change one or more preferences, for example setAppearance({ radius: "soft" }). */
export function setAppearance(patch) {
  commit(sanitize({ ...state, ...patch }));
}

export function resetAppearance() {
  commit({ ...DEFAULT_APPEARANCE });
}

// Another tab changed it: follow along.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    applyAppearance(state);
    listeners.forEach((listener) => listener());
  });
}