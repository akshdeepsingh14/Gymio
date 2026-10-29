import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Fades and slides content in when it scrolls into view.
 * One shared IntersectionObserver for the whole page. The observer only sets
 * a data attribute; the animation itself is plain CSS transitions via Tailwind.
 */

// Full class names are written out so Tailwind can detect them.
const variants = {
  up: "translate-y-6 data-[visible=true]:translate-y-0",
  down: "-translate-y-6 data-[visible=true]:translate-y-0",
  left: "-translate-x-6 data-[visible=true]:translate-x-0",
  right: "translate-x-6 data-[visible=true]:translate-x-0",
  scale: "scale-95 data-[visible=true]:scale-100",
  fade: "",
};

let sharedObserver = null;

function reveal(element) {
  element.dataset.visible = "true";
}

function getObserver() {
  if (sharedObserver || typeof IntersectionObserver === "undefined") {
    return sharedObserver;
  }

  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // Also reveal anything already scrolled past (page reload, #anchor jumps).
        const isAbove = entry.boundingClientRect.top < 0;

        if (entry.isIntersecting || isAbove) {
          reveal(entry.target);
          sharedObserver.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  return sharedObserver;
}

export function Reveal({
  as: Tag = "div",
  from = "up",
  delay = 0,
  className,
  style,
  children,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = getObserver();

    // No IntersectionObserver support: just show the content.
    if (!observer) {
      reveal(element);
      return;
    }

    observer.observe(element);
    return () => observer.unobserve(element);
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(
        // will-change only while waiting to appear; released once visible
        "opacity-0 will-change-[opacity,translate,scale] transition-[opacity,translate,scale] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] data-[visible=true]:opacity-100 data-[visible=true]:will-change-auto",
        variants[from] ?? variants.up,
        // Reduced motion: show immediately, no movement.
        "motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none",
        className
      )}
      style={delay ? { transitionDelay: `${delay}s`, ...style } : style}
      {...props}
    >
      {children}
    </Tag>
  );
}