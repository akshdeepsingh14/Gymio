import { LegalLayout } from "@/components/common/LegalLayout";

const sections = [
  {
    heading: "A demonstration",
    body: [
      "Gymio is a portfolio project that shows how a gym management app could work. It is provided as it is, to look at and try out.",
    ],
  },
  {
    heading: "Do not rely on it for a real gym",
    body: [
      "Data lives only in your browser and can disappear if you clear it. There are no backups and no support. Please do not use this build to run a real business or to store real members' personal or financial details.",
    ],
  },
  {
    heading: "Payments and receipts",
    body: [
      "Gymio records the payments you type in. It does not move money and does not check with any bank or payment provider that a payment happened. A receipt shows that the gym recorded a payment, nothing more.",
    ],
  },
  {
    heading: "Your responsibilities",
    body: [
      "Enter only information you are allowed to enter, and keep your own copy of anything that matters. You are responsible for what you add to your demo gym.",
    ],
  },
  {
    heading: "No warranty",
    body: [
      "This build comes with no promises about accuracy, availability or fitness for any purpose, and its author is not liable for losses from using it.",
    ],
  },
  {
    heading: "Pricing",
    body: [
      "Gymio is free, with every feature included. Nothing in this build charges you or asks for card details.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of service"
      updated="31 October 2026"
      intro="Plain terms for a demo app. Please read them before you try it."
      sections={sections}
    />
  );
}