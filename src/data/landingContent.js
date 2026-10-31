import {
  BarChart3,
  CalendarClock,
  Images,
  Palette,
  ReceiptText,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

/* ------------------------------------------------------------------
   Navigation
------------------------------------------------------------------- */
export const navLinks = [
  { label: "Features", id: "features" },
  { label: "How it works", id: "how-it-works" },
  { label: "Benefits", id: "benefits" },
  { label: "Pricing", id: "pricing" },
  { label: "FAQ", id: "faq" },
];

/* ------------------------------------------------------------------
   Hero tape: the strip of words that scrolls under the hero
------------------------------------------------------------------- */
export const tapeWords = [
  "Members",
  "Renewals",
  "UPI",
  "Cash",
  "Receipts",
  "Approvals",
  "Analytics",
  "Announcements",
];

/* ------------------------------------------------------------------
   Numbers strip. "hint" shows in a small popover on hover or tap.
------------------------------------------------------------------- */
export const productFacts = [
  {
    value: "₹0",
    label: "Free forever, for every gym",
    hint: "No trials, no paid tiers and no credit card. Every feature is included.",
  },
  {
    value: "8",
    label: "Core modules in one app",
    hint: "Members, renewals, payments, receipts, approvals, announcements, analytics and branding.",
  },
  {
    value: "3",
    label: "Portals: owner, staff and member",
    hint: "Owners run the gym, staff work with the access the owner gives them, and members get their own private portal.",
  },
  {
    value: "UPI + Cash",
    label: "Payment methods tracked",
    hint: "Gymio records payments you enter. It does not verify them with a bank.",
  },
];

/* ------------------------------------------------------------------
   Features. "points" fill the slide-up drawer when a row is opened.
------------------------------------------------------------------- */
export const features = [
  {
    icon: Users,
    title: "Member management",
    description:
      "Add, search, filter and update members in seconds. Every profile keeps its plan, status and full history.",
    points: [
      "Search and filter by plan, status or expiry",
      "One profile per member with plan and payment history",
      "Update or pause a membership in a couple of taps",
    ],
  },
  {
    icon: CalendarClock,
    title: "Membership renewals",
    description:
      "Automatic expiry dates, a configurable grace period, and reminders before memberships run out.",
    points: [
      "Expiry dates are calculated from the plan you pick",
      "Grace period is 10 days by default and you can change it",
      "See who expires this week at a glance",
    ],
  },
  {
    icon: Wallet,
    title: "UPI and cash tracking",
    description:
      "Record UPI, cash and custom payment methods with references, notes and an auditable change history.",
    points: [
      "Store the UPI transaction reference with each payment",
      "Add custom payment methods for your gym",
      "Corrections keep a visible history, nothing is silently overwritten",
    ],
  },
  {
    icon: ReceiptText,
    title: "Digital receipts",
    description:
      "Branded, numbered receipts that members can view, print or download as PDF.",
    points: [
      "Every payment gets a numbered receipt",
      "Members can open or download receipts any time",
      "Receipts show the payment was recorded by the gym",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Member access approvals",
    description:
      "Members request access with a private code. You approve or reject every request yourself.",
    points: [
      "Share a private access code with each member",
      "Nobody enters the portal until you approve them",
      "Reject a request at any time",
    ],
  },
  {
    icon: Images,
    title: "Announcements and photos",
    description:
      "Post updates, timings and gym photos straight to your members' portal feed.",
    points: [
      "Post holiday timings, events and new equipment",
      "Add photos to build a simple gym gallery",
      "Members see updates the next time they open the portal",
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics and reporting",
    description:
      "Revenue, growth, renewals and payment-method breakdowns, filtered by the dates you choose.",
    points: [
      "Revenue and new members over any date range",
      "Renewal counts and payment-method split",
      "Built to read comfortably on a phone",
    ],
  },
  {
    icon: Palette,
    title: "Custom gym branding",
    description:
      "Your logo, colours and cover image across the dashboard, member portal and receipts.",
    points: [
      "Add your logo and cover image",
      "Light and dark themes for the dashboard",
      "Your branding carries onto receipts",
    ],
  },
];

/* ------------------------------------------------------------------
   How it works
------------------------------------------------------------------- */
export const steps = [
  {
    number: "01",
    title: "Create your gym",
    description:
      "Sign up with your gym name and email, then choose a unique gym username like ironforge-fitness.",
  },
  {
    number: "02",
    title: "Add members and plans",
    description:
      "Set up weekly to yearly plans, add your members, and record their UPI or cash payments.",
  },
  {
    number: "03",
    title: "Invite members to the portal",
    description:
      "Share a private access code. Approve each request, and members get their receipts and updates.",
  },
];

/* ------------------------------------------------------------------
   Benefits
------------------------------------------------------------------- */
export const benefits = {
  owners: [
    {
      title: "No more renewal guesswork",
      description: "See who expires this week and who is in their grace period at a glance.",
    },
    {
      title: "Clean payment records",
      description: "Every rupee recorded with method, reference and receipt, and corrections stay auditable.",
    },
    {
      title: "You control access",
      description: "Nobody enters your member portal without your approval.",
    },
    {
      title: "Works on your phone",
      description: "Record a payment at the front desk or check revenue from anywhere.",
    },
  ],
  members: [
    {
      title: "Always know their status",
      description: "Plan, start date, expiry date and renewal reminders in one place.",
    },
    {
      title: "Receipts on demand",
      description: "Every payment receipt available to view or download, any time.",
    },
    {
      title: "Stay in the loop",
      description: "Holiday timings, new equipment and events, all in the gym feed.",
    },
    {
      title: "Private by design",
      description: "Members only ever see their own details, never anyone else's.",
    },
  ],
};

/* ------------------------------------------------------------------
   Pricing
------------------------------------------------------------------- */
export const freePlanFeatures = [
  "Unlimited members",
  "Membership plans and renewals",
  "UPI, cash and custom payment methods",
  "Branded PDF receipts",
  "Member portal with access approvals",
  "Announcements and photo gallery",
  "Analytics dashboard",
  "Light and dark themes with custom branding",
  "Data export",
];

/* ------------------------------------------------------------------
   Testimonials. Clearly labelled sample content, NOT real customer reviews.
------------------------------------------------------------------- */
export const sampleTestimonials = [
  {
    initials: "SO",
    role: "Sample gym owner",
    context: "Strength studio, 180 members",
    quote: "Renewals used to live in a notebook. Now I see every expiring membership the moment I open the dashboard.",
  },
  {
    initials: "FM",
    role: "Sample front-desk manager",
    context: "Neighbourhood gym",
    quote: "Recording a UPI payment and handing over a receipt takes less than a minute.",
  },
  {
    initials: "CF",
    role: "Sample CrossFit coach",
    context: "Boutique box",
    quote: "Members stopped asking when their plan ends, because they can check it themselves.",
  },
  {
    initials: "YS",
    role: "Sample yoga studio owner",
    context: "Two-batch studio",
    quote: "The announcements feed replaced three different WhatsApp groups.",
  },
  {
    initials: "MG",
    role: "Sample multi-gym owner",
    context: "Two locations",
    quote: "Approving member access myself gives me confidence about who sees what.",
  },
  {
    initials: "PT",
    role: "Sample personal trainer",
    context: "Independent coach",
    quote: "Branded receipts make my small setup look like a proper business.",
  },
];

/* ------------------------------------------------------------------
   FAQ
------------------------------------------------------------------- */
export const faqs = [
  {
    question: "Is Gymio really free?",
    answer:
      "Yes. Gymio is free for every gym owner, and every feature is included. There are no paid tiers, trials or credit card requirements.",
  },
  {
    question: "Does Gymio verify UPI payments automatically?",
    answer:
      "No. Gymio records payments you enter manually, including UPI transaction references. Receipts clearly show that a payment was recorded by the gym, not verified by a bank or payment provider.",
  },
  {
    question: "How do members sign in to the member portal?",
    answer:
      "Members enter your gym username and a private access code you issue to them. They then request access, and you approve or reject the request from your dashboard. After approval they stay signed in securely.",
  },
  {
    question: "What happens when a membership expires?",
    answer:
      "Each gym can set a renewal grace period (10 days by default). Members can renew during that time, and access follows your gym's policy. After the grace period, portal access is restricted until a renewal is recorded.",
  },
  {
    question: "Can members see other members' information?",
    answer:
      "No. Members can only see their own membership, payments and receipts, plus the updates your gym publishes.",
  },
  {
    question: "Can I use Gymio on my phone?",
    answer:
      "Yes. The owner dashboard, the staff portal and the member portal are all responsive"
  },
  {
    question: "Can I export my gym's data?",
    answer:
      "Yes. Owners can export member and payment records from the Data and privacy settings.",
  },
];

/* ------------------------------------------------------------------
   Footer
------------------------------------------------------------------- */
export const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Portals",
    links: [
      { label: "Owner sign in", to: "/sign-in" },
      { label: "Staff sign in", to: "/staff/sign-in" },
      { label: "Member sign in", to: "/member" },
      { label: "Create gym account", to: "/sign-up" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", to: "/privacy" },
      { label: "Terms of service", to: "/terms" },
    ],
  },
];