import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { faqs } from "@/data/landingContent";
import { cn } from "@/lib/utils";

export function FAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="cv-auto scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 xl:gap-24">
        {/* Left: heading and a nudge to try it */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="faq-heading"
            layout="stack"
            title={["Questions,", "answered."]}
            description="Pricing, payments, member access and privacy, explained plainly."
          >
            <div className="mt-8 border-2 border-foreground p-5 shadow-hard-sm">
              <p className="font-display text-2xl font-extrabold uppercase leading-none">
                Rather see it yourself?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your gym and try everything. It&apos;s free.
              </p>
              <Link
                to="/sign-up"
                className={cn(buttonVariants(), "group mt-4 h-11 gap-2 px-5 text-base")}
              >
                Get started
                <ArrowRight
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </SectionHeading>
        </div>

        {/* Right: the answers */}
        <Reveal delay={0.1} className="mt-14 lg:mt-0">
          <Accordion type="single" collapsible defaultValue="faq-0">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p>{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}