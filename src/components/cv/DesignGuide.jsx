import {
  Bot,
  Check,
  ClipboardCheck,
  Eye,
  LayoutGrid,
  ListOrdered,
  Palette,
  PenLine,
  Scissors,
  Type,
  X,
} from "lucide-react";
import guideCoach from "../../assets/design-guide-coach.png";
import visitorAvatar from "../../assets/visitor-avatar.jpg";
import { CV_ACCENTS, cvDesignPrint, parseCvDesign } from "./cvDesign";

// The "How To Design" guide — a design-school walkthrough of the system this
// CV page is built on, grown into nine principles: hierarchy before
// decoration, one accent spent sparingly, cards on one rhythm, entries that
// read in a glance, bullets that carry a verb and a number, sections ordered
// newest-and-relevant first, restraint as the style, the AI chatbot drafting
// the whole CV from plain words, and the final squint-test. Each principle
// is its own card with a live specimen rendered right in the modal — on
// white paper, tinted with the ACTIVE design's accent — so the guide teaches
// by showing, not describing. It closes the loop by handing the reader to
// the template gallery: read the recipe, or take it ready-made.

// One rainbow order for the eight principle cards — the lesson's chrome is
// colorful on purpose (the onboarding wizard's look), while the specimens
// inside stay loyal to the CV's single accent.
const SECTION_TONES = [
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

// One principle, one card: a gradient number badge in this principle's own
// color, a matching topic icon, and whatever teaching body the caller stacks
// inside.
const GuideSection = ({ n, icon: Icon, title, tone, children }) => (
  <section className="flex flex-col gap-3 rounded-xl border border-white/10 bg-gray-800/40 p-4 transition-colors hover:border-white/20 sm:p-5">
    <div className="flex items-center gap-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${tone.badge}`}
      >
        {n}
      </span>
      <h4 className="min-w-0 flex-1 text-base font-bold text-white">{title}</h4>
      <Icon className={`h-4 w-4 shrink-0 ${tone.text}`} />
    </div>
    {children}
  </section>
);

// The number badges, section titles and every accent stroke in the specimens
// use inline styles fed from the print theme — the same hexes the PDF
// paints — so the guide's color is literally the design's color.
export const DesignGuide = ({ open, onClose, design = "classic", onBrowse }) => {
  if (!open) return null;

  const meta = parseCvDesign(design);
  const accent =
    CV_ACCENTS.find((entry) => entry.key === meta.accent) ?? CV_ACCENTS[0];
  const theme = cvDesignPrint(design);
  const hex = theme.hex;

  const dos = [
    "Make the name the biggest thing on the page — hierarchy is free emphasis",
    "Start every bullet with an action verb — Built, Led, Cut, Grew",
    "Keep one date format everywhere (Jan 2024 — Mar 2025)",
    "Keep one gap rhythm: every block breathes the same",
    "Write each entry to a glance — role, place, one number",
    "Stop at 6–7 sections; cut what a recruiter would skip",
  ];
  const donts = [
    "Don't stack fonts — one family, two weights, done",
    "Don't color whole paragraphs; accents mark, they don't paint",
    "Don't list duties when you can list results",
    "Don't mix border styles — if it's a card, every card matches",
    "Don't pad — three strong bullets beat eight weak ones",
    "Don't fill space with fluff — white space IS the design",
  ];
  const checklist = [
    "Squint test: blurred, the name, role and section titles still pop",
    "Every period stamp sits the same way on its line",
    "Newest first everywhere, dates in one format",
    "One page, until real experience honestly demands two",
    "Skills list only what you'd survive an interview question on",
    "Read it aloud once — every sentence earns its line or goes",
    "Export the PDF and open it on a phone — it must hold up there",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="How to design a CV like this"
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
        onClick={(event) => event.stopPropagation()}
      >
        {/* The banner — the same gradient welcome the onboarding wizard
            wears, with the coach anchored inside it. shrink-0 keeps the
            modal's flex column from squeezing it (and overflow-hidden from
            then clipping the subtitle away). */}
        <div className="relative shrink-0 overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 p-5">
          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15" />
          <div className="pointer-events-none absolute -bottom-12 right-16 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative flex items-start gap-3.5">
            <img
              src={guideCoach}
              alt="Design coach holding a laptop"
              className="aspect-[423/736] w-14 shrink-0 rounded-xl border-2 border-white/40 object-cover object-top sm:w-16"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">
                Design school
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-white">
                How to design a CV like this
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-white/85">
                Nine short principles, each with a live specimen in this CV's
                palette ({accent.label}) — read them once and your own page
                will never look the same to you.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              aria-label="Close"
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The scrollable schoolhouse — header and footer stay put. */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {/* The recipe in one line — a rainbow-tinted pull-quote, edged in
              the design's accent. */}
          <div
            className="rounded-xl border border-white/10 border-l-4 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-pink-500/10 p-4"
            style={{ borderLeftColor: hex }}
          >
            <p className="text-sm font-semibold leading-relaxed tracking-wide text-gray-300 sm:text-base">
              Big name · one accent · quiet grays · equal gaps —{" "}
              <span className="text-white">everything else is restraint.</span>
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
              Nine principles below, each with a live specimen — then a
              checklist before you ship.
            </p>
          </div>

          {/* 1 — Hierarchy, with the headline specimen. */}
          <GuideSection n={1} icon={Type} title="Hierarchy before decoration" tone={SECTION_TONES[0]}>
            <p className="text-sm leading-relaxed text-gray-400">
              Decide what a stranger must see first — name, then role, then
              where to reach you — and spend size and weight in exactly that
              order. A quiet eyebrow line above the name sets the tone without
              shouting.
            </p>
            <div className="mx-auto w-full max-w-sm rounded-xl bg-white p-5 text-left shadow-lg">
              <div className="flex items-center gap-3">
                {/* The cartoon avatar everyone starts on — the hierarchy
                    does the talking until the real photo arrives. */}
                <img
                  src={visitorAvatar}
                  alt="Default cartoon avatar"
                  className="h-11 w-11 shrink-0 rounded-full border border-gray-200 object-cover"
                />
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.25em]"
                  style={{ color: hex }}
                >
                  Hello, I am
                </p>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                Arif Hasan
              </p>
              <p className="mt-0.5 text-sm font-semibold" style={{ color: hex }}>
                Frontend Engineer
              </p>
              <p className="mt-1.5 text-xs text-gray-500">
                Dhaka · +880 1XXX-XXXXXX · arif@example.com
              </p>
            </div>
          </GuideSection>

          {/* 2 — One accent, with the where-it-lives specimen. */}
          <GuideSection n={2} icon={Palette} title="One accent, spent sparingly" tone={SECTION_TONES[1]}>
            <p className="text-sm leading-relaxed text-gray-400">
              The accent owns four jobs and nothing else: section titles, the
              period stamp, skill-pill borders, and small marks like this
              guide's numbers. Around ten percent of the page — past that, it
              stops signaling and starts shouting.
            </p>
            <div className="mx-auto w-full max-w-sm rounded-xl bg-white p-5 text-left shadow-lg">
              <p className="text-sm font-bold" style={{ color: hex }}>
                Experience
              </p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <p className="text-xs font-semibold text-gray-900">
                  Intern · Studio Loop
                </p>
                <p className="text-[10px] font-medium" style={{ color: hex }}>
                  2024 — Present
                </p>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {["React", "TypeScript", "Tailwind"].map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border px-2.5 py-0.5 text-[10px] font-medium text-gray-600"
                    style={{ borderColor: hex }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-[10px] italic text-gray-400">
                Four touchpoints, one color — the page stays calm.
              </p>
            </div>
          </GuideSection>

          {/* 3 — Cards on one rhythm, with the two-card specimen. */}
          <GuideSection
            n={3}
            icon={LayoutGrid}
            title="Everything is a card, on one rhythm"
            tone={SECTION_TONES[2]}
          >
            <p className="text-sm leading-relaxed text-gray-400">
              Each section lives in the same rounded box — same corner radius,
              same padding, same thin border — separated by one identical gap.
              Uniform rhythm reads as craft even before a single word lands.
            </p>
            <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
              {["Experience", "Projects"].map((title) => (
                <div
                  key={title}
                  className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-lg"
                >
                  <p className="text-xs font-bold" style={{ color: hex }}>
                    {title}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 w-4/5 rounded-full bg-gray-100" />
                    <div className="h-1.5 w-3/5 rounded-full bg-gray-100" />
                    <div className="h-1.5 w-2/3 rounded-full bg-gray-100" />
                  </div>
                </div>
              ))}
              <p className="text-center text-[10px] italic text-gray-400">
                Same radius, same padding, same gap — blocks that belong
                together look like they belong together.
              </p>
            </div>
          </GuideSection>

          {/* 4 — Entry anatomy, with the entry specimen. */}
          <GuideSection n={4} icon={Eye} title="An entry reads in one glance" tone={SECTION_TONES[3]}>
            <p className="text-sm leading-relaxed text-gray-400">
              Bold role on the left, period on the right, the place in the
              accent right under it, and at most two lines of proof — ideally
              with a number in it. If a line survives no skim, it doesn't
              survive the cut.
            </p>
            <div className="mx-auto w-full max-w-sm rounded-xl bg-white p-5 text-left shadow-lg">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">
                  Frontend Intern
                </p>
                <p className="text-[10px] font-medium" style={{ color: hex }}>
                  2024 — Present
                </p>
              </div>
              <p className="mt-0.5 text-xs font-medium" style={{ color: hex }}>
                Studio Loop
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                Rewrote the checkout flow in React — cart-to-order time down
                38% across 12k monthly orders.
              </p>
            </div>
          </GuideSection>

          {/* 5 — Bullet writing, taught by before/after. */}
          <GuideSection n={5} icon={PenLine} title="Bullets carry a verb and a number" tone={SECTION_TONES[4]}>
            <p className="text-sm leading-relaxed text-gray-400">
              A duty says what you were for; a result says what changed because
              of you. Open with an action verb, close with a number — even a
              rough one beats none.
            </p>
            <div className="mx-auto grid w-full max-w-sm gap-2.5">
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3.5 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  Before — a duty
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  Responsible for handling the social media accounts of the
                  company and making posts when needed.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3.5 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  After — a result
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-300">
                  Grew the company page to{" "}
                  <span className="font-semibold text-emerald-300">
                    12k followers
                  </span>{" "}
                  in six months with three posts a week.
                </p>
              </div>
            </div>
          </GuideSection>

          {/* 6 — Ordering, with the section-stack specimen. */}
          <GuideSection
            n={6}
            icon={ListOrdered}
            title="Order tells the story"
            tone={SECTION_TONES[5]}
          >
            <p className="text-sm leading-relaxed text-gray-400">
              Newest first in every section — a recruiter reads top-down and
              stops early. Lead with your strongest material, and put sections
              in the order your story needs, not the order a form suggests.
            </p>
            <div className="mx-auto w-full max-w-sm rounded-xl bg-white p-4 text-left shadow-lg">
              {[
                ["Summary", "two lines, no more"],
                ["Experience", "current role on top"],
                ["Projects", "your best, not your first"],
                ["Skills", "the ones this CV proves"],
                ["Education", "short — it fades with time"],
              ].map(([title, note], index) => (
                <div
                  key={title}
                  className={`flex items-center gap-3 py-1.5 ${
                    index > 0 ? "border-t border-gray-100" : ""
                  }`}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: hex }}
                  >
                    {index + 1}
                  </span>
                  <p className="text-xs font-semibold text-gray-900">{title}</p>
                  <p className="ml-auto text-[10px] italic text-gray-400">
                    {note}
                  </p>
                </div>
              ))}
            </div>
          </GuideSection>

          {/* 7 — Restraint, as the do/don't wall. */}
          <GuideSection n={7} icon={Scissors} title="Restraint is the style" tone={SECTION_TONES[6]}>
            <p className="text-sm leading-relaxed text-gray-400">
              Most CVs fail by addition, not subtraction. The fastest upgrade
              is a delete key: fewer fonts, fewer colors, fewer words.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Do
                </p>
                <ul className="mt-2.5 flex flex-col gap-2">
                  {dos.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2 text-xs leading-relaxed text-gray-300"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-red-400">
                  Don't
                </p>
                <ul className="mt-2.5 flex flex-col gap-2">
                  {donts.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2 text-xs leading-relaxed text-gray-300"
                    >
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GuideSection>

          {/* 8 — The AI path: plain words in, a drafted CV out. */}
          <GuideSection n={8} icon={Bot} title="Let the AI write the first draft" tone={SECTION_TONES[7]}>
            <p className="text-sm leading-relaxed text-gray-400">
              No forms to fill by hand — open the chat (Robi, the floating
              button) and tell it about you in plain words: education,
              experience, skills, projects. It composes the sections and saves
              the CV for you; then you take over as the editor and check every
              line against the principles above.
            </p>
            <div className="mx-auto flex w-full max-w-sm flex-col gap-2.5">
              {/* The user's side: plain words in. */}
              <div className="self-end rounded-2xl rounded-br-md bg-gradient-to-br from-sky-500 to-indigo-500 px-4 py-2.5 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  You tell Robi
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-white">
                  Final-year CSE student, interned at Studio Loop, built three
                  React projects — here are the details…
                </p>
              </div>
              {/* The AI's side: composed sections out. */}
              <div className="self-start rounded-2xl rounded-bl-md border border-white/10 bg-gray-800 px-4 py-2.5 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  Robi writes
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-300">
                  Done — Summary, Experience and Projects drafted and saved.
                  Open the CV and tweak anything you'd say differently.
                </p>
              </div>
              <p className="text-center text-[10px] italic text-gray-400">
                Plain words in, a drafted CV out — you bring the taste.
              </p>
            </div>
          </GuideSection>

          {/* 9 — Ship it, then squint-test: the final checklist. */}
          <GuideSection
            n={9}
            icon={ClipboardCheck}
            title="Ship it, then squint-test it"
            tone={SECTION_TONES[8]}
          >
            <p className="text-sm leading-relaxed text-gray-400">
              Seven checks before anyone else sees it — every one takes
              seconds, every one catches what eyes adapted to your own screen
              miss.
            </p>
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-pink-500/10 p-4">
              <ul className="flex flex-col gap-2.5">
                {checklist.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-300"
                  >
                    <span
                      className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border"
                      style={{ borderColor: hex }}
                    >
                      <Check className="h-2.5 w-2.5" style={{ color: hex }} />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </GuideSection>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
          {/* The loop-closer: read the recipe, or take it ready-made. */}
          {onBrowse && (
            <button
              type="button"
              onClick={onBrowse}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-sm font-semibold text-gray-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
            >
              <Palette className="h-4 w-4" /> Skip the lesson — browse 100
              ready designs
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-sky-400 hover:to-indigo-400"
          >
            <Check className="h-4 w-4" /> Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignGuide;
