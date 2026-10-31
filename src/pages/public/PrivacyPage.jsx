import { LegalLayout } from "@/components/common/LegalLayout";

const sections = [
  {
    heading: "What this is",
    body: [
      "Gymio is a portfolio project. This build is a working demonstration, not a service that runs real gyms, so there is no company behind it holding your records.",
    ],
  },
  {
    heading: "What is stored, and where",
    body: [
      "Everything you enter (gym details, members, payments, staff, photos and settings) is saved in your own browser, using local storage and session storage. It is not sent to a server, because this build has no server.",
      "Because of that, your data stays on this device and this browser. It does not follow you to another device, and clearing your browser data deletes it.",
    ],
  },
  {
    heading: "Passwords and sign-in",
    body: [
      "Sign-in here is a simulation. Passwords are kept in your browser in a form that is not secure, and anyone with access to this browser could read them. Please do not use a password you use anywhere else, and do not enter real member details.",
    ],
  },
  {
    heading: "Cookies, tracking and third parties",
    body: [
      "Gymio sets no tracking cookies, runs no analytics and shows no advertising. Fonts and images are bundled with the app, so loading it makes no requests to other companies.",
      "The one outbound link is the optional Instagram link on a gym's page, which opens only when someone clicks it.",
    ],
  },
  {
    heading: "Deleting your data",
    body: [
      "Owners can export their records and delete the account under Settings, Data and privacy. You can also remove everything by clearing this site's data in your browser.",
    ],
  },
  {
    heading: "If this becomes a real service",
    body: [
      "Before Gymio handles real member data it will need a server, proper password handling, and a privacy policy written for that service. This page will be replaced at that point.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy policy"
      updated="31 October 2026"
      intro="Short version: nothing you type into this demo leaves your browser."
      sections={sections}
    />
  );
}