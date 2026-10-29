import { Plus } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { productFacts } from "@/data/landingContent";

/**
 * Four numbers in one bordered strip. Each cell is a button that opens a short
 * note, and it inverts (black to white or the reverse) while it is open or hovered.
 */
export function ProductFacts() {
  return (
    <section aria-label="Gymio at a glance" className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <ul className="grid grid-cols-2 border-y-2 border-foreground lg:grid-cols-4">
          {productFacts.map((fact) => (
            <li
              key={fact.label}
              className="min-w-0 border-border max-lg:[&:nth-child(-n+2)]:border-b max-lg:odd:border-r lg:border-r lg:last:border-r-0"
            >
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${fact.value}: ${fact.label}. Show more.`}
                    className="group flex size-full min-h-44 flex-col justify-between gap-8 p-5 text-left transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[state=open]:bg-foreground data-[state=open]:text-background sm:min-h-52 sm:p-7 lg:p-8"
                  >
                    <Plus
                      aria-hidden="true"
                      className="size-5 self-end text-muted-foreground transition-transform duration-300 group-hover:rotate-90 group-hover:text-background group-data-[state=open]:rotate-45 group-data-[state=open]:text-background"
                    />

                    <span className="block">
                      <span className="block font-display text-5xl font-extrabold uppercase leading-[0.85] sm:text-6xl xl:text-7xl">
                        {fact.value}
                      </span>
                      <span className="mt-3 block max-w-[15rem] text-sm leading-snug text-muted-foreground transition-colors group-hover:text-background/80 group-data-[state=open]:text-background/80">
                        {fact.label}
                      </span>
                    </span>
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  side="bottom"
                  align="start"
                  sideOffset={8}
                  className="w-64 gap-0 p-4"
                >
                  <PopoverHeader>
                    <PopoverTitle className="text-2xl">{fact.value}</PopoverTitle>
                    <PopoverDescription className="mt-2 text-sm leading-relaxed">
                      {fact.hint}
                    </PopoverDescription>
                  </PopoverHeader>
                </PopoverContent>
              </Popover>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}