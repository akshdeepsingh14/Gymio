/**
 * Scroll helpers for the landing page.
 *
 * scrollToSection reads its offset from the section's own `scroll-mt-*`
 * class (for example `scroll-mt-20`), so the fixed navbar never covers
 * a heading.
 */

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function scrollToSection(id, delay = 0) {
  const run = () => {
    const element = document.getElementById(id);
    if (!element) return false;

    element.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });

    // Move keyboard focus to the section without triggering another scroll.
    if (!element.hasAttribute("tabindex")) {
      element.setAttribute("tabindex", "-1");
    }
    element.focus({ preventScroll: true });

    // Update the hash without adding a history entry or losing router state.
    history.replaceState(history.state, "", `#${id}`);

    return true;
  };

  if (delay > 0) {
    window.setTimeout(run, delay);
    return true;
  }

  return run();
}

export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });

  // Remove the hash so a refresh doesn't jump back to a section.
  history.replaceState(
    history.state,
    "",
    window.location.pathname + window.location.search
  );
}