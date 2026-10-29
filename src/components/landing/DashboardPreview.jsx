
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { LayoutDashboard, Smartphone } from "lucide-react";

import { Android } from "@/components/ui/android";
import { BorderBeam } from "@/components/ui/border-beam";
import { Hex } from "@/components/ui/hex";
import { Iphone } from "@/components/ui/iphone";
import { Reveal } from "@/components/ui/reveal";
import { Safari } from "@/components/ui/safari";
import { SectionHeading } from "@/components/ui/section-heading";
import { previewCaptions } from "@/data/previewData";
import { cn } from "@/lib/utils";
import { FeedApp, MemberApp, OwnerApp } from "./PreviewScreens";

/* ------------------------------------------------------------------
   Configuration
------------------------------------------------------------------- */

const tabs = [
  { key: "owner", label: "Owner dashboard", icon: LayoutDashboard },
  { key: "member", label: "Member portal", icon: Smartphone },
];

const SCREEN_VARS = {
  "--background": "oklch(0.1 0 0)",
  "--foreground": "oklch(0.985 0 0)",
  "--card": "oklch(0.15 0 0)",
  "--card-foreground": "oklch(0.985 0 0)",
  "--popover": "oklch(0.16 0 0)",
  "--popover-foreground": "oklch(0.985 0 0)",
  "--muted": "oklch(0.2 0 0)",
  "--muted-foreground": "oklch(0.72 0 0)",
  "--accent": "oklch(0.22 0 0)",
  "--accent-foreground": "oklch(0.985 0 0)",
  "--secondary": "oklch(0.19 0 0)",
  "--secondary-foreground": "oklch(0.985 0 0)",
  "--border": "oklch(1 0 0 / 16%)",
  "--input": "oklch(1 0 0 / 18%)",
  "--ring": "oklch(1 0 0 / 65%)",
  "--primary": "oklch(0.985 0 0)",
  "--primary-foreground": "oklch(0.1 0 0)",
  "--brand": "oklch(0.985 0 0)",
  "--rule": "oklch(0.985 0 0)",
  "--destructive": "oklch(0.7 0.19 22)",
  "--success": "oklch(0.72 0.17 150)",
  "--warning": "oklch(0.78 0.16 78)",
};

const MD_QUERY = "(min-width: 768px)";

/* ------------------------------------------------------------------
   Responsive viewport subscription
------------------------------------------------------------------- */

function subscribeToMd(callback) {
  const media = window.matchMedia(MD_QUERY);

  media.addEventListener("change", callback);

  return () => media.removeEventListener("change", callback);
}

function getMdSnapshot() {
  return window.matchMedia(MD_QUERY).matches;
}

function getMdServerSnapshot() {
  return true;
}

function useIsTabletUp() {
  return useSyncExternalStore(
    subscribeToMd,
    getMdSnapshot,
    getMdServerSnapshot
  );
}

/* ------------------------------------------------------------------
   Screen
   Scales the real app UI to fit the device screen.
------------------------------------------------------------------- */

function Screen({
  box,
  designWidth,
  designHeight,
  radius,
  interactive = false,
  children,
}) {
  const hostRef = useRef(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const element = hostRef.current;

    if (!element) return;

    let previousScale = 0;

    const updateScale = (width) => {
      if (!width) return;

      const nextScale = width / designWidth;

      // Avoid unnecessary renders when the scale barely changes.
      if (Math.abs(nextScale - previousScale) < 0.001) return;

      previousScale = nextScale;
      setScale(nextScale);
    };

    const observer = new ResizeObserver(([entry]) => {
      if (entry) updateScale(entry.contentRect.width);
    });

    observer.observe(element);
    updateScale(element.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, [designWidth]);

  return (
    <div
      ref={hostRef}
      aria-hidden={interactive ? undefined : true}
      className={cn(
        "absolute z-20 overflow-hidden",
        !interactive && "pointer-events-none"
      )}
      style={{
        left: `${box.left}%`,
        top: `${box.top}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
        borderRadius: radius,
        ...SCREEN_VARS,
      }}
    >
      <div
        className="bg-background font-sans text-foreground"
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          visibility: scale > 0 ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Devices
   No device drop-shadows or box-shadows.
------------------------------------------------------------------- */

function OwnerWindow() {
  return (
    <div
      role="group"
      aria-label="Interactive owner dashboard preview"
      className="relative isolate overflow-hidden rounded-[10px] border border-border"
    >
      <Safari url="gymio.app/dashboard" />

      <Screen
        interactive
        box={{
          left: 0.083,
          top: 6.906,
          width: 99.751,
          height: 92.961,
        }}
        designWidth={1200}
        designHeight={700}
        radius="0 0 8px 8px"
      >
        <OwnerApp />
      </Screen>

      <BorderBeam
        size={90}
        duration={9}
        borderWidth={2}
        colorFrom="#ffffff"
        colorTo="#a3a3a3"
        className="motion-reduce:hidden"
      />
    </div>
  );
}

function OwnerPhone() {
  return (
    <div
      role="group"
      aria-label="Interactive owner dashboard preview on a phone"
      className="relative w-[20rem] max-w-full"
    >
      <Iphone className="" />

      <Screen
        interactive
        box={{
          left: 4.907,
          top: 2.183,
          width: 89.954,
          height: 95.635,
        }}
        designWidth={389.5}
        designHeight={843.5}
        radius="14.31% / 6.61%"
      >
        <OwnerApp />
      </Screen>
    </div>
  );
}

function MemberPhone({ className }) {
  return (
    <div
      role="img"
      aria-label="Member portal preview showing membership details and payment history"
      className={cn("relative", className)}
    >
      <Iphone className="" />

      <Screen
        box={{
          left: 4.907,
          top: 2.183,
          width: 89.954,
          height: 95.635,
        }}
        designWidth={389.5}
        designHeight={843.5}
        radius="14.31% / 6.61%"
      >
        <MemberApp />
      </Screen>
    </div>
  );
}

function FeedPhone({ className }) {
  return (
    <div
      role="img"
      aria-label="Gym feed preview on an Android phone"
      className={cn("relative", className)}
    >
      <div className="relative aspect-[433/882] w-full">
        <Android className="absolute inset-0 size-full" />
      </div>

      <Screen
        box={{
          left: 2.078,
          top: 1.587,
          width: 83.141,
          height: 90.703,
        }}
        designWidth={360}
        designHeight={800}
        radius="9.2% / 3.2%"
      >
        <FeedApp />
      </Screen>
    </div>
  );
}

/* ------------------------------------------------------------------
   Dashboard preview section
------------------------------------------------------------------- */

export function DashboardPreview() {
  const [tab, setTab] = useState("owner");
  const isTabletUp = useIsTabletUp();
  const tabRefs = useRef([]);

  const handleTabChange = useCallback((key) => {
    setTab(key);
  }, []);

  const handleKeyDown = useCallback(
    (event, index) => {
      const last = tabs.length - 1;
      let next = null;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          next = index === last ? 0 : index + 1;
          break;

        case "ArrowLeft":
        case "ArrowUp":
          next = index === 0 ? last : index - 1;
          break;

        case "Home":
          next = 0;
          break;

        case "End":
          next = last;
          break;

        default:
          return;
      }

      event.preventDefault();

      const nextTab = tabs[next];

      handleTabChange(nextTab.key);
      tabRefs.current[next]?.focus();
    },
    [handleTabChange]
  );

  return (
    <section
      className="tone-invert cv-auto relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      aria-labelledby="preview-heading"
    >
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          id="preview-heading"
          title={["One app,", "two sides."]}
          description="Explore the owner dashboard and member experience. This is a working sample you can interact with. All data is made up."
        />

        {/* Tab navigation */}
        <div className="mt-10 flex justify-center sm:mt-12 lg:mt-16">
          <div
            role="tablist"
            aria-label="Choose a side of the app"
            aria-orientation="horizontal"
            className="grid w-full max-w-md grid-cols-2 border-2 border-foreground bg-background"
          >
            {tabs.map(({ key, label, icon: Icon }, index) => {
              const isActive = tab === key;

              return (
                <button
                  key={key}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`preview-tab-${key}`}
                  aria-selected={isActive}
                  aria-controls="preview-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleTabChange(key)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  className={cn(
                    "flex min-h-14 min-w-0 items-center gap-3 px-3 text-left",
                    "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    "motion-reduce:transition-none",
                    index > 0 && "border-l-2 border-foreground",
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-background text-foreground hover:bg-muted"
                  )}
                >
                  <Icon
                    className="size-5 shrink-0"
                    aria-hidden="true"
                  />

                  <span className="font-display text-lg font-extrabold uppercase leading-none sm:text-xl">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview panel: no stripes or device shadows */}
        <Reveal
          id="preview-panel"
          role="tabpanel"
          aria-labelledby={`preview-tab-${tab}`}
          className="relative mx-auto mt-8 w-full max-w-5xl pb-4 sm:mt-10 lg:mt-12"
        >
          <div
            key={tab}
            className="relative w-full motion-safe:animate-fade-up motion-reduce:animate-none"
          >
            {tab === "owner" &&
              (isTabletUp ? (
                <OwnerWindow />
              ) : (
                <div className="flex justify-center">
                  <OwnerPhone />
                </div>
              ))}

            {tab === "member" && (
              <div className="flex items-end justify-center gap-3 sm:gap-6 md:gap-10">
                <MemberPhone className="w-[min(17.5rem,calc(50%-0.5rem))] sm:w-[18rem]" />

                {isTabletUp && (
                  <FeedPhone className="mb-8 w-[min(15.5rem,40%)] sm:mb-10" />
                )}
              </div>
            )}
          </div>
        </Reveal>

        {/* Captions */}
        <ul className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-x-8 gap-y-6 sm:mt-10 sm:grid-cols-2 sm:gap-y-8 lg:mt-14 lg:grid-cols-3">
          {previewCaptions[tab].map((item) => (
            <li
              key={item.label}
              className="flex min-w-0 items-start gap-3 sm:gap-4"
            >
              <Hex className="mt-1 size-5 shrink-0" />

              <div className="min-w-0">
                <p className="font-display text-xl font-extrabold uppercase leading-tight sm:text-2xl">
                  {item.label}
                </p>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-snug">
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
