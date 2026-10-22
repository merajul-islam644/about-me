import { Check, Palette, X } from "lucide-react";
import guideCoach from "../../assets/design-guide-coach.png";
import { CV_ACCENTS, cvDesignPrint, parseCvDesign } from "./cvDesign";

// The "How To Design" guide — a design-school walkthrough of the system this
// CV page is built on: hierarchy before decoration, one accent spent
// sparingly, cards on one rhythm, entries that read in a glance. The six
// principles each come with a live specimen rendered right in the modal —
// on white paper, tinted with the ACTIVE design's accent — so the guide
// teaches by showing, not describing. It closes the loop by handing the
// reader to the template gallery: read the recipe, or take it ready-made.

// The number badge, section titles and every accent stroke in the specimens
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
    "Pick one accent and let gray do everything else",
    "Keep one gap rhythm: every block breathes the same",
    "Write each entry to a glance — role, place, one number",
    "Stop at 6–7 sections; cut what a recruiter would skip",
  ];
  const donts = [
    "Don't stack fonts — one family, two weights, done",
    "Don't color whole paragraphs; accents mark, they don't paint",
    "Don't mix border styles — if it's a card, every card matches",
    "Don't write paragraphs where one metric sentence would land",
    "Don't fill space with fluff — white space IS the design",
  ];
  const checklist = [
    "Squint test: blurred, the name, role and section titles still pop",
    "Every period stamp sits the same way on its line",
    "One page, until real experience honestly demands two",
    "Skills list only what you'd survive an interview question on",
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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            {/* The coach heads the lesson — anchored beside the title. */}
            <img
              src={guideCoach}
              alt="Design coach holding a laptop"
              className="aspect-[423/736] w-14 shrink-0 rounded-xl border border-white/10 object-cover object-top sm:w-16"
            />
            <div>
              <h3 className="text-lg font-bold text-white">
                How to design a CV like this
              </h3>
              <p className="mt-0.5 text-sm text-gray-400">
                The system behind this page, in six principles — each with a
                live specimen in this CV's palette ({accent.label}). Read it,
                then look at your own page with new eyes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The scrollable schoolhouse — header and footer stay put. */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 flex flex-col gap-6">
          {/* The recipe in one line, pulled like a quote. */}
          <div className="rounded-xl border border-white/10 bg-gray-800/60 p-4">
            <p className="text-center text-sm font-semibold leading-relaxed tracking-wide text-gray-300 sm:text-base">
              Big name · one accent · quiet grays · equal gaps —{" "}
              <span className="text-white">everything else is restraint.</span>
            </p>
            <p className="mt-1.5 text-center text-xs leading-relaxed text-gray-500">
              Six short principles below, each with a live specimen — then a
              checklist before you ship.
            </p>
          </div>

          {/* 1 — Hierarchy, with the headline specimen. */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: hex }}
              >
                1
              </span>
              <h4 className="text-base font-bold text-white">
                Hierarchy before decoration
              </h4>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Decide what a stranger must see first — name, then role, then
              where to reach you — and spend size and weight in exactly that
              order. A quiet eyebrow line above the name sets the tone without
              shouting.
            </p>
            <div className="mx-auto w-full max-w-sm rounded-xl bg-white p-5 text-left shadow-lg">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.25em]"
                style={{ color: hex }}
              >
                Hello, I am
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                Asha Rahman
              </p>
              <p className="mt-0.5 text-sm font-semibold" style={{ color: hex }}>
                Frontend Engineer
              </p>
              <p className="mt-1.5 text-xs text-gray-500">
                Dhaka · +880 1XXX-XXXXXX · asha@example.com
              </p>
            </div>
          </section>

          {/* 2 — One accent, with the where-it-lives specimen. */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: hex }}
              >
                2
              </span>
              <h4 className="text-base font-bold text-white">
                One accent, spent sparingly
              </h4>
            </div>
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
          </section>

          {/* 3 — Cards on one rhythm, with the two-card specimen. */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: hex }}
              >
                3
              </span>
              <h4 className="text-base font-bold text-white">
                Everything is a card, on one rhythm
              </h4>
            </div>
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
          </section>

          {/* 4 — Entry anatomy, with the entry specimen. */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: hex }}
              >
                4
              </span>
              <h4 className="text-base font-bold text-white">
                An entry reads in one glance
              </h4>
            </div>
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
          </section>

          {/* 5 — Restraint, as the do/don't wall. */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: hex }}
              >
                5
              </span>
              <h4 className="text-base font-bold text-white">
                Restraint is the style
              </h4>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Most CVs fail by addition, not subtraction. The fastest upgrade
              is a delete key: fewer fonts, fewer colors, fewer words.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-gray-800/60 p-4">
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
              <div className="rounded-xl border border-white/10 bg-gray-800/60 p-4">
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
          </section>

          {/* 6 — Ship it, then squint-test: the final checklist. */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: hex }}
              >
                6
              </span>
              <h4 className="text-base font-bold text-white">
                Ship it, then squint-test it
              </h4>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Five checks before anyone else sees it — every one takes
              seconds, every one catches what eyes adapted to your own screen
              miss.
            </p>
            <div className="rounded-xl border border-white/10 bg-gray-800/60 p-4">
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
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
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
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400"
          >
            <Check className="h-4 w-4" /> Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignGuide;
