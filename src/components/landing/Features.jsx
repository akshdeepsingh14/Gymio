import { useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, Plus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Hex } from "@/components/ui/hex";
import { SectionHeading } from "@/components/ui/section-heading";
import { features } from "@/data/landingContent";
import { cn } from "@/lib/utils";

export function Features() {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const lastTrigger = useRef(null);

  // Kept after closing so the drawer text doesn't change while it slides away
  const active = features[activeIndex];
  const ActiveIcon = active.icon;

  const openFeature = (event, index) => {
    lastTrigger.current = event.currentTarget;
    setActiveIndex(index);
    setOpen(true);
  };

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 xl:gap-24">
        {/* Left: heading stays in view on desktop */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="features-heading"
            layout="stack"
            title={["Less admin.", "More training."]}
            description="Eight tools that replace registers, spreadsheets and scattered chats. Every one of them is free. Tap a row for the details."
          >
            <Link
              to="/sign-up"
              className={cn(
                buttonVariants({ size: "lg" }),
                "group mt-8 h-12 gap-2 px-6 text-base"
              )}
            >
              Try it free
              <ArrowRight
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </SectionHeading>
        </div>

        {/* Right: the eight modules. Hovering a row inverts it. */}
        <ul className="mt-14 border-t-2 border-foreground lg:mt-0">
          {features.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="min-w-0 border-b border-border">
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={(event) => openFeature(event, index)}
                className="group flex w-full items-start gap-4 px-2 py-6 text-left transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-6 sm:px-4 sm:py-8"
              >
                <Hex className="size-12 transition-colors duration-200 group-hover:bg-background group-hover:text-foreground sm:size-14">
                  <Icon className="size-5 sm:size-6" aria-hidden="true" />
                </Hex>

                <span className="min-w-0 flex-1">
                  <span className="block font-display text-3xl font-extrabold uppercase leading-none sm:text-4xl">
                    {title}
                  </span>
                  <span className="mt-3 block max-w-xl text-sm leading-relaxed text-muted-foreground transition-colors duration-200 group-hover:text-background/75 sm:text-base">
                    {description}
                  </span>
                </span>

                <Plus
                  className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:rotate-90 group-hover:text-background"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* One drawer, shared by all rows */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent
          onCloseAutoFocus={(event) => {
            // Put keyboard focus back on the row that opened the drawer
            event.preventDefault();
            lastTrigger.current?.focus();
          }}
        >
          <div className="mx-auto w-full max-w-2xl overflow-y-auto overscroll-contain px-5 pb-2 pt-5 sm:px-6">
            <div className="flex items-center gap-4">
              <Hex className="size-14 sm:size-16">
                <ActiveIcon className="size-6 sm:size-7" aria-hidden="true" />
              </Hex>
              <DrawerTitle className="text-4xl sm:text-5xl">{active.title}</DrawerTitle>
            </div>

            <DrawerDescription className="mt-5 text-base leading-relaxed">
              {active.description}
            </DrawerDescription>

            <ul className="mt-6 border-t-2 border-foreground">
              {active.points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 border-b border-border py-3.5 text-sm sm:text-base"
                >
                  <Hex className="mt-0.5 size-5">
                    <Check className="size-3" aria-hidden="true" />
                  </Hex>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <DrawerFooter className="mx-auto w-full max-w-2xl flex-row gap-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
            <DrawerClose asChild>
              <Button variant="outline" size="lg" className="h-12 flex-1 text-base">
                Close
              </Button>
            </DrawerClose>
            <Link
              to="/sign-up"
              className={cn(buttonVariants({ size: "lg" }), "h-12 flex-1 gap-2 text-base")}
            >
              Try it free
              <ArrowRight aria-hidden="true" />
            </Link>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </section>
  );
}