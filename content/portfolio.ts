/**
 * Single source of truth for all portfolio copy.
 *
 * Inventoried from the original static site (index.html, April 2026) and the
 * Library revamp brief. Wording is kept from the old site wherever it existed;
 * em dashes were removed and tool names normalized ("N8n" to "n8n", "Make.com"
 * to "Make"). Fields set to null are content the old site never had. The UI
 * treats them as optional so the site ships before every gap is filled.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type BookId =
  | "about"
  | "work"
  | "services"
  | "stack"
  | "experience"
  | "contact";

export interface Book {
  readonly id: BookId;
  readonly numeral: string;
  /** What sort of book it is on the shelf, which also sets its design. */
  readonly kind: string;
  readonly title: string;
  /** Shorter title for the navigation bar. */
  readonly navLabel: string;
  readonly subtitle: string;
  /** Opening paragraph, set with a drop cap on the book's first page. */
  readonly introduction: string;
}

export interface SiteMetadata {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  /** Production origin for canonical and Open Graph URLs. */
  readonly url: string | null;
  readonly colophon: string;
}

export interface Profile {
  readonly fullName: string;
  readonly headline: string;
  readonly summary: string;
  readonly roles: readonly string[];
  readonly clientRegions: string;
}

export interface Fact {
  readonly label: string;
  readonly value: string;
}

/** Copy for the home page, where the books stand on a shelf. */
export interface LibraryCopy {
  readonly eyebrow: string;
  /** Under the bookcase, until a book is named. */
  readonly sceneInstruction: string;
  /** The links laid over the titled books on the shelf. */
  readonly shelfLabel: string;
  /** The home page's name in the navigation bar. */
  readonly navLabel: string;
}

export interface IntroCopy {
  readonly welcome: string;
  readonly progressLabel: string;
  /** What the welcome screen says while each stage of the library loads. */
  readonly statuses: {
    readonly opening: string;
    readonly lighting: string;
    readonly shelving: string;
    readonly ready: string;
  };
  readonly skip: string;
  /** The landing page's button that plays the intro again. */
  readonly rewind: string;
}

export type ProjectCategory = "automation" | "engineering";

export type ProjectBadgeKind = "production" | "competition" | "award" | "research";

export interface ProjectBadge {
  readonly kind: ProjectBadgeKind;
  readonly label: string;
}

/** Where a project's illustration plate leads when clicked. */
export interface ProjectLink {
  readonly kind: "website" | "video";
  readonly href: string;
}

/** Shown cropped to the plate's 16:10 frame. */
export interface ProjectIllustration {
  readonly src: string;
  readonly alt: string;
}

export interface Project {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly category: ProjectCategory;
  readonly badge: ProjectBadge | null;
  readonly problem: string | null;
  readonly solution: string;
  readonly stack: readonly string[];
  /** Shown as a book plate on featured cards; an engraved placeholder stands in until it is added. */
  readonly illustration: ProjectIllustration | null;
  readonly link: ProjectLink | null;
  /** Featured projects get full cards; the rest go in the archive index. */
  readonly isFeatured: boolean;
}

export interface Service {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly deliverables: readonly string[];
  readonly tools: readonly string[];
  readonly proofProjectIds: readonly ProjectId[];
}

export interface StackGroup {
  readonly id: string;
  readonly title: string;
  readonly items: readonly string[];
}

type Month =
  | "01" | "02" | "03" | "04" | "05" | "06"
  | "07" | "08" | "09" | "10" | "11" | "12";

export type YearMonth = `${number}-${Month}`;

export interface Role {
  readonly id: string;
  readonly title: string;
  readonly organization: string;
  readonly start: YearMonth;
  /** Null means the role is ongoing. */
  readonly end: YearMonth | null;
  readonly summary: string;
}

export interface Education {
  readonly degree: string;
  readonly institution: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly thesis: string;
  readonly summary: string;
}

export interface Award {
  readonly id: string;
  readonly title: string;
  readonly startYear: number;
  readonly endYear: number | null;
  readonly context: string;
  readonly summary: string;
  readonly relatedProjectId: ProjectId | null;
}

export type ContactChannelKind = "email" | "phone" | "github" | "linkedin";

export interface ContactChannel {
  readonly kind: ContactChannelKind;
  readonly label: string;
  readonly display: string;
  readonly href: string;
}

export interface ContactDetails {
  /** Cal.com or Calendly link behind the primary "Book a call" button. */
  readonly bookingUrl: string | null;
  readonly email: string;
  readonly letterOpening: string;
  readonly formIntroduction: string;
  readonly channels: readonly ContactChannel[];
}

// ─── Site and profile ────────────────────────────────────────────────────────

export const SITE: SiteMetadata = {
  name: "Charles Luis Gaid",
  title: "Charles Luis Gaid | Fullstack Developer and AI Automation Specialist",
  description:
    "Fullstack developer and AI automation specialist building automations, voice agents, CRM systems, and web apps for clients in Australia and the US.",
  url: null,
  colophon: "Built with intention.",
};

export const PROFILE: Profile = {
  fullName: "Charles Luis Gaid",
  headline: "Fullstack developer and AI automation specialist",
  summary:
    "Fullstack developer and AI automation specialist shipping production systems for clients in Australia and the US. I build things that replace manual work and actually get used.",
  roles: [
    "AI Automation Engineer",
    "n8n & Make Developer",
    "Computer Engineer",
    "Full-Stack Builder",
    "Voice AI Developer",
  ],
  clientRegions: "Australia and the United States",
};

export const LIBRARY: LibraryCopy = {
  eyebrow: "The library of",
  sceneInstruction: "Choose a book from the menu, or off the shelf.",
  shelfLabel: "Books on the shelf",
  navLabel: "Library",
};

export const INTRO: IntroCopy = {
  welcome: "Welcome to the library of",
  progressLabel: "Preparing the library",
  statuses: {
    opening: "Unlocking the doors",
    lighting: "Lighting the lamps",
    shelving: "Shelving the books",
    ready: "Step inside",
  },
  skip: "Skip intro",
  rewind: "Rewind intro",
};

// ─── Books ────────────────────────────────────────────────────────────────

export const BOOKS: readonly Book[] = [
  {
    id: "about",
    numeral: "I",
    kind: "Memoir",
    title: "About",
    navLabel: "About",
    subtitle: "The author",
    introduction:
      "I'm Charles Luis Gaid. I build the systems that sit behind a growing business: automations that take repetitive work off your team, voice and SMS agents that answer and follow up, CRM setups that keep leads moving, and the web apps that tie it all together.",
  },
  {
    id: "work",
    numeral: "II",
    kind: "Monograph",
    title: "Selected Work",
    navLabel: "Work",
    subtitle: "What I've shipped",
    introduction:
      "Production automations, web apps, embedded systems, and research projects. Everything here was built to solve a real problem.",
  },
  {
    id: "services",
    numeral: "III",
    kind: "Field guide",
    title: "Services",
    navLabel: "Services",
    subtitle: "What I build for clients",
    introduction:
      "Most clients come to me with one slow, manual process. These are the four ways I usually fix it.",
  },
  {
    id: "stack",
    numeral: "IV",
    kind: "Specimens",
    title: "Stack",
    navLabel: "Stack",
    subtitle: "Tools I ship with",
    introduction:
      "The tools I reach for first, followed by everything else I've shipped with.",
  },
  {
    id: "experience",
    numeral: "V",
    kind: "Ledger",
    title: "Experience",
    navLabel: "Experience",
    subtitle: "Where I've built",
    introduction:
      "Production automation systems for medical platforms, real estate agencies, e-commerce businesses, and content creators.",
  },
  {
    id: "contact",
    numeral: "VI",
    kind: "Correspondence",
    title: "Contact",
    navLabel: "Contact",
    subtitle: "Let's build something",
    introduction:
      "Available across US, AU, and APAC time zones. Currently open to freelance and full-time AI automation roles.",
  },
];

export const ABOUT_PARAGRAPHS: readonly string[] = [
  "Since late 2024 I've shipped production work for medical platforms, real estate agencies, e-commerce brands, and content creators across Australia and the US. I own the whole job: scoping, architecture, the build, testing, and support after launch.",
  "My background is Computer Engineering. MammoScan, an AI breast cancer screening project built on thermal imaging and computer vision, won the DOST Grand Prize in 2025. I bring the same rigor to a client's lead pipeline that I brought to medical screening.",
];

export const ABOUT_FACTS: readonly Fact[] = [
  { label: "Clients", value: PROFILE.clientRegions },
  { label: "Time zones", value: "US, AU, and APAC" },
  { label: "Focus", value: "Automation, voice agents, CRM systems, web apps" },
  { label: "Education", value: "BS Computer Engineering, CIT-U, 2026" },
];

// ─── Projects ────────────────────────────────────────────────────────────────

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  automation: "AI Automation",
  engineering: "Engineering / Research",
};

const PRODUCTION_BADGE: ProjectBadge = { kind: "production", label: "Production" };
const COMPETITION_BADGE: ProjectBadge = { kind: "competition", label: "Competition" };

export const PROJECTS = [
  {
    id: "book-launch-pr-dashboard",
    title: "Book Launch PR Dashboard",
    subtitle: "Multi-Track Media Outreach",
    category: "automation",
    badge: PRODUCTION_BADGE,
    problem:
      "A book launch meant pitching 80+ podcasts, influencers, and media outlets at once, with follow-ups that were easy to lose in an inbox.",
    solution:
      "Multi-track PR outreach system managing 80+ contacts across podcasts, influencers, and media. 7 Make webhook endpoints with Gmail reply detection, Sendr video triggers, automated follow-up scheduling, and per-contact automation toggles.",
    stack: ["Make", "Supabase", "Lovable", "Gmail API", "Sendr", "Bit.ly"],
    illustration: null,
    link: null,
    isFeatured: true,
  },
  {
    id: "speakradar",
    title: "SpeakRadar",
    subtitle: "Keynote Speaking Opportunity Finder",
    category: "automation",
    badge: PRODUCTION_BADGE,
    problem:
      "Finding keynote opportunities meant trawling event listings by hand and writing a fresh pitch for each one.",
    solution:
      "Automated pipeline that scrapes speaking events via Apify, scores relevance, and generates personalized AI pitch decks. Surfaces opportunities in a Lovable dashboard with filtering, application tracking, and “Opens for Application” date handling.",
    stack: ["Apify", "OpenAI", "Make", "Lovable", "Supabase"],
    illustration: null,
    link: null,
    isFeatured: true,
  },
  {
    id: "guest-radar",
    title: "Guest Radar",
    subtitle: "Podcast Guest Credibility Scorer",
    category: "automation",
    badge: PRODUCTION_BADGE,
    problem: null,
    solution:
      "Research pipeline that scores podcast guest credibility by aggregating social proof, media mentions, and audience fit. Built with Supabase edge functions and Make for real-time scoring and prioritization.",
    stack: ["Supabase", "Make", "OpenAI", "SerpAPI"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "aiva",
    title: "AIVA",
    subtitle: "Personal AI Assistant",
    category: "automation",
    badge: PRODUCTION_BADGE,
    problem:
      "Email, calendar, and task admin kept pulling attention away from real work, and it needed handling from anywhere, including hands-free.",
    solution:
      "Dual-interface AI assistant with voice via Vapi and text via Telegram. Handles email management, calendar scheduling, and task automation. Designed for hands-free operation across devices.",
    stack: ["Vapi", "Telegram API", "OpenAI", "n8n"],
    illustration: null,
    link: null,
    isFeatured: true,
  },
  {
    id: "sponsorship-lead-gen",
    title: "Sponsorship Lead Gen System",
    subtitle: "Automated Cold Outreach Pipeline",
    category: "automation",
    badge: PRODUCTION_BADGE,
    problem:
      "Finding sponsors meant researching which software companies were actively advertising, tracking down the right contact, and writing to each one by hand.",
    solution:
      "End-to-end pipeline that pulls active software advertisers from Meta Ad Library, filters by web traffic, finds contact emails via Hunter.io, generates personalized pitches with OpenAI, and sends via Resend. Fully automated on a configurable schedule.",
    stack: ["Meta Ad Library", "Hunter.io", "OpenAI", "Resend"],
    illustration: null,
    link: null,
    isFeatured: true,
  },
  {
    id: "meta-lead-ads-to-beehiiv",
    title: "Meta Lead Ads to Beehiiv",
    subtitle: "Newsletter Subscriber Pipeline",
    category: "automation",
    badge: PRODUCTION_BADGE,
    problem: null,
    solution:
      "Automated pipeline connecting Meta Lead Ads to the Beehiiv newsletter platform. New lead form submissions are instantly synced as subscribers with proper tagging for segmentation.",
    stack: ["Meta Ads", "Make", "Beehiiv API"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "content-review-automation",
    title: "Content Review Automation",
    subtitle: "YouTube & Instagram Pipeline",
    category: "automation",
    badge: PRODUCTION_BADGE,
    problem: null,
    solution:
      "Automated content review workflow for a medical content creator. Pulls new uploads, runs AI analysis via Perplexity and Gemini, and generates review summaries with platform-specific optimization suggestions.",
    stack: ["Make", "Perplexity", "Gemini", "YouTube API"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "multi-platform-posting",
    title: "Multi-Platform Posting App",
    subtitle: "Social Media Distribution System",
    category: "automation",
    badge: PRODUCTION_BADGE,
    problem: null,
    solution:
      "Streamlit application for multi-platform social media posting across Instagram, LinkedIn, Facebook, and Twitter. Platform-specific formatting, scheduling, and API integrations with GetLate and Substack.",
    stack: ["Streamlit", "Python", "GetLate", "Substack API"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "supercast-subscriber-system",
    title: "Supercast Subscriber System",
    subtitle: "Webhook-Triggered Content Delivery",
    category: "automation",
    badge: PRODUCTION_BADGE,
    problem: null,
    solution:
      "Subscription management automation handling subscriber events with tier-based logic, automated content delivery, and welcome sequences triggered by webhook events.",
    stack: ["Make", "Supercast", "Webhooks"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "ai-cold-sms-agent",
    title: "AI Cold SMS Agent",
    subtitle: "CRM-Triggered Outreach",
    category: "automation",
    badge: PRODUCTION_BADGE,
    problem: null,
    solution:
      "Personalized SMS outreach system triggered by CRM events. Enriches contact data, generates context-aware messages via AI, and tracks response rates for optimization.",
    stack: ["n8n", "OpenAI", "CRM", "SMS API"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "meta-ads-lookalike-sync",
    title: "Meta Ads LAL Sync",
    subtitle: "Lookalike Audience Automation",
    category: "automation",
    badge: PRODUCTION_BADGE,
    problem:
      "Customer lists were exported and uploaded to Meta as CSVs by hand, so lookalike audiences went stale between uploads.",
    solution:
      "Automated Custom Audience sync between CRM customer lists and Meta Business Platform. Eliminates manual CSV uploads by auto-updating source audiences, enabling Lookalike Audiences to refresh continuously.",
    stack: ["Meta Marketing API", "n8n", "CRM"],
    illustration: null,
    link: null,
    isFeatured: true,
  },
  {
    id: "mammoscan",
    title: "MammoScan",
    subtitle: "AI Breast Cancer Screening",
    category: "engineering",
    badge: { kind: "award", label: "DOST Grand Prize" },
    problem: null,
    solution:
      "AI-powered early screening method for breast cancer using thermographic imaging and computer vision. Won the DOST Scholar's Technopreneurship Training Program competition.",
    stack: ["Thermography", "Computer Vision", "CNN"],
    illustration: null,
    link: null,
    isFeatured: true,
  },
  {
    id: "dpn-thermal-screener",
    title: "Thermal Imaging DPN Screener",
    subtitle: "AI-Powered Medical Screening Tool",
    category: "engineering",
    badge: { kind: "research", label: "Thesis" },
    problem:
      "Diabetic nerve damage in the feet is often caught late, when it is harder to treat.",
    solution:
      "Early screening system for Diabetic Peripheral Neuropathy using AI analysis of thermographic scans of the plantar surface. CNN classification model running on ESP32-S3 with AWS IoT Core integration and a PyQt5 desktop interface.",
    stack: ["ESP32-S3", "TensorFlow/CNN", "AWS IoT", "PyQt5", "OpenCV"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "posidonia-ai",
    title: "Posidonia AI",
    subtitle: "Satellite Seagrass Carbon Estimator",
    category: "engineering",
    badge: COMPETITION_BADGE,
    problem: null,
    solution:
      "AI-powered platform using Sentinel-2 satellite imagery to map, measure, and monetize seagrass carbon stocks across Southeast Asia. Built for the AI ASEAN READY Youth Challenge 2026. Later reframed as a fisher-first community empowerment tool.",
    stack: ["Sentinel-2", "Google Earth Engine", "Deep Learning", "Blue Carbon"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "akkadian-cuneiform-ml",
    title: "Akkadian Cuneiform ML",
    subtitle: "Ancient Script Translation",
    category: "engineering",
    badge: COMPETITION_BADGE,
    problem: null,
    solution:
      "Machine learning pipeline for translating Akkadian cuneiform script using ByT5 transformer models. Built for the Deep Past Challenge on Kaggle as part of CPE432 coursework.",
    stack: ["ByT5", "Hugging Face", "Kaggle", "NLP"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
] as const satisfies readonly Project[];

export type ProjectId = (typeof PROJECTS)[number]["id"];

// ─── Services ────────────────────────────────────────────────────────────────

export const SERVICES: readonly Service[] = [
  {
    id: "ai-automation",
    title: "AI automation",
    summary:
      "I find the manual work your team repeats every week and build the workflows that do it for them: follow-ups, data entry, research, reporting, and the hand-offs between tools that don't talk to each other.",
    deliverables: [
      "A walkthrough of your operations to find the bottlenecks worth automating",
      "n8n, Make, and Zapier workflows connecting the tools you already use",
      "AI steps for drafting, scoring, summarizing, and research",
      "Post-launch support while your team settles in",
    ],
    tools: ["n8n", "Make", "Zapier", "Supabase", "OpenAI API", "Anthropic API", "Gemini API"],
    proofProjectIds: [
      "book-launch-pr-dashboard",
      "sponsorship-lead-gen",
      "content-review-automation",
    ],
  },
  {
    id: "voice-agents",
    title: "Voice and messaging agents",
    summary:
      "Agents that pick up calls, handle routine questions, book time on your calendar, and follow up by text when your CRM flags a lead.",
    deliverables: [
      "Inbound and outbound voice agents on Retell AI or Vapi",
      "SMS follow-up triggered by events in your CRM",
      "Calendar booking and email handling",
      "Chat interfaces on Telegram and similar channels",
    ],
    tools: ["Retell AI", "Vapi", "Twilio", "Telegram API", "OpenAI API", "Anthropic API"],
    proofProjectIds: ["aiva", "ai-cold-sms-agent"],
  },
  {
    id: "crm-systems",
    title: "CRM and GoHighLevel systems",
    summary:
      "Pipelines and automations inside GoHighLevel or the CRM you already run, so leads get followed up on time and your ad audiences stay in sync with your real customer list.",
    deliverables: [
      "GoHighLevel pipelines, workflows, and automations",
      "CRM-triggered outreach and follow-up",
      "Customer lists synced to Meta ad audiences",
      "Lead capture from forms and ads into your CRM or newsletter",
    ],
    tools: ["GoHighLevel", "n8n", "Make", "Meta Marketing API", "Twilio"],
    proofProjectIds: [
      "ai-cold-sms-agent",
      "meta-ads-lookalike-sync",
      "meta-lead-ads-to-beehiiv",
    ],
  },
  {
    id: "web-apps",
    title: "Fullstack web apps",
    summary:
      "Dashboards, internal tools, and client-facing apps built with Next.js, React, and Supabase. Designed for the people who use them every day, including the non-technical ones.",
    deliverables: [
      "Internal dashboards your non-technical staff can run on their own",
      "Client-facing apps in Next.js and React",
      "Supabase databases and edge functions",
      "Python and Streamlit tools for internal teams",
    ],
    tools: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase", "Python", "Vercel"],
    proofProjectIds: [
      "book-launch-pr-dashboard",
      "speakradar",
      "multi-platform-posting",
    ],
  },
];

// ─── Stack ───────────────────────────────────────────────────────────────────

/** The stack named in the brief, shown first and largest. */
export const CORE_STACK: readonly string[] = [
  "Next.js",
  "React",
  "Python",
  "Supabase",
  "n8n",
  "Make",
  "GoHighLevel",
  "Retell AI",
  "Twilio",
  "Anthropic API",
  "Gemini API",
];

export const STACK_GROUPS: readonly StackGroup[] = [
  {
    id: "ai-automation",
    title: "AI & Automation",
    items: [
      "Make",
      "n8n",
      "GoHighLevel",
      "Zapier",
      "LangChain",
      "OpenAI API",
      "Anthropic API",
      "Gemini API",
      "Vapi",
      "Retell AI",
      "Twilio",
      "OpenRouter",
    ],
  },
  {
    id: "languages",
    title: "Languages",
    items: ["Python", "JavaScript", "TypeScript", "Java", "C++", "C", "C#", "SQL"],
  },
  {
    id: "frontend",
    title: "Frontend",
    items: ["React", "Next.js", "Tailwind CSS", "HTML5/CSS3"],
  },
  {
    id: "backend",
    title: "Backend & Databases",
    items: [
      "Node.js",
      "Express.js",
      ".NET / ASP.NET",
      "PostgreSQL",
      "Supabase",
      "MongoDB",
      "Firebase",
      "Pinecone",
      "MySQL",
    ],
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    items: ["TensorFlow", "Keras", "PyTorch", "OpenCV", "Hugging Face", "scikit-learn", "CNNs"],
  },
  {
    id: "cloud",
    title: "Cloud & DevOps",
    items: ["AWS", "Google Cloud", "Azure", "Vercel", "Docker", "Git/GitHub"],
  },
  {
    id: "embedded",
    title: "Embedded Systems",
    items: ["ESP32", "Arduino", "Raspberry Pi", "SolidWorks", "CadQuery"],
  },
];

// ─── Experience, education, awards ───────────────────────────────────────────

export const ROLES: readonly Role[] = [
  {
    id: "kaggle",
    title: "Machine Learning Competitor",
    organization: "Kaggle",
    start: "2026-03",
    end: null,
    summary: "Competing in Kaggle machine learning competitions.",
  },
  {
    id: "iridel",
    title: "n8n/AI Automation Developer",
    organization: "Iridel, Inc.",
    start: "2025-12",
    end: "2026-02",
    summary:
      "Built and delivered custom n8n-based automation workflows and AI frameworks for the agency's Philippine client roster. Handled full-cycle delivery: scoping, architecture, implementation, QA, and post-launch support. Collaborated with the software development team to integrate automations into client-facing applications.",
  },
  {
    id: "urodoc",
    title: "AI Automation Expert",
    organization: "UroDoc, LLC",
    start: "2025-10",
    end: "2026-02",
    summary:
      "Embedded within the company as sole automation engineer. Identified operational bottlenecks and built AI-driven systems eliminating manual overhead across data handling, document workflows, social media, ad pipelines, and internal communications. Built custom web apps and dashboards for non-technical staff.",
  },
  {
    id: "ace-1",
    title: "AI/Software Developer",
    organization: "ACE-1 IT Solutions, Inc.",
    start: "2024-12",
    end: "2025-10",
    summary:
      "Designed and delivered end-to-end AI agent and automation solutions for Australian clients across real estate and e-commerce industries. Owned full project lifecycle: client discovery, scoping, architecture, implementation, testing, and deployment.",
  },
];

export const EDUCATION: Education = {
  degree: "BS Computer Engineering",
  institution: "Cebu Institute of Technology – University (CIT-U)",
  startYear: 2022,
  endYear: 2026,
  thesis:
    "Early Screening for Diabetic Peripheral Neuropathy Using AI Analysis of Thermographic Scans of the Plantar Surface",
  summary:
    "Core coursework in embedded systems, machine learning, computer architecture, and software engineering.",
};

export const AWARDS: readonly Award[] = [
  {
    id: "dost-grand-prize",
    title: "DOST Grand Prize",
    startYear: 2025,
    endYear: null,
    context: "Scholar's Technopreneurship Training Program",
    summary:
      "MammoScan, an AI-powered early screening method for breast cancer using thermographic imaging and computer vision.",
    relatedProjectId: "mammoscan",
  },
  {
    id: "icpep-vp-internal",
    title: "VP Internal, ICPEP",
    startYear: 2024,
    endYear: 2025,
    context: "CIT-U Chapter",
    summary:
      "Vice-President Internal of the CIT-U Chapter of the Institute of Computer Engineers of the Philippines.",
    relatedProjectId: null,
  },
];

// ─── Contact ─────────────────────────────────────────────────────────────────

export const CONTACT: ContactDetails = {
  bookingUrl: null,
  email: "charlesluisgaid@gmail.com",
  letterOpening:
    "Tell me about the process that's eating your team's time. I'll tell you straight whether I can fix it.",
  formIntroduction:
    "Prefer writing? Leave a note here and it lands straight in my inbox.",
  channels: [
    {
      kind: "email",
      label: "Email",
      display: "charlesluisgaid@gmail.com",
      href: "mailto:charlesluisgaid@gmail.com",
    },
    {
      kind: "phone",
      label: "Phone",
      display: "+63 908 221 5034",
      href: "tel:+639082215034",
    },
    {
      kind: "github",
      label: "GitHub",
      display: "github.com/SibuyasGaid",
      href: "https://github.com/SibuyasGaid",
    },
    {
      kind: "linkedin",
      label: "LinkedIn",
      display: "linkedin.com/in/charlesluis-gaid-28739634a",
      href: "https://www.linkedin.com/in/charlesluis-gaid-28739634a",
    },
  ],
};
