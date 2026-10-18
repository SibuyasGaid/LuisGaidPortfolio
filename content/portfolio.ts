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

export type ProjectCategory = "automation" | "creator-tools" | "operations" | "engineering";

export type ProjectBadgeKind = "production" | "demo" | "prototype" | "team" | "competition" | "award" | "research";

export interface ProjectBadge {
  readonly kind: ProjectBadgeKind;
  readonly label: string;
}

/** Where a project's illustration plate leads when clicked. */
export interface ProjectLink {
  readonly kind: "website" | "video";
  readonly href: string;
}

/** Shown cropped to the plate's frame: 16:10 on small screens, taller beside the text on wide ones. */
export interface ProjectIllustration {
  readonly src: string;
  readonly alt: string;
  /** Which part of the picture the crop keeps (a CSS object-position); the middle if not given. */
  readonly focus?: string;
}

export interface Project {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly category: ProjectCategory;
  readonly badge: ProjectBadge | null;
  readonly problem: string | null;
  readonly solution: string;
  /** What it does, point by point, listed in the project's details. */
  readonly features: readonly string[];
  readonly stack: readonly string[];
  /** Shown as a book plate on featured cards; an engraved placeholder stands in until it is added. */
  readonly illustration: ProjectIllustration | null;
  readonly link: ProjectLink | null;
  /** Featured projects get full cards; the rest go in the archive index. */
  readonly isFeatured: boolean;
}

/** A short aside at the top of the Work book about what it can and can't show. */
export interface WorkNote {
  readonly title: string;
  readonly paragraphs: readonly string[];
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
      "I'm Charles Luis Gaid. I build custom software that takes a business's everyday problems off its hands. Sometimes that means connecting the tools you already use so they finally work together. Sometimes it means building a new one, because nothing out there fits.",
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
  "Most of the businesses I work with aren't short on software. They're short on software that fits. Leads sit in one app, orders in another, and someone loses half their week copying between them. I start by finding where the work actually gets stuck, then fix the cause instead of adding one more tool on top.",
  "If your tools are fine and just don't talk to each other, I connect them, with automations, integrations, and AI where it genuinely saves time. If the tool itself is the problem, I build you a new one: internal dashboards, client-facing apps, whatever your team will actually want to use, shaped around how you already work.",
  "Since late 2024 I've done this for medical platforms, real estate agencies, e-commerce brands, and content creators across Australia and the US. I own the whole job: scoping, architecture, the build, testing, and support after launch.",
  "My background is Computer Engineering. MammoScan, an AI breast cancer screening project built on thermal imaging and computer vision, was named Champion of the DOST Scholar's Technopreneurship Training Program (STTP) in 2025. I bring the same rigor to a client's lead pipeline that I brought to medical screening.",
];

export const ABOUT_FACTS: readonly Fact[] = [
  { label: "Clients", value: PROFILE.clientRegions },
  { label: "Time zones", value: "US, AU, and APAC" },
  { label: "What I build", value: "Custom software: connections between the tools you use, and new tools where they fall short" },
  { label: "Education", value: "BS Computer Engineering, CIT-U, 2026" },
];

// ─── Projects ────────────────────────────────────────────────────────────────

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  automation: "AI Automation",
  "creator-tools": "Content & Creator Tools",
  operations: "Business Operations",
  engineering: "Engineering / Research",
};

/** Client projects under NDA, which the Work book counts but can't describe. */
export const NDA_PROJECT_COUNT = 63;

export const WORK_NOTE: WorkNote = {
  title: "A note on what's here",
  paragraphs: [
    `These are the projects I can show. There are ${NDA_PROJECT_COUNT} more I can't, since they're under NDA.`,
    "Client projects without a link were built for that client alone, so I can share what they do but not the build or dashboard itself.",
  ],
};

const PRODUCTION_BADGE: ProjectBadge = { kind: "production", label: "Production" };
const LIVE_DEMO_BADGE: ProjectBadge = { kind: "demo", label: "Live demo" };
const PROTOTYPE_BADGE: ProjectBadge = { kind: "prototype", label: "Prototype" };
const TEAM_BADGE: ProjectBadge = { kind: "team", label: "Team project" };
const COMPETITION_BADGE: ProjectBadge = { kind: "competition", label: "Competition" };

export const PROJECTS = [
  {
    id: "marketing-platform",
    title: "Marketing Platform",
    subtitle: "AI Content Studio for Brands",
    category: "creator-tools",
    badge: LIVE_DEMO_BADGE,
    problem:
      "Keeping several brands posting every week takes on-brand graphics, clips and videos, plus someone to sign off on each piece before it goes out.",
    solution:
      "One studio for a brand's whole content pipeline. It generates on-brand graphics and carousels, turns long recordings into ranked, ready-to-post clips, writes a week of posts in one run, and renders avatar videos that speak a script. Everything waits in an approval queue until someone signs it off, and every AI call's cost is tracked.",
    features: [
      "Brand images and carousels from each account's presets, with faces matched to reference photos",
      "A week of Instagram and LinkedIn posts generated in one run",
      "Recordings transcribed once, with the best segments ranked for clipping",
      "Avatar videos that speak a script, in 9:16 for Reels, Shorts and Facebook",
      "An approval queue: nothing publishes until it's approved, or sent back for edits",
      "Each account's voice and visual identity steer everything made for it",
      "A competitor watchlist checked every Monday, with a digest for admins",
      "AI spend tracked by provider, task and run, with API alerts",
    ],
    stack: ["Next.js", "Anthropic API", "Gemini API", "HeyGen", "Vercel"],
    illustration: {
      src: "/projects/marketing-platform.webp",
      alt: "The platform's approval queue: a week of scheduled posts, each waiting to be approved or sent back for edits.",
      focus: "left top",
    },
    link: { kind: "website", href: "https://marketing-platform-ashy.vercel.app/" },
    isFeatured: true,
  },
  {
    id: "rena-malik-affiliates",
    title: "Rena Malik Affiliate Platform",
    subtitle: "Affiliate Program Portal",
    category: "operations",
    badge: PRODUCTION_BADGE,
    problem: null,
    solution: "The platform behind Dr. Rena Malik's affiliate program, running on its own domain at affiliates.renamalikmd.com.",
    features: [],
    stack: [],
    illustration: null,
    link: { kind: "website", href: "https://affiliates.renamalikmd.com/" },
    isFeatured: true,
  },
  {
    id: "iridel",
    title: "Iridel",
    subtitle: "Agency Website and Client Projects",
    category: "automation",
    badge: TEAM_BADGE,
    problem: null,
    solution:
      "Worked with the team at Iridel, Inc. on iridel.com, and contributed to the agency's client projects: custom n8n automation workflows and AI frameworks, built into the client-facing apps their developers shipped.",
    features: [
      "Helped the Iridel team build iridel.com",
      "Custom n8n automation workflows for the agency's clients",
      "AI frameworks for client projects",
      "Automations integrated into client-facing apps alongside the development team",
    ],
    stack: ["n8n"],
    illustration: null,
    link: { kind: "website", href: "https://iridel.com/" },
    isFeatured: true,
  },
  {
    id: "book-launch-pr-dashboard",
    title: "Launch Companion",
    subtitle: "Book Launch PR CRM",
    category: "creator-tools",
    badge: PRODUCTION_BADGE,
    problem:
      "A book launch meant pitching 80+ podcasts, influencers, and media outlets at once, with follow-ups that were easy to lose in an inbox.",
    solution:
      "Purpose-built CRM for a book launch's publicity: contacts, outreach campaigns, and influencer relationships in one structured place, tracking 80+ contacts across podcasts, influencers, and media. Behind it, 7 Make webhook endpoints handle Gmail reply detection, Sendr video triggers, automated follow-up scheduling, and per-contact automation toggles.",
    features: [
      "One home for 80+ podcast, influencer, and media contacts",
      "Outreach campaigns tracked alongside every relationship",
      "Gmail reply detection that marks who has written back",
      "Sendr videos and Bit.ly tracking links built into the outreach",
      "Automated follow-up scheduling, switchable for each contact",
      "7 Make webhook endpoints running the automation behind the dashboard",
    ],
    stack: ["React", "Supabase", "Make", "Gmail API", "Sendr", "Bit.ly"],
    illustration: null,
    link: null,
    isFeatured: true,
  },
  {
    id: "speakradar",
    title: "Speak Radar",
    subtitle: "Keynote Speaking Opportunity Finder",
    category: "creator-tools",
    badge: PRODUCTION_BADGE,
    problem:
      "Finding paid keynote opportunities meant trawling event listings by hand and writing a fresh pitch for each one.",
    solution:
      "Lead discovery and opportunity tracking for keynote speakers. An automated pipeline scrapes speaking events via Apify, scores relevance, and generates personalized AI pitch decks; CSV analysis and application tracking turn the results into an organized pipeline, with filtering and “Opens for Application” date handling.",
    features: [
      "Automated scraping of speaking events with Apify",
      "Relevance scoring for every event found",
      "Personalized AI pitch decks for each opportunity",
      "CSV analysis for imported event lists",
      "Application tracking that turns prospects into an organized pipeline",
      "Filters, plus handling for “Opens for Application” dates",
    ],
    stack: ["Apify", "OpenAI", "Make", "Supabase"],
    illustration: null,
    link: null,
    isFeatured: true,
  },
  {
    id: "guest-radar",
    title: "Guest Radar",
    subtitle: "Podcast Guest and Topic Research",
    category: "creator-tools",
    badge: PRODUCTION_BADGE,
    problem: null,
    solution:
      "AI-assisted research for a health and wellness podcast: finds guests and episode topics by analyzing online content and how guests perform across platforms, scoring credibility from social proof, media mentions, and audience fit. Supabase edge functions and Make handle the scoring and prioritization.",
    features: [
      "Finds guests and episode topics for a health and wellness podcast",
      "Analyzes each guest's online content and how they perform across platforms",
      "Credibility scores from social proof, media mentions, and audience fit",
      "Scoring and prioritization run on Supabase edge functions and Make",
    ],
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
    features: [
      "Voice conversations through Vapi, for hands-free use",
      "Text chat through Telegram",
      "Email management, by voice or text",
      "Calendar scheduling",
      "Task automation running on n8n",
    ],
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
    features: [
      "Pulls software companies actively advertising on Meta Ad Library",
      "Filters prospects by web traffic",
      "Finds the right contact email through Hunter.io",
      "Writes a personalized pitch for each company with OpenAI",
      "Sends through Resend on a configurable schedule",
    ],
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
    features: [
      "Picks up every new Meta Lead Ads form submission",
      "Adds each lead to Beehiiv as a subscriber straight away",
      "Tags new subscribers for segmentation",
    ],
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
    features: [
      "Picks up new YouTube and Instagram uploads automatically",
      "AI analysis of each upload with Perplexity and Gemini",
      "A review summary for every piece of content",
      "Optimization suggestions specific to each platform",
    ],
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
    features: [
      "Posts to Instagram, LinkedIn, Facebook, and Twitter from one app",
      "Formats each post for the platform it goes to",
      "Scheduling for posts ahead of time",
      "Integrations with GetLate and Substack",
    ],
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
    features: [
      "Runs on Supercast webhook events as they happen",
      "Tier-based logic for each subscription level",
      "Delivers each subscriber's content automatically",
      "Welcome sequences for new subscribers",
    ],
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
    features: [
      "Triggered by events in the CRM",
      "Enriches contact data before writing",
      "Context-aware messages written by AI",
      "Response-rate tracking to tune the outreach",
    ],
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
    features: [
      "Syncs CRM customer lists to Meta Custom Audiences automatically",
      "No more exporting and uploading CSVs by hand",
      "Source audiences stay current, so Lookalike Audiences keep refreshing",
      "Runs on n8n with the Meta Marketing API",
    ],
    stack: ["Meta Marketing API", "n8n", "CRM"],
    illustration: null,
    link: null,
    isFeatured: true,
  },
  {
    id: "workflow-watcher",
    title: "Workflow Watcher",
    subtitle: "Cross-Platform Operations Dashboard",
    category: "creator-tools",
    badge: null,
    problem: null,
    solution:
      "One operations dashboard for activity across Stripe, Beehiiv, and shipping: sales, newsletter enrollments, and fulfillment side by side, so operators can spot what's happening and follow each connected process from purchase to delivery.",
    features: [
      "Stripe sales, Beehiiv enrollments, and shipping on one dashboard",
      "Follow each connected process from purchase to delivery",
      "Activity kept in sync across platforms with webhooks",
      "Spot what's happening without opening three different tools",
    ],
    stack: ["React", "TypeScript", "Stripe API", "Beehiiv API", "Webhooks"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "prompt-builder-studio",
    title: "Prompt Builder Studio",
    subtitle: "Reusable Prompt Templates",
    category: "creator-tools",
    badge: null,
    problem: null,
    solution:
      "A studio for creating, organizing, and refining AI prompt templates together with the structured output each one should produce, so content workflows can be rerun and give consistent results.",
    features: [
      "Create and organize AI prompt templates in one studio",
      "Each template keeps the structured output it should produce",
      "Refine templates as your content needs change",
      "Reusable prompts for repeatable content workflows",
    ],
    stack: ["React", "TypeScript", "Tailwind CSS"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "content-creator-studio",
    title: "Content Creator Studio",
    subtitle: "Multi-Network Publishing Hub",
    category: "creator-tools",
    badge: null,
    problem: null,
    solution:
      "Create, schedule, and publish social posts and videos across multiple networks from one place, built for creators and teams running a steady multi-channel publishing pipeline.",
    features: [
      "Create social posts and videos in one place",
      "Schedule posts ahead of time",
      "Publish across multiple networks",
      "Planning and distribution in a single workflow",
    ],
    stack: ["React", "TypeScript", "Tailwind CSS"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "social-spark-analytics",
    title: "Social Spark Analytics",
    subtitle: "Cross-Platform Social Reporting",
    category: "creator-tools",
    badge: null,
    problem: null,
    solution:
      "Analytics dashboard that brings views, followers, and content performance from several social platforms into one consolidated view, so it's easy to compare channels and see what's working.",
    features: [
      "Metrics from several social platforms on one dashboard",
      "Views, followers, and content performance",
      "Compare channels side by side",
    ],
    stack: ["React", "TypeScript", "Tailwind CSS"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "podcast-publisher-ui",
    title: "Podcast Publisher UI",
    subtitle: "Front End for a WordPress Publishing Automation",
    category: "creator-tools",
    badge: null,
    problem: null,
    solution:
      "A simple form for everything a Make webhook needs to create a podcast page in WordPress, turning a raw automation payload into a publishing workflow anyone on the team can fill in.",
    features: [
      "A form for every detail the publishing automation needs",
      "Sends the details to a Make webhook that builds the podcast page in WordPress",
      "Lets anyone on the team publish without touching the automation",
    ],
    stack: ["React", "TypeScript", "Make", "WordPress", "Webhooks"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "content-creator-suite",
    title: "Content Creator Suite",
    subtitle: "A Python Creative Tool, Rebuilt for the Browser",
    category: "creator-tools",
    badge: PROTOTYPE_BADGE,
    problem: null,
    solution:
      "Two prototypes bringing an existing Streamlit and Python image-processing tool into the browser: working out what the original code does, then shaping it into a web interface that's easier to pick up.",
    features: [
      "Started from an existing Streamlit and Python image-processing tool",
      "Works out what the original code does before rebuilding it",
      "Two browser prototypes of the same tool",
      "A web interface that's easier to pick up than the original",
    ],
    stack: ["Python", "Streamlit", "React", "TypeScript"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "request-tracker",
    title: "Request Tracker",
    subtitle: "Project Requests and Status",
    category: "operations",
    badge: null,
    problem: null,
    solution:
      "Request and status tracking for project work: what's outstanding, what's been done, and what still needs attention, visible at a glance to everyone on the project.",
    features: [
      "Every outstanding request in one list",
      "A clear status on each request",
      "Completed work kept on record",
      "Highlights what still needs attention",
    ],
    stack: ["React", "TypeScript", "Tailwind CSS"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "contract-creator-pro",
    title: "Contract Creator Pro",
    subtitle: "Service Agreements, Start to Finish",
    category: "operations",
    badge: null,
    problem: null,
    solution:
      "Contract generation and management for service agreements: upload templates, edit agreements, collect e-signatures, and handle invoicing, all the steps of agreement admin in one tool.",
    features: [
      "Upload your own contract templates",
      "Edit agreements in the app",
      "Collect e-signatures",
      "Invoicing alongside the agreement",
    ],
    stack: ["React", "TypeScript", "Tailwind CSS"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "contract-hub",
    title: "Contract Hub",
    subtitle: "Client and Admin Contract Portal",
    category: "operations",
    badge: PROTOTYPE_BADGE,
    problem: null,
    solution:
      "Contract management site with separate experiences for clients and administrators: a client-facing area for their agreements, and an admin view for managing them.",
    features: [
      "A client-facing area for each client's agreements",
      "A separate admin view for managing contracts",
      "Role-separated access, with prototype-level sign-in for now",
    ],
    stack: ["React", "TypeScript", "Tailwind CSS"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "medical-keyword-finder",
    title: "Medical Keyword Finder",
    subtitle: "SEO Research for Health Content",
    category: "operations",
    badge: null,
    problem: null,
    solution:
      "Keyword research for medical and health content: connects keyword research services and uses search volume and related keywords to surface topics with real search potential.",
    features: [
      "Connects to keyword research services",
      "Search volume for each keyword",
      "Related keyword suggestions",
      "Surfaces medical and health topics worth writing about",
    ],
    stack: ["React", "TypeScript", "Keyword research APIs"],
    illustration: null,
    link: null,
    isFeatured: false,
  },
  {
    id: "mammoscan",
    title: "MammoScan",
    subtitle: "AI Breast Cancer Screening",
    category: "engineering",
    badge: { kind: "award", label: "STTP Champion" },
    problem: null,
    solution:
      "AI-powered early screening method for breast cancer using thermographic imaging and computer vision. Champion of the DOST Scholar's Technopreneurship Training Program (STTP) competition.",
    features: [
      "Early breast cancer screening from thermographic images",
      "No contact and no radiation, unlike a mammogram",
      "Computer vision with a CNN classifier",
      "Champion of the DOST STTP competition in 2025",
    ],
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
    features: [
      "Screens for diabetic peripheral neuropathy from thermal scans of the feet",
      "CNN classifier running on an ESP32-S3",
      "AWS IoT Core integration",
      "PyQt5 desktop interface",
      "My BS Computer Engineering thesis",
    ],
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
    features: [
      "Maps seagrass meadows from Sentinel-2 satellite imagery",
      "Estimates the blue carbon they store",
      "Built on Google Earth Engine and deep learning",
      "Later reframed as a fisher-first community tool",
      "Entry to the AI ASEAN READY Youth Challenge 2026",
    ],
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
    features: [
      "Translates Akkadian cuneiform with ByT5 transformer models",
      "Byte-level models, suited to an ancient script",
      "Entry to the Deep Past Challenge on Kaggle",
      "Part of my CPE432 coursework",
    ],
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
      "SMS bots on Closebot, and follow-up triggered by events in your CRM",
      "Calendar booking and email handling",
      "Chat interfaces on Telegram and similar channels",
    ],
    tools: ["Retell AI", "Vapi", "Closebot", "Twilio", "Telegram API", "OpenAI API", "Anthropic API"],
    proofProjectIds: ["aiva", "ai-cold-sms-agent"],
  },
  {
    id: "crm-systems",
    title: "CRM and GoHighLevel systems",
    summary:
      "Pipelines and automations inside GoHighLevel or the CRM you already run, so leads get followed up on time and your ad audiences stay in sync with your real customer list.",
    deliverables: [
      "GoHighLevel setups: pipelines, workflows, triggers, and snapshots",
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
      "marketing-platform",
      "book-launch-pr-dashboard",
      "speakradar",
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
      "Mistral",
      "OpenRouter",
      "Retell AI",
      "Vapi",
      "Closebot",
      "Twilio",
      "Inngest",
      "Vercel Cron",
      "Apify",
      "HeyGen",
      "Meta Graph API",
      "Custom webhooks & REST APIs",
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
    items: ["React", "Next.js", "Vue.js", "Tailwind CSS", "HTML5/CSS3"],
  },
  {
    id: "backend",
    title: "Backend & Frameworks",
    items: ["Node.js", "Express.js", ".NET / ASP.NET", "Zod", "Supabase Edge Functions"],
  },
  {
    id: "databases",
    title: "Databases",
    items: ["PostgreSQL", "Supabase", "MySQL", "MongoDB", "SQLite", "Firebase", "Pinecone"],
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    items: [
      "TensorFlow",
      "Keras",
      "PyTorch",
      "scikit-learn",
      "OpenCV",
      "Hugging Face Transformers",
      "YOLO",
      "CNNs",
      "Pandas",
      "NumPy",
      "Matplotlib",
    ],
  },
  {
    id: "cloud",
    title: "Cloud & Hosting",
    items: ["Vercel", "AWS", "Azure", "Google Cloud", "Firebase Hosting"],
  },
  {
    id: "devops",
    title: "DevOps & Tools",
    items: ["Git/GitHub", "Docker", "Jest", "Vitest", "npm audit"],
  },
  {
    id: "design",
    title: "Design & Prototyping",
    items: ["Figma", "Canva", "SketchUp"],
  },
  {
    id: "productivity",
    title: "Productivity",
    items: ["Notion", "Google Workspace", "Microsoft 365"],
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
    id: "ai-automation-agency",
    title: "Tech Automation Specialist",
    organization: "AI Automation Agency",
    start: "2026-03",
    end: "2026-08",
    summary:
      "Built and delivered custom n8n automations, Retell voice bots, Closebot SMS bots, and AI frameworks for the agency's Australian clients. Handled custom GoHighLevel setups, automations, triggers, and snapshots, wrote SOPs and technical documentation for handoff, and gave clients hands-on tech support as needed.",
  },
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
      "Embedded within the company to find operational bottlenecks and build AI-driven systems that removed manual overhead across data handling, document workflows, social media, ad pipelines, and internal communications. Built custom web apps and dashboards as front ends for the automations, so non-technical staff could run them on their own. Owned every AI automation initiative end to end, with SOPs and technical documentation for handoff and onboarding.",
  },
  {
    id: "ace-1",
    title: "AI/Software Developer",
    organization: "ACE-1 IT Solutions, Inc.",
    start: "2024-12",
    end: "2025-10",
    summary:
      "Designed and delivered end-to-end AI agent and automation solutions for Australian clients across real estate and e-commerce industries. Owned full project lifecycle: client discovery, scoping, architecture, implementation, testing, and deployment. Maintained and iterated on live systems from client feedback, and handled documentation and cloud server setup for hosted automations.",
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
    id: "sttp-champion",
    title: "STTP Champion",
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
      display: "linkedin.com/in/charles-luis-gaid-28739634a",
      href: "https://www.linkedin.com/in/charles-luis-gaid-28739634a",
    },
  ],
};
