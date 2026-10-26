// The design school's shared constants — the nine principles' rainbow
// ordering, titles and final checklist, kept component-free so both the
// school page and the cheat-sheet modal (and their shared body) can import
// them without tripping react-refresh.

// One rainbow order for the nine principle cards — the lesson's chrome is
// colorful on purpose (the onboarding wizard's look), while the specimens
// inside stay loyal to the CV's single accent.
export const GUIDE_TONES = [
  { badge: "from-sky-500 to-indigo-500", text: "text-sky-400" },
  { badge: "from-indigo-500 to-purple-500", text: "text-indigo-400" },
  { badge: "from-purple-500 to-fuchsia-500", text: "text-purple-400" },
  { badge: "from-fuchsia-500 to-pink-500", text: "text-fuchsia-400" },
  { badge: "from-pink-500 to-rose-500", text: "text-pink-400" },
  { badge: "from-rose-500 to-orange-500", text: "text-rose-400" },
  { badge: "from-orange-500 to-amber-500", text: "text-orange-400" },
  { badge: "from-violet-500 to-purple-500", text: "text-violet-400" },
  { badge: "from-emerald-500 to-teal-500", text: "text-emerald-400" },
];

// The principle titles, in the same order — the page's jump chips read
// this list; the cheat sheet reuses the last one for its checklist card.
export const GUIDE_TITLES = [
  "Hierarchy before decoration",
  "One accent, spent sparingly",
  "Everything is a card, on one rhythm",
  "An entry reads in one glance",
  "Bullets carry a verb and a number",
  "Order tells the story",
  "Restraint is the style",
  "Let the AI write the first draft",
  "Ship it, then squint-test it",
];

// The ship checklist — word-for-word the same in the school's last
// principle and the cheat sheet.
export const GUIDE_CHECKLIST = [
  "Squint test: blurred, the name, role and section titles still pop",
  "Every period stamp sits the same way on its line",
  "Newest first everywhere, dates in one format",
  "One page, until real experience honestly demands two",
  "Skills list only what you'd survive an interview question on",
  "Read it aloud once — every sentence earns its line or goes",
  "Export the PDF and open it on a phone — it must hold up there",
];
