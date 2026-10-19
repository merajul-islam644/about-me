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
// profession actually needs. Titles are editable afterwards, and any
// section can be added, removed or reordered, so these are starting
// points, not fixed templates.
export const CV_PRESETS = [
  {
    key: "software",
    label: "Software & IT",
    sections: [
      { type: "entry", title: "Work Experience" },
      { type: "list", title: "Skills" },
      { type: "entry", title: "Projects" },
      { type: "entry", title: "Education" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "health",
    label: "Healthcare",
    sections: [
      { type: "entry", title: "Education & Training" },
      { type: "entry", title: "Licenses & Certifications" },
      { type: "entry", title: "Clinical Experience" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "teaching",
    label: "Teaching & Education",
    sections: [
      { type: "entry", title: "Education" },
      { type: "entry", title: "Certifications" },
      { type: "entry", title: "Teaching Experience" },
      { type: "list", title: "Subjects & Skills" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "business",
    label: "Business & Finance",
    sections: [
      { type: "entry", title: "Work Experience" },
      { type: "entry", title: "Education" },
      { type: "entry", title: "Certifications" },
      { type: "list", title: "Skills" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "creative",
    label: "Design & Creative",
    sections: [
      { type: "entry", title: "Experience" },
      { type: "entry", title: "Selected Work" },
      { type: "list", title: "Tools & Skills" },
      { type: "entry", title: "Education" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "student",
    label: "Student / Fresh Graduate",
    sections: [
      { type: "entry", title: "Education" },
      { type: "entry", title: "Internships & Volunteering" },
      { type: "list", title: "Skills" },
      { type: "list", title: "Activities" },
      { type: "list", title: "Languages" },
    ],
  },
  {
    key: "generic",
    label: "General",
    sections: [
      { type: "entry", title: "Work Experience" },
      { type: "entry", title: "Education" },
      { type: "list", title: "Skills" },
      { type: "list", title: "Languages" },
    ],
  },
];

// CV-mode hero defaults — derived from the portfolio's own hero so every
// user's CV view starts personal (same title, skills and picture) with a
// CV-flavored greeting and summary. The CV editor grows more sections later.
// Exported so the editor can seed a brand-new CV with the same guarantees.
export const defaultCvFor = (base) => ({
  greeting: "Curriculum Vitae",
  title: base.hero.title,
  bio: {
    text: "The structured, hiring-ready view of my **experience, education and skills**.",
    accentClass: "text-sky-400 font-medium",
  },
  skills: base.hero.skills,
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
  const rawCvs =
    Array.isArray(raw_.cvs) && raw_.cvs.length > 0
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
    : cvs[0].id;
  const activeCv = cvs.find((cv) => cv.id === activeCvId);

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
