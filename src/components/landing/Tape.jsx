import { Hex } from "@/components/ui/hex";
import { Marquee } from "@/components/ui/marquee";
import { tapeWords } from "@/data/landingContent";

/**
 * Scrolling strip under the hero. Pure CSS animation, paused on hover,
 * and still on devices set to reduced motion.
 * The visible words are hidden from screen readers; a plain list is read instead.
 */
export function Tape() {
  return (
    <section
      aria-label="What Gymio covers"
      className="border-y-2 border-foreground bg-background text-foreground"
    >
      <ul className="sr-only">
        {tapeWords.map((word) => (
          <li key={word}>{word}</li>
        ))}
      </ul>

      <Marquee
        aria-hidden="true"
        pauseOnHover
        repeat={3}
        className="p-0 [--duration:38s] [--gap:0rem] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]"
      >
        {tapeWords.map((word, index) => (
          <span
            key={word}
            className="flex items-center gap-6 py-4 pl-6 font-display text-4xl font-extrabold uppercase leading-none sm:gap-10 sm:py-6 sm:pl-10 sm:text-6xl"
          >
            <span className={index % 2 === 1 ? "text-outline" : undefined}>{word}</span>
            <Hex className="size-4 sm:size-6" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}