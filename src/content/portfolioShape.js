// The shape, version and safe class palettes for portfolio content.
//
// Tailwind v4 generates classes by scanning source files — class strings that
// live only in database content would never exist in the stylesheet. The Edit
// forms only offer classes from these two palettes, and every palette entry is
// spelled out here in scanned source, so any class stored through the UI is
// guaranteed to be generated.

// v2: version-1 rows carried the old single-user site's project list (51
// identical filler rows plus one placeholder). The platform starts every
// portfolio's projects empty — owners add their own (see normalizeContent).
export const CONTENT_VERSION = 2;

// Hero badge backgrounds. The first entry overrides the template's text-white
// with text-gray-800, exactly as the original hardcoded content did.
export const SKILL_COLOR_OPTIONS = [
  "bg-yellow-400 text-gray-800",
  "bg-indigo-500",
  "bg-green-500",
  "bg-sky-500",
  "bg-pink-500",
];

// Accent span styles offered for rich text fields (`**accent**` markers).
export const ACCENT_CLASS_OPTIONS = [
  "text-sky-400 font-medium",
  "font-semibold text-white",
];

const isRichText = (value) =>
  Boolean(value) &&
  typeof value !== "string" &&
  typeof value.text === "string";

const richText = (value, fallback) =>
  isRichText(value)
    ? {
        text: value.text,
        accentClass: ACCENT_CLASS_OPTIONS.includes(value.accentClass)
          ? value.accentClass
          : fallback.accentClass,
      }
    : { ...fallback };

// Minimal last-resort defaults — used only when a stored row is missing or
// unparsable, so no page ever renders blank or crashes on bad data.
const lastResortContent = {
  version: CONTENT_VERSION,
  brand: "My Portfolio",
  hero: {
    greeting: "Hi, I'm here",
    title: "Frontend Developer",
    bio: {
      text: "This portfolio is almost ready — **open Edit portfolio** to tell your story.",
      accentClass: "text-sky-400 font-medium",
    },
    skills: [],
  },
  about: {
    paragraphs: [
      {
        text: "Your about story goes here — **edit it any time**.",
        accentClass: "text-sky-400 font-medium",
      },
    ],
  },
  skills: [],
  projects: [],
  contact: {
    intro: "Let's create something amazing together!",
    mail: { href: "#", label: "you@example.com" },
    github: { href: "#", label: "github.com/yourusername" },
    linkedin: { href: "#", label: "linkedin.com/in/yourprofile" },
    extras: [],
  },
};

// Merges a parsed Content string onto fallback content section by section, so
// partial rows render fully. Falls back to lastResortContent when `fallback`
// (e.g. the user's starter) is not available.
export function normalizeContent(raw, fallback = lastResortContent) {
  const base = fallback;
  const raw_ = raw && typeof raw === "object" ? raw : {};

  const heroRaw = raw_.hero ?? {};
  const aboutRaw = raw_.about ?? {};
  const contactRaw = raw_.contact ?? {};

  const skillList = Array.isArray(raw_.skills)
    ? raw_.skills.filter((s) => typeof s === "string" && s.trim() !== "")
    : base.skills;

  // v1→v2 migration: version-1 rows show zero projects — their list was the
  // old site's transcription, nothing the owner added. Anything saved through
  // the app is version 2 and keeps its projects untouched.
  const projectsSource =
    Array.isArray(raw_.projects) && raw_.version === 1 ? [] : raw_.projects;

  const projects = Array.isArray(projectsSource)
    ? projectsSource
        .filter((p) => p && typeof p.title === "string")
        .map((p) => ({
          id:
            typeof p.id === "string" && p.id
              ? p.id
              : typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `p-${Math.random().toString(16).slice(2)}`,
          title: p.title,
          desc: typeof p.desc === "string" ? p.desc : "",
          github: typeof p.github === "string" ? p.github : "#",
          live: typeof p.live === "string" ? p.live : "#",
        }))
    : base.projects;

  const paragraphs = Array.isArray(aboutRaw.paragraphs)
    ? aboutRaw.paragraphs
        .filter(isRichText)
        .map((p, i) =>
          richText(p, base.about.paragraphs[i] ?? base.about.paragraphs[0])
        )
    : base.about.paragraphs;

  const heroSkills = Array.isArray(heroRaw.skills)
    ? heroRaw.skills
        .filter((s) => s && typeof s.name === "string")
        .map((s) => ({
          name: s.name,
          color: SKILL_COLOR_OPTIONS.includes(s.color)
            ? s.color
            : base.hero.skills[0]?.color ?? SKILL_COLOR_OPTIONS[0],
        }))
    : base.hero.skills;

  const link = (value, fb) =>
    value && typeof value === "object"
      ? {
          href: typeof value.href === "string" ? value.href : fb.href,
          label: typeof value.label === "string" ? value.label : fb.label,
        }
      : { ...fb };

  const newId = (prefix) =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${prefix}-${Math.random().toString(16).slice(2)}`;

  const extras = Array.isArray(contactRaw.extras)
    ? contactRaw.extras
        .filter(
          (e) =>
            e &&
            typeof e.label === "string" &&
            typeof e.href === "string"
        )
        .map((e) => ({
          id: typeof e.id === "string" && e.id ? e.id : newId("contact"),
          label: e.label,
          href: e.href,
        }))
    : base.contact.extras;

  return {
    version: CONTENT_VERSION,
    brand:
      typeof raw_.brand === "string" && raw_.brand.trim() !== ""
        ? raw_.brand
        : base.brand,
    hero: {
      greeting:
        typeof heroRaw.greeting === "string" && heroRaw.greeting.trim() !== ""
          ? heroRaw.greeting
          : base.hero.greeting,
      title:
        typeof heroRaw.title === "string" && heroRaw.title.trim() !== ""
          ? heroRaw.title
          : base.hero.title,
      bio: richText(heroRaw.bio, base.hero.bio),
      skills: heroSkills,
    },
    about: { paragraphs },
    skills: skillList,
    projects,
    contact: {
      intro:
        typeof contactRaw.intro === "string" && contactRaw.intro.trim() !== ""
          ? contactRaw.intro
          : base.contact.intro,
      mail: link(contactRaw.mail, base.contact.mail),
      github: link(contactRaw.github, base.contact.github),
      linkedin: link(contactRaw.linkedin, base.contact.linkedin),
      extras,
    },
  };
}
