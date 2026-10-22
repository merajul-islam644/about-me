// The CV layout library — one hundred structurally distinct designs.
//
// A design combines four structural dimensions, so every layout in the
// gallery arranges the page differently, not just differently colored:
//   header × document × tone × photo  →  e.g. "band-rail-dark-square-teal"
//   5 headers · 5 documents · 2 tones · 2 photo shapes = 100 layouts
// An accent color rides along with each layout (cycled across the ten
// palettes), so the gallery is structurally AND colorfully varied.
// The three legacy keys ("classic", "paper", "sidebar") alias into the grid,
// so stored rows keep resolving.
//
// Every class value below is a complete static string in this scanned source
// file — the same guarantee as SKILL_COLOR_OPTIONS — so Tailwind v4 generates
// each class no matter which design a CV stores. Never build these classes by
// concatenating fragments; joining two COMPLETE literals (as the token builder
// does) is fine because each appears verbatim in source.

export const DEFAULT_CV_DESIGN = "classic";

// ---- Vocabulary -----------------------------------------------------------

// How the headline + photo present at the top of the page.
export const CV_HEADERS = [
  {
    key: "side",
    label: "Side photo",
    description: "Photo floating beside the headline.",
  },
  {
    key: "stack",
    label: "Stacked",
    description: "Photo on top, everything centered.",
  },
  {
    key: "slab",
    label: "Slab",
    description: "A solid accent header carries the name.",
  },
  {
    key: "band",
    label: "Band",
    description: "A tall accent band holds photo, contact and skills.",
  },
  {
    key: "badge",
    label: "Badge",
    description: "The headline lives in a framed panel.",
  },
];

// How the document's sections are arranged below the headline.
export const CV_DOCS = [
  {
    key: "flow",
    label: "Flow",
    description: "Sections stack in one column.",
  },
  {
    key: "columns",
    label: "Columns",
    description: "Sections flow down two balanced columns.",
  },
  {
    key: "rail",
    label: "Rail",
    description: "A dotted rail runs down the edge of every section.",
  },
  {
    key: "grid",
    label: "Grid",
    description: "Sections sit as boxes in a two-column grid.",
  },
  {
    key: "zebra",
    label: "Zebra",
    description: "Sections alternate as tinted full-width rows.",
  },
];

export const CV_TONES = [
  { key: "dark", label: "Dark", description: "Glassy cards on a dark page." },
  { key: "light", label: "Light", description: "Thin rules on a tinted page." },
];

export const CV_PHOTOS = [
  { key: "circle", label: "Circle" },
  { key: "square", label: "Square" },
];

// The full print+web meta per accent: the Tailwind stems (complete literals)
// and the jsPDF hexes the PDF builder reads. `pageBg*` tints the whole page
// per accent — sky keeps the original neutral site grays so the portfolio
// pages and the default design never change. The `*Hex*` fields are the
// print counterparts: the PDF paints the same page tint (`pageHex*`), with
// `cardHexDark` for its glassy card washes and `lineHexDark` for rules.
const ACCENT_META = {
  sky: {
    label: "Sky",
    dot: "bg-sky-500",
    hex: "#0284c7",
    hexDeep: "#0c4a6e",
    hexLight: "#bae6fd",
    pageBgDark: "bg-gray-800",
    pageBgLight: "bg-gray-50",
    pageHexDark: "#1f2937",
    pageHexLight: "#f9fafb",
    cardHexDark: "#111827",
    lineHexDark: "#374151",
    solid500: "bg-sky-500",
    solid600: "bg-sky-600",
    tint100: "text-sky-100",
    frameCircle: "rounded-full border-4 border-sky-400",
    frameSquare: "rounded-2xl border-4 border-sky-400",
    text300: "text-sky-300",
    text300soft: "text-sky-300/80",
    text600: "text-sky-600",
    text700: "text-sky-700",
    focusD: "focus:border-sky-400",
    focusL: "focus:border-sky-600",
    hoverBorderD50: "hover:border-sky-400/50",
    hoverBorderD40: "hover:border-sky-400/40",
    hoverTextD: "hover:text-sky-300",
    hoverBorderL50: "hover:border-sky-600/50",
    hoverBorderL40: "hover:border-sky-600/40",
    hoverTextL: "hover:text-sky-700",
    hoverTextLSoft: "hover:text-sky-600",
    panelBgD: "bg-sky-500/10",
    panelBorderD: "border-sky-400/20",
    panelBgL: "bg-sky-100",
    panelBorderL: "border-sky-200",
    band950: "bg-sky-950",
    dotD: "before:bg-sky-400",
    dotL: "before:bg-sky-500",
    accent600: "text-sky-600 font-medium",
    accent700strong: "font-semibold text-sky-700",
  },
  indigo: {
    label: "Indigo",
    dot: "bg-indigo-500",
    hex: "#4f46e5",
    hexDeep: "#312e81",
    hexLight: "#c7d2fe",
    pageBgDark: "bg-indigo-950",
    pageBgLight: "bg-indigo-50",
    pageHexDark: "#1e1b4b",
    pageHexLight: "#eef2ff",
    cardHexDark: "#312e81",
    lineHexDark: "#3730a3",
    solid500: "bg-indigo-500",
    solid600: "bg-indigo-600",
    tint100: "text-indigo-100",
    frameCircle: "rounded-full border-4 border-indigo-400",
    frameSquare: "rounded-2xl border-4 border-indigo-400",
    text300: "text-indigo-300",
    text300soft: "text-indigo-300/80",
    text600: "text-indigo-600",
    text700: "text-indigo-700",
    focusD: "focus:border-indigo-400",
    focusL: "focus:border-indigo-600",
    hoverBorderD50: "hover:border-indigo-400/50",
    hoverBorderD40: "hover:border-indigo-400/40",
    hoverTextD: "hover:text-indigo-300",
    hoverBorderL50: "hover:border-indigo-600/50",
    hoverBorderL40: "hover:border-indigo-600/40",
    hoverTextL: "hover:text-indigo-700",
    hoverTextLSoft: "hover:text-indigo-600",
    panelBgD: "bg-indigo-500/10",
    panelBorderD: "border-indigo-400/20",
    panelBgL: "bg-indigo-100",
    panelBorderL: "border-indigo-200",
    band950: "bg-indigo-950",
    dotD: "before:bg-indigo-400",
    dotL: "before:bg-indigo-500",
    accent600: "text-indigo-600 font-medium",
    accent700strong: "font-semibold text-indigo-700",
  },
  violet: {
    label: "Violet",
    dot: "bg-violet-500",
    hex: "#7c3aed",
    hexDeep: "#4c1d95",
    hexLight: "#ddd6fe",
    pageBgDark: "bg-violet-950",
    pageBgLight: "bg-violet-50",
    pageHexDark: "#2e1065",
    pageHexLight: "#f5f3ff",
    cardHexDark: "#4c1d95",
    lineHexDark: "#5b21b6",
    solid500: "bg-violet-500",
    solid600: "bg-violet-600",
    tint100: "text-violet-100",
    frameCircle: "rounded-full border-4 border-violet-400",
    frameSquare: "rounded-2xl border-4 border-violet-400",
    text300: "text-violet-300",
    text300soft: "text-violet-300/80",
    text600: "text-violet-600",
    text700: "text-violet-700",
    focusD: "focus:border-violet-400",
    focusL: "focus:border-violet-600",
    hoverBorderD50: "hover:border-violet-400/50",
    hoverBorderD40: "hover:border-violet-400/40",
    hoverTextD: "hover:text-violet-300",
    hoverBorderL50: "hover:border-violet-600/50",
    hoverBorderL40: "hover:border-violet-600/40",
    hoverTextL: "hover:text-violet-700",
    hoverTextLSoft: "hover:text-violet-600",
    panelBgD: "bg-violet-500/10",
    panelBorderD: "border-violet-400/20",
    panelBgL: "bg-violet-100",
    panelBorderL: "border-violet-200",
    band950: "bg-violet-950",
    dotD: "before:bg-violet-400",
    dotL: "before:bg-violet-500",
    accent600: "text-violet-600 font-medium",
    accent700strong: "font-semibold text-violet-700",
  },
  fuchsia: {
    label: "Fuchsia",
    dot: "bg-fuchsia-500",
    hex: "#c026d3",
    hexDeep: "#701a75",
    hexLight: "#fbcfe8",
    pageBgDark: "bg-fuchsia-950",
    pageBgLight: "bg-fuchsia-50",
    pageHexDark: "#4a044e",
    pageHexLight: "#fdf4ff",
    cardHexDark: "#701a75",
    lineHexDark: "#86198f",
    solid500: "bg-fuchsia-500",
    solid600: "bg-fuchsia-600",
    tint100: "text-fuchsia-100",
    frameCircle: "rounded-full border-4 border-fuchsia-400",
    frameSquare: "rounded-2xl border-4 border-fuchsia-400",
    text300: "text-fuchsia-300",
    text300soft: "text-fuchsia-300/80",
    text600: "text-fuchsia-600",
    text700: "text-fuchsia-700",
    focusD: "focus:border-fuchsia-400",
    focusL: "focus:border-fuchsia-600",
    hoverBorderD50: "hover:border-fuchsia-400/50",
    hoverBorderD40: "hover:border-fuchsia-400/40",
    hoverTextD: "hover:text-fuchsia-300",
    hoverBorderL50: "hover:border-fuchsia-600/50",
    hoverBorderL40: "hover:border-fuchsia-600/40",
    hoverTextL: "hover:text-fuchsia-700",
    hoverTextLSoft: "hover:text-fuchsia-600",
    panelBgD: "bg-fuchsia-500/10",
    panelBorderD: "border-fuchsia-400/20",
    panelBgL: "bg-fuchsia-100",
    panelBorderL: "border-fuchsia-200",
    band950: "bg-fuchsia-950",
    dotD: "before:bg-fuchsia-400",
    dotL: "before:bg-fuchsia-500",
    accent600: "text-fuchsia-600 font-medium",
    accent700strong: "font-semibold text-fuchsia-700",
  },
  rose: {
    label: "Rose",
    dot: "bg-rose-500",
    hex: "#e11d48",
    hexDeep: "#881337",
    hexLight: "#fecdd3",
    pageBgDark: "bg-rose-950",
    pageBgLight: "bg-rose-50",
    pageHexDark: "#4c0519",
    pageHexLight: "#fff1f2",
    cardHexDark: "#881337",
    lineHexDark: "#9f1239",
    solid500: "bg-rose-500",
    solid600: "bg-rose-600",
    tint100: "text-rose-100",
    frameCircle: "rounded-full border-4 border-rose-400",
    frameSquare: "rounded-2xl border-4 border-rose-400",
    text300: "text-rose-300",
    text300soft: "text-rose-300/80",
    text600: "text-rose-600",
    text700: "text-rose-700",
    focusD: "focus:border-rose-400",
    focusL: "focus:border-rose-600",
    hoverBorderD50: "hover:border-rose-400/50",
    hoverBorderD40: "hover:border-rose-400/40",
    hoverTextD: "hover:text-rose-300",
    hoverBorderL50: "hover:border-rose-600/50",
    hoverBorderL40: "hover:border-rose-600/40",
    hoverTextL: "hover:text-rose-700",
    hoverTextLSoft: "hover:text-rose-600",
    panelBgD: "bg-rose-500/10",
    panelBorderD: "border-rose-400/20",
    panelBgL: "bg-rose-100",
    panelBorderL: "border-rose-200",
    band950: "bg-rose-950",
    dotD: "before:bg-rose-400",
    dotL: "before:bg-rose-500",
    accent600: "text-rose-600 font-medium",
    accent700strong: "font-semibold text-rose-700",
  },
  amber: {
    label: "Amber",
    dot: "bg-amber-500",
    hex: "#d97706",
    hexDeep: "#78350f",
    hexLight: "#fde68a",
    pageBgDark: "bg-amber-950",
    pageBgLight: "bg-amber-50",
    pageHexDark: "#451a03",
    pageHexLight: "#fffbeb",
    cardHexDark: "#78350f",
    lineHexDark: "#92400e",
    solid500: "bg-amber-500",
    solid600: "bg-amber-600",
    tint100: "text-amber-100",
    frameCircle: "rounded-full border-4 border-amber-400",
    frameSquare: "rounded-2xl border-4 border-amber-400",
    text300: "text-amber-300",
    text300soft: "text-amber-300/80",
    text600: "text-amber-600",
    text700: "text-amber-700",
    focusD: "focus:border-amber-400",
    focusL: "focus:border-amber-600",
    hoverBorderD50: "hover:border-amber-400/50",
    hoverBorderD40: "hover:border-amber-400/40",
    hoverTextD: "hover:text-amber-300",
    hoverBorderL50: "hover:border-amber-600/50",
    hoverBorderL40: "hover:border-amber-600/40",
    hoverTextL: "hover:text-amber-700",
    hoverTextLSoft: "hover:text-amber-600",
    panelBgD: "bg-amber-500/10",
    panelBorderD: "border-amber-400/20",
    panelBgL: "bg-amber-100",
    panelBorderL: "border-amber-200",
    band950: "bg-amber-950",
    dotD: "before:bg-amber-400",
    dotL: "before:bg-amber-500",
    accent600: "text-amber-600 font-medium",
    accent700strong: "font-semibold text-amber-700",
  },
  orange: {
    label: "Orange",
    dot: "bg-orange-500",
    hex: "#ea580c",
    hexDeep: "#7c2d12",
    hexLight: "#fed7aa",
    pageBgDark: "bg-orange-950",
    pageBgLight: "bg-orange-50",
    pageHexDark: "#431407",
    pageHexLight: "#fff7ed",
    cardHexDark: "#7c2d12",
    lineHexDark: "#9a3412",
    solid500: "bg-orange-500",
    solid600: "bg-orange-600",
    tint100: "text-orange-100",
    frameCircle: "rounded-full border-4 border-orange-400",
    frameSquare: "rounded-2xl border-4 border-orange-400",
    text300: "text-orange-300",
    text300soft: "text-orange-300/80",
    text600: "text-orange-600",
    text700: "text-orange-700",
    focusD: "focus:border-orange-400",
    focusL: "focus:border-orange-600",
    hoverBorderD50: "hover:border-orange-400/50",
    hoverBorderD40: "hover:border-orange-400/40",
    hoverTextD: "hover:text-orange-300",
    hoverBorderL50: "hover:border-orange-600/50",
    hoverBorderL40: "hover:border-orange-600/40",
    hoverTextL: "hover:text-orange-700",
    hoverTextLSoft: "hover:text-orange-600",
    panelBgD: "bg-orange-500/10",
    panelBorderD: "border-orange-400/20",
    panelBgL: "bg-orange-100",
    panelBorderL: "border-orange-200",
    band950: "bg-orange-950",
    dotD: "before:bg-orange-400",
    dotL: "before:bg-orange-500",
    accent600: "text-orange-600 font-medium",
    accent700strong: "font-semibold text-orange-700",
  },
  emerald: {
    label: "Emerald",
    dot: "bg-emerald-500",
    hex: "#059669",
    hexDeep: "#064e3b",
    hexLight: "#a7f3d0",
    pageBgDark: "bg-emerald-950",
    pageBgLight: "bg-emerald-50",
    pageHexDark: "#022c22",
    pageHexLight: "#ecfdf5",
    cardHexDark: "#064e3b",
    lineHexDark: "#065f46",
    solid500: "bg-emerald-500",
    solid600: "bg-emerald-600",
    tint100: "text-emerald-100",
    frameCircle: "rounded-full border-4 border-emerald-400",
    frameSquare: "rounded-2xl border-4 border-emerald-400",
    text300: "text-emerald-300",
    text300soft: "text-emerald-300/80",
    text600: "text-emerald-600",
    text700: "text-emerald-700",
    focusD: "focus:border-emerald-400",
    focusL: "focus:border-emerald-600",
    hoverBorderD50: "hover:border-emerald-400/50",
    hoverBorderD40: "hover:border-emerald-400/40",
    hoverTextD: "hover:text-emerald-300",
    hoverBorderL50: "hover:border-emerald-600/50",
    hoverBorderL40: "hover:border-emerald-600/40",
    hoverTextL: "hover:text-emerald-700",
    hoverTextLSoft: "hover:text-emerald-600",
    panelBgD: "bg-emerald-500/10",
    panelBorderD: "border-emerald-400/20",
    panelBgL: "bg-emerald-100",
    panelBorderL: "border-emerald-200",
    band950: "bg-emerald-950",
    dotD: "before:bg-emerald-400",
    dotL: "before:bg-emerald-500",
    accent600: "text-emerald-600 font-medium",
    accent700strong: "font-semibold text-emerald-700",
  },
  teal: {
    label: "Teal",
    dot: "bg-teal-500",
    hex: "#0d9488",
    hexDeep: "#134e4a",
    hexLight: "#99f6e4",
    pageBgDark: "bg-teal-950",
    pageBgLight: "bg-teal-50",
    pageHexDark: "#042f2e",
    pageHexLight: "#f0fdfa",
    cardHexDark: "#134e4a",
    lineHexDark: "#115e59",
    solid500: "bg-teal-500",
    solid600: "bg-teal-600",
    tint100: "text-teal-100",
    frameCircle: "rounded-full border-4 border-teal-400",
    frameSquare: "rounded-2xl border-4 border-teal-400",
    text300: "text-teal-300",
    text300soft: "text-teal-300/80",
    text600: "text-teal-600",
    text700: "text-teal-700",
    focusD: "focus:border-teal-400",
    focusL: "focus:border-teal-600",
    hoverBorderD50: "hover:border-teal-400/50",
    hoverBorderD40: "hover:border-teal-400/40",
    hoverTextD: "hover:text-teal-300",
    hoverBorderL50: "hover:border-teal-600/50",
    hoverBorderL40: "hover:border-teal-600/40",
    hoverTextL: "hover:text-teal-700",
    hoverTextLSoft: "hover:text-teal-600",
    panelBgD: "bg-teal-500/10",
    panelBorderD: "border-teal-400/20",
    panelBgL: "bg-teal-100",
    panelBorderL: "border-teal-200",
    band950: "bg-teal-950",
    dotD: "before:bg-teal-400",
    dotL: "before:bg-teal-500",
    accent600: "text-teal-600 font-medium",
    accent700strong: "font-semibold text-teal-700",
  },
  cyan: {
    label: "Cyan",
    dot: "bg-cyan-500",
    hex: "#0891b2",
    hexDeep: "#155e75",
    hexLight: "#a5f3fc",
    pageBgDark: "bg-cyan-950",
    pageBgLight: "bg-cyan-50",
    pageHexDark: "#083344",
    pageHexLight: "#ecfeff",
    cardHexDark: "#164e63",
    lineHexDark: "#155e75",
    solid500: "bg-cyan-500",
    solid600: "bg-cyan-600",
    tint100: "text-cyan-100",
    frameCircle: "rounded-full border-4 border-cyan-400",
    frameSquare: "rounded-2xl border-4 border-cyan-400",
    text300: "text-cyan-300",
    text300soft: "text-cyan-300/80",
    text600: "text-cyan-600",
    text700: "text-cyan-700",
    focusD: "focus:border-cyan-400",
    focusL: "focus:border-cyan-600",
    hoverBorderD50: "hover:border-cyan-400/50",
    hoverBorderD40: "hover:border-cyan-400/40",
    hoverTextD: "hover:text-cyan-300",
    hoverBorderL50: "hover:border-cyan-600/50",
    hoverBorderL40: "hover:border-cyan-600/40",
    hoverTextL: "hover:text-cyan-700",
    hoverTextLSoft: "hover:text-cyan-600",
    panelBgD: "bg-cyan-500/10",
    panelBorderD: "border-cyan-400/20",
    panelBgL: "bg-cyan-100",
    panelBorderL: "border-cyan-200",
    band950: "bg-cyan-950",
    dotD: "before:bg-cyan-400",
    dotL: "before:bg-cyan-500",
    accent600: "text-cyan-600 font-medium",
    accent700strong: "font-semibold text-cyan-700",
  },
};

export const CV_ACCENTS = Object.entries(ACCENT_META).map(([key, meta]) => ({
  key,
  label: meta.label,
  dot: meta.dot,
}));

// ---- The 100-layout grid --------------------------------------------------

const ACCENT_ORDER = CV_ACCENTS.map((accent) => accent.key);

// The structural combos, interleaved: consecutive cards always differ in
// header, and every five cards the document arrangement differs too — so
// the gallery's first screen shows the full structural range instead of a
// run of same-header cards that all look like the default. The accent
// cycles across the ten palettes, so neighbours never share a color either.
export const CV_DESIGNS = Array.from(
  { length: CV_HEADERS.length * CV_DOCS.length * CV_TONES.length * CV_PHOTOS.length },
  (_, k) => {
    const header = CV_HEADERS[k % CV_HEADERS.length];
    const doc =
      CV_DOCS[Math.floor(k / CV_HEADERS.length) % CV_DOCS.length];
    const tone =
      CV_TONES[
        Math.floor(k / (CV_HEADERS.length * CV_DOCS.length)) % CV_TONES.length
      ];
    const photo =
      CV_PHOTOS[
        Math.floor(
          k / (CV_HEADERS.length * CV_DOCS.length * CV_TONES.length)
        ) % CV_PHOTOS.length
      ];
    const accent = ACCENT_ORDER[k % ACCENT_ORDER.length];
    // The accent rides IN the key — tokens, Hero, CvDocument and the PDF all
    // decode the design from the stored key alone, so the assigned palette
    // must survive storage with it.
    return {
      key: `${header.key}-${doc.key}-${tone.key}-${photo.key}-${accent}`,
      label: `${header.label} · ${doc.label} · ${tone.label} · ${photo.label}`,
      header: header.key,
      doc: doc.key,
      tone: tone.key,
      photo: photo.key,
      accent,
      description: `${header.description} ${doc.description}`,
    };
  }
);

// Every valid design key: the legacy aliases first (stored rows keep
// resolving), then the 100-layout grid.
export const CV_DESIGN_KEYS = [
  "classic",
  "paper",
  "sidebar",
  ...CV_DESIGNS.map((design) => design.key),
];

const LEGACY_ALIASES = {
  classic: "side-flow-dark-circle-sky",
  paper: "side-flow-light-circle-sky",
  sidebar: "band-flow-light-circle-sky",
};

export const resolveCvDesign = (design) =>
  CV_DESIGN_KEYS.includes(design) ? design : DEFAULT_CV_DESIGN;

// Split a design key into its dimensions — the single decoder everything
// else (tokens, the PDF theme, the gallery) reads. Every dimension key is a
// single word, so a plain split decodes the whole combo.
export const parseCvDesign = (design) => {
  const key = resolveCvDesign(design);
  const combo = LEGACY_ALIASES[key] ?? key;
  const [header, doc, tone, photo, accent] = combo.split("-");
  return {
    key,
    combo,
    header,
    doc,
    tone,
    photo,
    accent,
    // `layout` names the header pattern — the page-geometry dimension.
    layout: header,
  };
};

// The combo key a stored design renders as — how the gallery matches its
// Active card when the CV still stores a legacy alias.
export const designComboKey = (design) => parseCvDesign(design).combo;

// The PDF's print theme for a design: accent hexes plus the structural
// dimensions that decide the page geometry.
export const cvDesignPrint = (design) => {
  const meta = parseCvDesign(design);
  const accent = ACCENT_META[meta.accent] ?? ACCENT_META.sky;
  return {
    layout: meta.header,
    doc: meta.doc,
    tone: meta.tone,
    photo: meta.photo,
    hex: accent.hex,
    hexDeep: accent.hexDeep,
    hexLight: accent.hexLight,
    pageDark: accent.pageHexDark,
    pageLight: accent.pageHexLight,
    cardDark: accent.cardHexDark,
    lineDark: accent.lineHexDark,
  };
};

// ---- Token builder --------------------------------------------------------

// Shared layout scaffolding (identical across designs).
const CV_GRID_BAND =
  "relative flex-1 w-full max-w-6xl mx-auto md:grid md:grid-cols-[18rem_1fr] md:gap-10 md:items-start p-6 md:p-10";
const CV_GRID = CV_GRID_BAND;
const BAND =
  "flex flex-col gap-6 rounded-2xl bg-gray-900 p-6 md:sticky md:top-24 self-start w-full";
const BAND_LABEL =
  "text-xs font-semibold uppercase tracking-widest text-gray-500";
const BAND_ROW = "text-sm text-gray-300";

const buildTokens = (header, doc, tone, photo, accent) => {
  const a = ACCENT_META[accent] ?? ACCENT_META.sky;
  const dark = tone === "dark";
  const slab = header === "slab";
  const stack = header === "stack";
  const bandHeader = header === "band";

  return {
    // /cv page shell + hero headline (Hero.jsx). The page itself is tinted
    // per accent — sky keeps the site's original neutral grays so the
    // portfolio pages and the default design never change.
    pageShell: `min-h-[calc(100vh-64px)] ${dark ? a.pageBgDark : a.pageBgLight} flex flex-col`,
    heroGreeting: slab
      ? "text-3xl sm:text-4xl md:text-5xl font-bold text-white"
      : dark
        ? "text-3xl sm:text-4xl md:text-5xl font-bold text-white"
        : "text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900",
    heroTitle: slab
      ? "text-xl sm:text-2xl md:text-2xl font-semibold text-white/90"
      : `text-xl sm:text-2xl md:text-2xl ${dark ? a.text300 : a.text700} font-semibold`,
    heroContact: slab
      ? `flex flex-wrap justify-center gap-x-2 text-sm ${a.tint100} md:justify-start`
      : stack
        ? dark
          ? "flex flex-wrap justify-center gap-x-2 text-sm text-gray-400"
          : "flex flex-wrap justify-center gap-x-2 text-sm text-gray-500"
        : dark
          ? "flex flex-wrap justify-center gap-x-2 text-sm text-gray-400 md:justify-start"
          : "flex flex-wrap justify-center gap-x-2 text-sm text-gray-500 md:justify-start",
    contactSep: dark ? "text-gray-600" : "text-gray-300",
    heroBio: dark
      ? "text-base sm:text-lg text-gray-300"
      : "text-base sm:text-lg text-gray-600",
    groupHeading: dark
      ? "text-xl font-bold text-white"
      : "text-xl font-bold text-gray-900",
    // The slab header's solid accent block; the badge header's framed panel.
    bannerBlock: slab
      ? `rounded-2xl ${dark ? a.solid500 : a.solid600} p-5 md:p-6 shadow-lg`
      : "",
    badgePanel: header === "badge"
      ? `rounded-2xl border ${dark ? a.panelBorderD : a.panelBorderL} ${dark ? a.panelBgD : a.panelBgL} p-5 md:p-6`
      : "",
    // The avatar's shape — circle or square, always in the design's accent.
    photoFrame: photo === "square" ? a.frameSquare : a.frameCircle,
    // The skills row centers itself on the stacked header.
    skillsRow: stack
      ? "flex flex-wrap gap-2 mt-2 justify-center"
      : "flex flex-wrap gap-2 mt-2 justify-center md:justify-start",
    // Document body (CvDocument.jsx) — the arrangement IS the doc dimension.
    // No bottom pad: on /cv the page wrapper owns the one closing pad, and
    // every group rides the same gap the cards use.
    docWrap: bandHeader
      ? "w-full flex flex-col gap-5"
      : doc === "grid"
        ? "w-full max-w-6xl mx-auto grid gap-5 px-6 md:grid-cols-2 items-start"
        : doc === "columns"
          ? "w-full max-w-5xl mx-auto px-6 md:columns-2 md:gap-8"
          : "w-full max-w-3xl mx-auto flex flex-col gap-5 px-6",
    sectionCard:
      doc === "grid"
        ? dark
          ? "relative rounded-2xl border border-white/10 bg-gray-900/60 p-5 md:p-6"
          : "relative rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm"
        : doc === "columns"
          ? dark
            ? "relative mb-5 break-inside-avoid rounded-2xl border border-white/10 bg-gray-900/60 p-5 md:p-6"
            : "relative mb-5 break-inside-avoid border-b border-gray-200 pb-5 md:pb-6"
          : doc === "rail"
            ? dark
              ? `relative rounded-2xl border border-white/10 bg-gray-900/60 p-5 md:p-6 pl-7 ${a.dotD} before:absolute before:left-3 before:top-7 before:h-2.5 before:w-2.5 before:rounded-full before:content-['']`
              : `relative border-b border-gray-200 pb-5 md:pb-6 last:border-b-0 pl-7 ${a.dotL} before:absolute before:left-0 before:top-1.5 before:h-2.5 before:w-2.5 before:rounded-full before:content-['']`
            : doc === "zebra"
              ? dark
                ? "relative rounded-xl p-5 [&:nth-child(even)]:bg-white/5"
                : "relative rounded-xl p-5 [&:nth-child(even)]:bg-gray-100"
              : dark
                ? "relative rounded-2xl border border-white/10 bg-gray-900/60 p-5 md:p-6"
                : "relative border-b border-gray-200 pb-5 md:pb-6 last:border-b-0",
    // The entry "table" — an optional grid presentation an entry section
    // can switch to (Education seeds it): full cell borders like a sheet.
    tableEl: "w-full min-w-[34rem] border-collapse text-left text-sm",
    tableHeadCell: dark
      ? "border border-white/10 bg-white/[0.04] px-3 py-2 font-semibold text-gray-200"
      : "border border-gray-300 bg-gray-50 px-3 py-2 font-semibold text-gray-700",
    tableCell: dark
      ? "border border-white/10 px-3 py-2 align-top text-gray-300"
      : "border border-gray-300 px-3 py-2 align-top text-gray-600",
    sectionTitle: `pr-8 text-lg font-bold ${dark ? a.text300 : a.text700}`,
    emptyText: dark
      ? "text-sm italic text-gray-500"
      : "text-sm italic text-gray-400",
    editPencil: dark
      ? `absolute right-3 top-3 rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 ${a.hoverTextD}`
      : `absolute right-3 top-3 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 ${a.hoverTextLSoft}`,
    // The delete button hides until its card is hovered (the card carries
    // the `group` class) and sits beside the pencil.
    editTrash: dark
      ? "absolute right-12 top-3 rounded-full p-2 text-gray-400 opacity-0 transition-opacity hover:bg-white/5 focus-visible:opacity-100 group-hover:opacity-100 group-hover:text-red-400"
      : "absolute right-12 top-3 rounded-full p-2 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 focus-visible:opacity-100 group-hover:opacity-100 group-hover:text-red-500",
    // Entries (EntryItem) and plain content.
    entryCard: dark
      ? "rounded-xl border border-white/5 bg-gray-800/60 p-4"
      : "py-1",
    entryHeading: dark
      ? "font-semibold text-white"
      : "font-semibold text-gray-900",
    entryPeriod: dark
      ? `text-xs font-medium tracking-wide ${a.text300soft}`
      : "text-xs font-medium tracking-wide text-gray-500",
    entrySub: `mt-0.5 text-sm ${dark ? a.text300 : a.text700}`,
    entryDetails: dark
      ? "mt-2 text-sm leading-relaxed whitespace-pre-line text-gray-300"
      : "mt-2 text-sm leading-relaxed whitespace-pre-line text-gray-600",
    // Same text without the card's top gap — table cells keep top-aligned rows.
    entryDetailsFlat: dark
      ? "text-sm leading-relaxed whitespace-pre-line text-gray-300"
      : "text-sm leading-relaxed whitespace-pre-line text-gray-600",
    listPill: dark
      ? "rounded-full border border-white/10 bg-gray-800 px-3 py-1 text-sm text-gray-200"
      : "rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700",
    bodyText: dark
      ? "text-sm leading-relaxed whitespace-pre-line text-gray-300"
      : "text-sm leading-relaxed whitespace-pre-line text-gray-600",
    // The inline section editor — dark on dark designs, light on light ones.
    editorField: dark
      ? `w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 ${a.focusD} focus:outline-none`
      : `w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 ${a.focusL} focus:outline-none`,
    editorEntryCard: dark
      ? "flex flex-col gap-2 rounded-xl border border-white/10 bg-gray-800/60 p-3"
      : "flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3",
    editorRemovePlain: dark
      ? "inline-flex cursor-pointer items-center gap-1.5 self-start rounded-lg px-2 py-1 text-xs text-red-400 transition-colors hover:bg-white/5"
      : "inline-flex cursor-pointer items-center gap-1.5 self-start rounded-lg px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50",
    editorRemoveBoxed: dark
      ? "shrink-0 cursor-pointer rounded-lg border border-white/10 p-2 text-red-400 transition-colors hover:bg-white/5"
      : "shrink-0 cursor-pointer rounded-lg border border-gray-200 p-2 text-red-500 transition-colors hover:bg-red-50",
    editorAddItem: dark
      ? `inline-flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-dashed border-white/20 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors ${a.hoverBorderD50} ${a.hoverTextD}`
      : `inline-flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors ${a.hoverBorderL50} ${a.hoverTextL}`,
    editorCancel: dark
      ? `inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-sm font-semibold text-gray-300 transition-colors ${a.hoverBorderD40} ${a.hoverTextD}`
      : `inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-600 transition-colors ${a.hoverBorderL40} ${a.hoverTextL}`,
    // Layout slots — meaningful only on the band header, present everywhere
    // so a stray render never reads `undefined`.
    cvGrid: bandHeader ? CV_GRID_BAND : CV_GRID,
    band: bandHeader
      ? dark
        ? "flex flex-col gap-6 rounded-2xl border border-white/10 bg-gray-900 p-6 md:sticky md:top-24 self-start w-full"
        : `flex flex-col gap-6 rounded-2xl ${a.band950} p-6 md:sticky md:top-24 self-start w-full`
      : BAND,
    bandLabel:
      bandHeader && !dark
        ? `text-xs font-semibold uppercase tracking-widest ${a.text300}`
        : BAND_LABEL,
    bandRow: BAND_ROW,
    // The gallery preview's surface — the design's own page tint, so the
    // card thumbnails show the page the way the real /cv paints it. The
    // column direction matters: the preview branches stack headline, bio,
    // chips and document vertically, and without flex-col they render
    // side-by-side as squeezed, overlapping columns.
    previewSurface: `flex w-full flex-col text-left ${dark ? a.pageBgDark : a.pageBgLight}`,
  };
};

const TOKEN_CACHE = new Map();

export const cvDesignTokens = (design) => {
  const meta = parseCvDesign(design);
  let tokens = TOKEN_CACHE.get(meta.combo);
  if (!tokens) {
    tokens = buildTokens(
      meta.header,
      meta.doc,
      meta.tone,
      meta.photo,
      meta.accent
    );
    TOKEN_CACHE.set(meta.combo, tokens);
  }
  return tokens;
};

// Stored bio accent classes assume a dark page ("font-semibold text-white"
// would vanish on a light design, and a stored sky accent clashes on
// non-sky ones). The remap happens at render time only — stored data stays
// untouched, so switching back restores the original. Dark pages keep the
// stored classes as-is.
const ACCENT_REMAP_LIGHT = {
  "text-sky-400 font-medium": (a) => a.accent600,
  "font-semibold text-white": (a) => a.accent700strong,
};

export const accentForDesign = (storedClass, design) => {
  const meta = parseCvDesign(design);
  if (meta.tone !== "light") return storedClass;
  const remap = ACCENT_REMAP_LIGHT[storedClass];
  return remap ? remap(ACCENT_META[meta.accent] ?? ACCENT_META.sky) : storedClass;
};

// ---- Visitor design preference --------------------------------------------

// Visitors cannot write the owner's stored CV, so their pick rides on top as
// a per-device preference: the page (and its PDF) render in it, the stored
// design stays untouched, and it survives a reload via localStorage. A
// signed-in session ignores it — the owner's saved design always wins for
// the owner.
const VISITOR_DESIGN_KEY = "cv-design-visitor";

export const readVisitorDesign = () => {
  try {
    const stored = window.localStorage.getItem(VISITOR_DESIGN_KEY);
    return stored && CV_DESIGN_KEYS.includes(stored) ? stored : null;
  } catch {
    return null; // storage unavailable (private mode) — no preference.
  }
};

export const writeVisitorDesign = (design) => {
  try {
    window.localStorage.setItem(VISITOR_DESIGN_KEY, resolveCvDesign(design));
  } catch {
    // storage unavailable — the pick just lasts for this visit.
  }
};

export const clearVisitorDesign = () => {
  try {
    window.localStorage.removeItem(VISITOR_DESIGN_KEY);
  } catch {
    // nothing to clean up if storage is unavailable.
  }
};
