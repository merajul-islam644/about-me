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
import visitorAvatar from "../../assets/visitor-avatar.jpg";
import { cvDesignPrint } from "./cvDesign";
import {
  GUIDE_CHECKLIST,
  GUIDE_TONES,
  GUIDE_TITLES,
} from "./designGuideContent";

// The design school's shared body — the nine principles with their live
// specimens, rendered from the ACTIVE design's own print palette. Both the
// /cv/design-guide page (the full school) and the cheat-sheet modal (the
// pocket version) draw from this one source, so the two can never drift.
// The principles' shared constants (tones, titles, checklist) live in
// designGuideContent.js.

// One principle, one card: a gradient number badge in this principle's own
// color, a matching topic icon, and whatever teaching body the caller stacks
// inside. Each card carries an anchor id so the page's jump chips can land
// on it (scroll-mt keeps the fixed navbar from covering the landing).
const GuideSection = ({ n, icon: Icon, title, tone, children }) => (
  <section
    id={`principle-${n}`}
    className="flex scroll-mt-24 flex-col gap-3 rounded-xl border border-white/10 bg-gray-800/40 p-4 transition-colors hover:border-white/20 sm:p-5"
  >
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

export const DesignGuideBody = ({ design = "classic" }) => {
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

  return (
    <div className="flex flex-col gap-4">
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
      <GuideSection n={1} icon={Type} title={GUIDE_TITLES[0]} tone={GUIDE_TONES[0]}>
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
      <GuideSection n={2} icon={Palette} title={GUIDE_TITLES[1]} tone={GUIDE_TONES[1]}>
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
      <GuideSection n={3} icon={LayoutGrid} title={GUIDE_TITLES[2]} tone={GUIDE_TONES[2]}>
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
      <GuideSection n={4} icon={Eye} title={GUIDE_TITLES[3]} tone={GUIDE_TONES[3]}>
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
      <GuideSection n={5} icon={PenLine} title={GUIDE_TITLES[4]} tone={GUIDE_TONES[4]}>
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
      <GuideSection n={6} icon={ListOrdered} title={GUIDE_TITLES[5]} tone={GUIDE_TONES[5]}>
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
      <GuideSection n={7} icon={Scissors} title={GUIDE_TITLES[6]} tone={GUIDE_TONES[6]}>
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
      <GuideSection n={8} icon={Bot} title={GUIDE_TITLES[7]} tone={GUIDE_TONES[7]}>
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
      <GuideSection n={9} icon={ClipboardCheck} title={GUIDE_TITLES[8]} tone={GUIDE_TONES[8]}>
        <p className="text-sm leading-relaxed text-gray-400">
          Seven checks before anyone else sees it — every one takes
          seconds, every one catches what eyes adapted to your own screen
          miss.
        </p>
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-pink-500/10 p-4">
          <ul className="flex flex-col gap-2.5">
            {GUIDE_CHECKLIST.map((line) => (
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
  );
};

export default DesignGuideBody;
