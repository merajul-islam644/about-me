import {
  Check,
  ClipboardCheck,
  GraduationCap,
  Palette,
  X,
} from "lucide-react";
import guideCoach from "../../assets/design-guide-coach.png";
import {
  GUIDE_CHECKLIST,
  GUIDE_TONES,
  GUIDE_TITLES,
} from "./designGuideContent";
import { CV_ACCENTS, cvDesignPrint, parseCvDesign } from "./cvDesign";

// The design cheat sheet — the pocket version of the design school. The
// full nine-principle lesson lives on its own page (/cv/design-guide);
// this modal keeps just the essentials a picker needs at arm's length:
// the one-line recipe and the final ship checklist. Its footer hands the
// reader to the full school (onFull) or the template gallery (onBrowse),
// so the short and long versions loop into each other instead of
// competing. Like the school page, it tints itself with the ACTIVE
// design's print palette.

export const DesignGuide = ({
  open,
  onClose,
  design = "classic",
  onBrowse,
  onFull,
}) => {
  if (!open) return null;

  const meta = parseCvDesign(design);
  const accent =
    CV_ACCENTS.find((entry) => entry.key === meta.accent) ?? CV_ACCENTS[0];
  const theme = cvDesignPrint(design);
  const hex = theme.hex;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="CV design cheat sheet"
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
        onClick={(event) => event.stopPropagation()}
      >
        {/* The banner — the school's gradient, kept short. shrink-0 keeps
            the modal's flex column from squeezing it (and overflow-hidden
            from then clipping the text away). */}
        <div className="relative shrink-0 overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 p-4">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15" />
          <div className="pointer-events-none absolute -bottom-10 right-16 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative flex items-start gap-3.5">
            <img
              src={guideCoach}
              alt="Design coach holding a laptop"
              className="aspect-[423/736] w-12 shrink-0 rounded-xl border-2 border-white/40 object-cover object-top sm:w-14"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">
                Design school
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-white">
                The design cheat sheet
              </h3>
              <p className="mt-0.5 text-sm leading-relaxed text-white/85">
                The short version, in this CV's palette ({accent.label}) —
                the full nine-principle school lives on its own page.
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

        {/* The scrollable pocket lesson — banner and footer stay put. */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {/* The recipe in one line — a rainbow-tinted pull-quote, edged
              in the design's accent. */}
          <div
            className="rounded-xl border border-white/10 border-l-4 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-pink-500/10 p-4"
            style={{ borderLeftColor: hex }}
          >
            <p className="text-sm font-semibold leading-relaxed tracking-wide text-gray-300 sm:text-base">
              Big name · one accent · quiet grays · equal gaps —{" "}
              <span className="text-white">everything else is restraint.</span>
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
              Carry this one line while you build; the checklist below
              before you ship.
            </p>
          </div>

          {/* The final checklist, shared word-for-word with the school. */}
          <section className="flex flex-col gap-3 rounded-xl border border-white/10 bg-gray-800/40 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${GUIDE_TONES[8].badge}`}
              >
                9
              </span>
              <h4 className="min-w-0 flex-1 text-base font-bold text-white">
                {GUIDE_TITLES[8]}
              </h4>
              <ClipboardCheck
                className={`h-4 w-4 shrink-0 ${GUIDE_TONES[8].text}`}
              />
            </div>
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
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
          {/* The loop-closers: the full school, or ready-made designs. */}
          {onBrowse && (
            <button
              type="button"
              onClick={onBrowse}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-sm font-semibold text-gray-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
            >
              <Palette className="h-4 w-4" /> Browse 100 ready designs
            </button>
          )}
          {onFull && (
            <button
              type="button"
              onClick={onFull}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-sky-400 hover:to-indigo-400"
            >
              <GraduationCap className="h-4 w-4" /> Open the full school
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignGuide;
