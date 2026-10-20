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

const newId = (prefix) =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Math.random().toString(16).slice(2)}`;

// The CV pages a section can live on — mirrors the navbar, so in CV mode
// every page has content. Sections default to the Intro page; the editor's
// "Show on" select moves them.
export const CV_PAGES = [
  { key: "intro", label: "Intro" },
  { key: "about", label: "About" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Projects" },
  { key: "contact", label: "Contact" },
];

const CV_PAGE_KEYS = CV_PAGES.map((page) => page.key);

// CV sections are generic on purpose: three shapes cover every profession.
// "entry" = Experience/Education/Certifications/Projects (heading + place +
// period + details), "list" = Skills/Languages/Activities, "text" = free
// paragraphs. The section TITLE carries the profession's own wording.
const CV_SECTION_TYPES = ["entry", "list", "text"];

const CV_DEFAULT_SECTION_TITLE = {
  entry: "Details",
  list: "List",
  text: "Notes",
};

const normalizeCvItems = (type, raw) => {
  if (!Array.isArray(raw)) return [];
  if (type === "entry") {
    return raw
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        id: typeof item.id === "string" && item.id ? item.id : newId("cvi"),
        heading: typeof item.heading === "string" ? item.heading : "",
        sub: typeof item.sub === "string" ? item.sub : "",
        period: typeof item.period === "string" ? item.period : "",
        details: typeof item.details === "string" ? item.details : "",
      }));
  }
  return raw
    .filter(
      (item) =>
        typeof item === "string" ||
        (item && typeof item === "object" && typeof item.text === "string")
    )
    .map((item) => ({
      id:
        item && typeof item === "object" && typeof item.id === "string" && item.id
          ? item.id
          : newId("cvi"),
      text: typeof item === "string" ? item : item.text ?? "",
    }));
};

// Profession presets for the CV editor — each seeds the sections that
// profession actually needs. Every preset follows the one standard order
// (experience → education → skills → projects & achievements →
// certifications → languages), with the profession's own wording where it
// helps. Optional sections (Projects, Certifications, References) are
// seeded only where they earn their place, so no template opens with empty
// boxes — and everything can be renamed, reordered, added or removed after.
// The first preset is the exception on purpose: it ships with its whole CV
// written, a filled example users overwrite with their own story.
export const CV_PRESETS = [
  {
    key: "software-example",
    label: "Software & IT — filled example",
    // The one template that ships with its CV already written: every
    // section carries realistic starter content to overwrite, so the
    // picked CV reads as a complete document before a single edit.
    sections: [
      {
        type: "text",
        title: "Professional Summary",
        items: [
          {
            text: "Frontend developer with 2+ years of hands-on experience building fast, accessible web applications with React and modern tooling. Comfortable owning a feature from design hand-off to production, and happiest when the codebase stays clean and the UI feels effortless.",
          },
        ],
      },
      {
        type: "entry",
        title: "Work Experience",
        items: [
          {
            heading: "Software Engineering Intern",
            sub: "SELISE Group — Dhaka, Bangladesh",
            period: "Feb 2025 — Present",
            details:
              "• Build and maintain production React features for an enterprise platform\n• Collaborate with senior engineers on code review, testing and CI\n• Delivered shared design-system components now used by three teams",
          },
          {
            heading: "Freelance Web Developer",
            sub: "Self-employed — Remote",
            period: "2023 — 2025",
            details:
              "• Shipped 6+ client websites with React, Next.js and Tailwind CSS\n• Raised average Lighthouse performance scores from 62 to 94\n• Handled everything client-facing: scoping, estimates and demos",
          },
        ],
      },
      {
        type: "entry",
        title: "Education",
        items: [
          {
            heading: "BSc in Computer Science & Engineering",
            sub: "University of Dhaka",
            period: "2019 — 2023",
            details:
              "CGPA 3.74 / 4.00 · Final-year project: a real-time collaborative markdown editor",
          },
        ],
      },
      {
        type: "list",
        title: "Skills",
        items: [
          { text: "React.js" },
          { text: "JavaScript (ES6+)" },
          { text: "TypeScript" },
          { text: "Tailwind CSS" },
          { text: "Next.js" },
          { text: "Git & GitHub" },
        ],
      },
      {
        type: "entry",
        title: "Projects & Achievements",
        items: [
          {
            heading: "Portfolio & CV Builder",
            sub: "React · Vite · Tailwind CSS",
            period: "2026",
            details:
              "A platform where anyone can build their own portfolio and a profession-tailored CV, then publish both.",
          },
          {
            heading: "Task Manager",
            sub: "React · Local Storage",
            period: "2025",
            details:
              "A drag-and-drop task board with deadlines, labels and offline persistence.",
          },
        ],
      },
      {
        type: "list",
        title: "Languages",
        items: [{ text: "Bengali — Native" }, { text: "English — Fluent" }],
      },
      {
        type: "text",
        title: "References",
        items: [{ text: "Available upon request." }],
      },
    ],
  },
  {
    key: "software",
    label: "Software & IT",
    sections: [
      { type: "entry", title: "Work Experience" },
      { type: "entry", title: "Education" },
      { type: "list", title: "Skills" },
      { type: "entry", title: "Projects" },
      { type: "entry", title: "Certifications & Training" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "health",
    label: "Healthcare",
    sections: [
      { type: "entry", title: "Clinical Experience" },
      { type: "entry", title: "Education & Training" },
      { type: "list", title: "Skills" },
      { type: "entry", title: "Licenses & Certifications" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "teaching",
    label: "Teaching & Education",
    sections: [
      { type: "entry", title: "Teaching Experience" },
      { type: "entry", title: "Education" },
      { type: "list", title: "Subjects & Skills" },
      { type: "entry", title: "Certifications" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "business",
    label: "Business & Finance",
    sections: [
      { type: "entry", title: "Work Experience" },
      { type: "entry", title: "Education" },
      { type: "list", title: "Skills" },
      { type: "entry", title: "Projects & Achievements" },
      { type: "entry", title: "Certifications & Training" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "creative",
    label: "Design & Creative",
    sections: [
      { type: "entry", title: "Experience" },
      { type: "entry", title: "Education" },
      { type: "entry", title: "Selected Work" },
      { type: "list", title: "Tools & Skills" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "student",
    label: "Student / Fresh Graduate",
    // Education leads; no Work Experience or Certifications — a fresh
    // graduate's CV without the irrelevant empty boxes.
    sections: [
      { type: "entry", title: "Education" },
      { type: "entry", title: "Internships & Volunteering" },
      { type: "list", title: "Skills" },
      { type: "entry", title: "Projects & Achievements" },
      { type: "list", title: "Activities" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "generic",
    label: "General",
    // The full standard skeleton — the one template that fits any job,
    // References included with its conventional starter line.
    sections: [
      { type: "entry", title: "Work Experience" },
      { type: "entry", title: "Education" },
      { type: "list", title: "Skills" },
      { type: "entry", title: "Projects & Achievements" },
      { type: "entry", title: "Certifications & Training" },
      { type: "list", title: "Languages" },
      {
        type: "text",
        title: "References",
        items: [{ text: "Available upon request." }],
      },
    ],
  },
];

// Fresh sections from a preset: new ids, empty items — unless the preset
// carries starter items (General's References begins "Available upon
// request."; the filled example carries its whole CV). Shared by the
// editor's profession picker and the My CV template gallery, so both grow
// the same way.
export const seedSections = (preset) =>
  preset.sections.map((section) => ({
    id: newId("cvs"),
    type: section.type,
    title: section.title,
    page: section.page ?? "intro",
    items: (section.items ?? []).map((item) => ({
      id: newId("cvi"),
      ...item,
    })),
  }));

// The standard section set every professional CV draws from — the editor's
// Add-section row offers these as one-click chips (titles the CV already
// has are hidden), so the optional ones are easy to add when relevant.
// Personal Information and Professional Summary are the CV headline's own
// fields, so they are not sections here.
export const STANDARD_SECTIONS = [
  { title: "Work Experience", type: "entry" },
  { title: "Education", type: "entry" },
  { title: "Skills", type: "list" },
  { title: "Projects & Achievements", type: "entry" },
  { title: "Certifications & Training", type: "entry" },
  { title: "Languages", type: "list" },
  { title: "References", type: "text" },
];

// CV-mode hero defaults — derived from the portfolio's own hero so every
// user's CV view starts personal (same title, skills and picture) with a
// CV-flavored greeting and summary. The CV editor grows more sections later.
// Exported so the editor can seed a brand-new CV with the same guarantees.
// `contact` is the personal-information strip (city, phone, email, one
// optional link) under the headline — empty until the owner fills it in.
export const defaultCvFor = (base) => ({
  greeting: "Curriculum Vitae",
  title: base.hero.title,
  bio: {
    text: "The structured, hiring-ready view of my **experience, education and skills**.",
    accentClass: "text-sky-400 font-medium",
  },
  skills: base.hero.skills,
  contact: { location: "", phone: "", email: "", link: "" },
});

// The CV a viewer should see: the one the owner marked active, falling back
// to the first of their CVs — and to the legacy single-`cv` shape for content
// that never went through normalizeContent.
export function getActiveCv(content) {
  if (!content) return null;
  if (Array.isArray(content.cvs) && content.cvs.length > 0) {
    return (
      content.cvs.find((cv) => cv.id === content.activeCvId) ?? content.cvs[0]
    );
  }
  return content.cv ?? null;
}

// The portfolio a viewer sees / the owner edits: the one marked active,
// falling back to the first of their portfolios — and to the content itself
// for the legacy shape, whose fields live at the root.
export function getActivePortfolio(content) {
  if (!content) return null;
  if (Array.isArray(content.portfolios) && content.portfolios.length > 0) {
    return (
      content.portfolios.find((p) => p.id === content.activePortfolioId) ??
      content.portfolios[0]
    );
  }
  return content;
}

// Blank starting fields for a brand-new portfolio — neutral placeholders,
// never a clone of an existing portfolio. The shelf adds the id and list
// name around these.
export const blankPortfolioFields = () => ({
  hero: {
    greeting: "Hi, I'm here",
    title: "Your title here",
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
});

// Same guarantees as the hero block, for the CV view's fields.
export function normalizeCv(raw, fallback) {
  const raw_ = raw && typeof raw === "object" ? raw : {};
  const skills = Array.isArray(raw_.skills)
    ? raw_.skills
        .filter((s) => s && typeof s.name === "string")
        .map((s) => ({
          name: s.name,
          color: SKILL_COLOR_OPTIONS.includes(s.color)
            ? s.color
            : fallback.skills[0]?.color ?? SKILL_COLOR_OPTIONS[0],
        }))
    : fallback.skills;
  const sections = Array.isArray(raw_.sections)
    ? raw_.sections
        .filter((s) => s && typeof s === "object")
        .map((s) => {
          const type = CV_SECTION_TYPES.includes(s.type) ? s.type : "entry";
          return {
            id: typeof s.id === "string" && s.id ? s.id : newId("cvs"),
            type,
            page: CV_PAGE_KEYS.includes(s.page) ? s.page : "intro",
            title:
              typeof s.title === "string" && s.title.trim() !== ""
                ? s.title
                : CV_DEFAULT_SECTION_TITLE[type],
            items: normalizeCvItems(type, s.items),
          };
        })
    : Array.isArray(fallback.sections)
      ? fallback.sections
      : [];
  // Personal information strip — plain strings; anything unfilled falls
  // back to the seed's (empty) value, never breaks on old rows.
  const contactRaw = raw_.contact ?? {};
  const fbContact =
    fallback.contact ?? { location: "", phone: "", email: "", link: "" };
  const contactField = (value, fb) =>
    typeof value === "string" && value.trim() !== "" ? value : fb;
  return {
    greeting:
      typeof raw_.greeting === "string" && raw_.greeting.trim() !== ""
        ? raw_.greeting
        : fallback.greeting,
    title:
      typeof raw_.title === "string" && raw_.title.trim() !== ""
        ? raw_.title
        : fallback.title,
    bio: richText(raw_.bio, fallback.bio),
    skills,
    sections,
    contact: {
      location: contactField(contactRaw.location, fbContact.location),
      phone: contactField(contactRaw.phone, fbContact.phone),
      email: contactField(contactRaw.email, fbContact.email),
      link: contactField(contactRaw.link, fbContact.link),
    },
  };
}

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

// Normalizes one portfolio's content fields (hero, about, skills, projects,
// contact) against a fallback portfolio of the same shape. A portfolio
// carrying `version: 1` drops its project list — that was the old single-user
// site's transcription, nothing the owner added (see the legacy adoption in
// normalizePortfolios).
const normalizePortfolioFields = (pf, fb) => {
  const heroRaw = pf.hero ?? {};
  const aboutRaw = pf.about ?? {};
  const contactRaw = pf.contact ?? {};

  const skillList = Array.isArray(pf.skills)
    ? pf.skills.filter((s) => typeof s === "string" && s.trim() !== "")
    : fb.skills;

  const projectsSource =
    Array.isArray(pf.projects) && pf.version === 1 ? [] : pf.projects;

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
    : fb.projects;

  const paragraphs = Array.isArray(aboutRaw.paragraphs)
    ? aboutRaw.paragraphs
        .filter(isRichText)
        .map((p, i) =>
          richText(p, fb.about.paragraphs[i] ?? fb.about.paragraphs[0])
        )
    : fb.about.paragraphs;

  const heroSkills = Array.isArray(heroRaw.skills)
    ? heroRaw.skills
        .filter((s) => s && typeof s.name === "string")
        .map((s) => ({
          name: s.name,
          color: SKILL_COLOR_OPTIONS.includes(s.color)
            ? s.color
            : fb.hero.skills[0]?.color ?? SKILL_COLOR_OPTIONS[0],
        }))
    : fb.hero.skills;

  const link = (value, fbL) =>
    value && typeof value === "object"
      ? {
          href: typeof value.href === "string" ? value.href : fbL.href,
          label: typeof value.label === "string" ? value.label : fbL.label,
        }
      : { ...fbL };

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
    : fb.contact.extras;

  return {
    hero: {
      greeting:
        typeof heroRaw.greeting === "string" && heroRaw.greeting.trim() !== ""
          ? heroRaw.greeting
          : fb.hero.greeting,
      title:
        typeof heroRaw.title === "string" && heroRaw.title.trim() !== ""
          ? heroRaw.title
          : fb.hero.title,
      bio: richText(heroRaw.bio, fb.hero.bio),
      skills: heroSkills,
    },
    about: { paragraphs },
    skills: skillList,
    projects,
    contact: {
      intro:
        typeof contactRaw.intro === "string" && contactRaw.intro.trim() !== ""
          ? contactRaw.intro
          : fb.contact.intro,
      mail: link(contactRaw.mail, fb.contact.mail),
      github: link(contactRaw.github, fb.contact.github),
      linkedin: link(contactRaw.linkedin, fb.contact.linkedin),
      extras,
    },
  };
};

// Multi-portfolio: `portfolios` holds every showcase the owner builds and
// `activePortfolioId` picks the one the whole portfolio mode shows. Legacy
// rows carry the fields at the root — they are adopted as the first (and
// active) portfolio, so nothing is lost or duplicated.
const normalizePortfolios = (raw_, base) => {
  const legacyEntry = {
    id: "pf-1",
    name: "My Portfolio",
    version: raw_.version,
    hero: raw_.hero,
    about: raw_.about,
    skills: raw_.skills,
    projects: raw_.projects,
    contact: raw_.contact,
  };
  const rawPortfolios =
    Array.isArray(raw_.portfolios) && raw_.portfolios.length > 0
      ? raw_.portfolios
      : [legacyEntry];
  const portfolios = rawPortfolios.map((pf, index) => {
    // The first portfolio falls back to the row's starter content; every
    // additional one falls back to the blank defaults, never a clone of
    // another portfolio.
    const fields = normalizePortfolioFields(
      pf && typeof pf === "object" ? pf : {},
      index === 0 ? base : lastResortContent
    );
    return {
      id: typeof pf?.id === "string" && pf.id ? pf.id : `pf-${index + 1}`,
      name:
        typeof pf?.name === "string" && pf.name.trim() !== ""
          ? pf.name
          : rawPortfolios.length > 1
            ? `Portfolio ${index + 1}`
            : "My Portfolio",
      hero: fields.hero,
      about: fields.about,
      skills: fields.skills,
      projects: fields.projects,
      contact: fields.contact,
    };
  });
  const activePortfolioId = portfolios.some(
    (p) => p.id === raw_.activePortfolioId
  )
    ? raw_.activePortfolioId
    : portfolios[0].id;
  return { portfolios, activePortfolioId };
};

// Merges a parsed Content string onto fallback content section by section, so
// partial rows render fully. Falls back to lastResortContent when `fallback`
// (e.g. the user's starter) is not available.
export function normalizeContent(raw, fallback = lastResortContent) {
  const base = fallback;
  const raw_ = raw && typeof raw === "object" ? raw : {};

  const { portfolios, activePortfolioId } = normalizePortfolios(raw_, base);
  const activePortfolio = portfolios.find((p) => p.id === activePortfolioId);

  // Multi-CV: `cvs` holds every CV the owner builds and `activeCvId` picks
  // the one the public CV tab shows. Legacy rows carry a single `cv` — it is
  // adopted as the first (and active) CV so nothing is lost or duplicated.
  // The CV defaults derive from the ACTIVE portfolio's hero, so a new CV is
  // always personal to what the visitor would see.
  const cvFallback =
    base.cv ??
    defaultCvFor({
      hero: {
        title: activePortfolio.hero.title,
        skills: activePortfolio.hero.skills,
      },
    });
  // An explicitly empty `cvs` stays empty — the owner deleted every CV and
  // the shelf shows its empty state. Only rows without a `cvs` array at all
  // adopt the legacy single CV, or get a synthesized first one.
  const rawCvs = Array.isArray(raw_.cvs)
    ? raw_.cvs
    : raw_.cv
      ? [raw_.cv]
      : [cvFallback];
  const cvs = rawCvs.map((cv, index) => ({
    ...normalizeCv(cv, cvFallback),
    id: typeof cv?.id === "string" && cv.id ? cv.id : `cv-${index + 1}`,
    name:
      typeof cv?.name === "string" && cv.name.trim() !== ""
        ? cv.name
        : rawCvs.length > 1
          ? `CV ${index + 1}`
          : "My CV",
  }));
  const activeCvId = cvs.some((cv) => cv.id === raw_.activeCvId)
    ? raw_.activeCvId
    : (cvs[0]?.id ?? null);
  const activeCv = cvs.find((cv) => cv.id === activeCvId) ?? null;

  return {
    version: CONTENT_VERSION,
    brand:
      typeof raw_.brand === "string" && raw_.brand.trim() !== ""
        ? raw_.brand
        : base.brand,
    portfolios,
    activePortfolioId,
    // Mirrors of the ACTIVE portfolio (and its shelf name) — every page
    // component keeps reading content.hero / content.about / … exactly as
    // before, whichever portfolio is active.
    name: activePortfolio.name,
    hero: activePortfolio.hero,
    about: activePortfolio.about,
    skills: activePortfolio.skills,
    projects: activePortfolio.projects,
    contact: activePortfolio.contact,
    cvs,
    activeCvId,
    // `cv` mirrors the active CV — every legacy reader (and older saved
    // rows) keeps working untouched.
    cv: activeCv,
  };
}
