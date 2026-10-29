import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export const BorderBeam = ({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "var(--foreground)",
  colorTo = "var(--muted-foreground)",
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1,
}) => {
  const beamRef = useRef(null);

  useEffect(() => {
    const beam = beamRef.current;
    if (!beam || typeof beam.animate !== "function") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    const from = reverse ? 100 - initialOffset : initialOffset;
    const to = reverse ? -initialOffset : 100 + initialOffset;

    const animation = beam.animate(
      [{ offsetDistance: `${from}%` }, { offsetDistance: `${to}%` }],
      {
        duration: duration * 1000,
        iterations: Infinity,
        easing: "linear",
        delay: -delay * 1000,
      }
    );

    // Pause while off screen so it costs nothing
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) animation.play();
      else animation.pause();
    });
    observer.observe(beam.parentElement);

    return () => {
      observer.disconnect();
      animation.cancel();
    };
  }, [delay, duration, initialOffset, reverse]);

  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--border-beam-width) border-transparent mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect [mask-clip:padding-box,border-box]"
      style={{ "--border-beam-width": `${borderWidth}px` }}
    >
      <div
        ref={beamRef}
        className={cn(
          "absolute aspect-square",
          "bg-linear-to-l from-(--color-from) via-(--color-to) to-transparent",
          className
        )}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          offsetDistance: `${reverse ? 100 - initialOffset : initialOffset}%`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          ...style,
        }}
      />
    </div>
  );
};