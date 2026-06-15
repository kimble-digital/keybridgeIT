// ============================================================
// Single source of truth for site content.
// Edit here; pages read from this. Swap for a CMS later.
// ============================================================

export const company = {
  name: "Keybridge IT Solutions Ltd",
  tagline: "AI · Cyber · Support",
  phoneUK: "+44 (0)330 335 4444",
  phoneUSA: "+1 646 902 9417",
  phonePAC: "+63 2 8639 6721",
  email: "info@keybridgeit.com",
};

export const stats = [
  { value: "15", label: "Years in business", color: "var(--purple)" },
  { value: "200", label: "Organisations supported", color: "var(--orange)" },
  { value: "130+", label: "Five-star reviews", color: "var(--lime)" },
  { value: "5,497", label: "Devices managed", color: "var(--teal)" },
  { value: "24/7", label: "Real-person support", color: "var(--purple)" },
  { value: "Microsoft", label: "Solutions Partner", color: "var(--orange)" },
];

export const nav = [
  { label: "Managed IT", href: "/managed-it" },
  { label: "Cyber Security", href: "/cyber-security" },
  { label: "AI Enablement", href: "/ai-enablement" },
  { label: "Services", href: "/cloud-infrastructure" },
  {
    label: "Industries",
    href: "#",
    children: [
      { label: "Recruitment Agencies", href: "/industries/recruitment" },
      { label: "Law Firms", href: "/industries/law-firms" },
      { label: "Accountancy Firms", href: "/industries/accountancy" },
    ],
  },
];

export const services = [
  {
    id: "managed-it",
    eyebrow: "IT",
    variant: "v-teal",
    title: "Managed IT",
    blurb:
      "Many IT providers wait for something to break. We work the other way around. Through proactive monitoring, responsive support and ongoing maintenance, we keep your systems running smoothly, your people productive and your business moving forward.",
    href: "/managed-it",
    cta: "Explore Managed IT",
  },
  {
    id: "cyber",
    eyebrow: "CY",
    variant: "v-orange",
    title: "Cyber Security",
    blurb:
      "Anyone can sell security software. We build genuine protection around the standards your clients, insurers and regulators increasingly expect, with no shortcuts, no box-ticking and no false sense of security.",
    href: "/cyber-security",
    cta: "Explore Cyber Security",
  },
  {
    id: "ai",
    eyebrow: "AI",
    variant: "v-lime",
    title: "AI Enablement",
    blurb:
      "Most firms have bought the licences. Far fewer have automated real work. We help organisations identify where AI can create genuine value, then build agents that reduce administration, improve productivity and support the way teams already work.",
    href: "/ai-enablement",
    cta: "Explore AI Enablement",
  },
];

export const industries = [
  {
    id: "recruitment",
    title: "Recruitment Agencies",
    blurb: "Fast-moving businesses where downtime costs revenue and candidate data must be protected.",
    href: "/industries/recruitment",
  },
  {
    id: "law-firms",
    title: "Law Firms",
    blurb: "Technology built around confidentiality, privilege and secure access to information.",
    href: "/industries/law-firms",
  },
  {
    id: "accountancy",
    title: "Accountancy Firms",
    blurb: "Supporting practices that operate under deadline pressure and handle sensitive financial data.",
    href: "/industries/accountancy",
  },
];

export const testimonials = [
  { quote: "A real partner to our business.", name: "Peter Thompson" },
  { quote: "An IT support team that actually cares about my needs.", name: "Nicholas Clarkin" },
  { quote: "The best IT company I've ever used.", name: "Rosie Gold" },
  { quote: "Fast, knowledgeable and reliable.", name: "David Bishop" },
];
