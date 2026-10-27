import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePortfolio } from "../../portfolio/portfolio-context";
import { getActiveCv } from "../../content/portfolioShape";
import { usePageMeta } from "../../lib/usePageMeta";
import guideCoach from "../../assets/design-guide-coach.png";
import { ModeTabs } from "../ModeTabs";
import { DesignGuideBody } from "./DesignGuideBody";
import { GUIDE_TITLES, GUIDE_TONES } from "./designGuideContent";
import { CV_ACCENTS, parseCvDesign, resolveCvDesign } from "./cvDesign";

// The design school page (/cv/design-guide) — the long-form home of the
// CV design lesson. The Guidelines button on /cv navigates here instead of
// opening a modal: nine principles is real reading, it keeps growing, and
// a page can be linked from anywhere (onboarding, the chatbot), reopened
// in a second tab, and read without a picker hovering over the CV. The
// rainbow jump chips under the banner anchor-scroll to each principle;
// every specimen renders in the ACTIVE design's own print palette, so the
// school always teaches in the color the reader is actually wearing.
const DesignGuidePage = () => {
  const navigate = useNavigate();
  const { content } = usePortfolio();

  // The active design drives every specimen's accent — visitors reading
  // the site's default content simply get the default design's palette.
  const design = resolveCvDesign(
    content ? getActiveCv(content)?.design : undefined
  );
  const meta = parseCvDesign(design);
  const accent =
    CV_ACCENTS.find((entry) => entry.key === meta.accent) ?? CV_ACCENTS[0];

  // Back to wherever the reader came from — the Guidelines button on /cv,
  // some other page, or a fresh open of the URL (no in-app history: then
  // the CV is the sensible home).
  const goBack = () => {
    if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate("/cv");
  };

  // The school is the site's one open reading page — its tab pair is
  // written for someone who found the URL outside the app.
  usePageMeta({
    title: "CV design school — nine principles",
    description:
      "Nine short principles for designing a CV that reads well — type, hierarchy, color and restraint, with live specimens. Apply them with 100 ready designs.",
  });

  return (
    // The standard page shell — flat gray-900 like the shelves and Job
    // Alerts, with the mode switch under the navbar — so the school reads
    // as part of the app, not a separate document.
    <div className="relative min-h-[calc(100vh-64px)] bg-gray-900 flex flex-col">
      <div className="flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
        {/* The way back — to whatever page opened the school. */}
        <div>
          <button
            type="button"
            onClick={goBack}
            title="Back to the previous page"
            aria-label="Go back"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-gray-800/60 px-3.5 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </div>

      {/* The banner — the school's gradient welcome, at page scale. */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/15" />
        <div className="pointer-events-none absolute -bottom-14 right-24 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative flex items-start gap-4">
          <img
            src={guideCoach}
            alt="Design coach holding a laptop"
            className="aspect-[423/736] w-16 shrink-0 rounded-xl border-2 border-white/40 object-cover object-top sm:w-20"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">
              Design school
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              How to design a CV like this
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">
              Nine short principles, each with a live specimen in this CV's
              palette ({accent.label}) — read them once and your own page
              will never look the same to you.
            </p>
          </div>
        </div>
      </div>

      {/* The jump chips — one per principle, in its own color. */}
      <nav
        className="flex flex-wrap gap-2"
        aria-label="Jump to a principle"
      >
        {GUIDE_TITLES.map((title, index) => (
          <a
            key={title}
            href={`#principle-${index + 1}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-gray-800/60 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-white/25 hover:text-white"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full bg-gradient-to-br ${GUIDE_TONES[index].badge}`}
            />
            {title}
          </a>
        ))}
      </nav>

      {/* The nine principles themselves — shared with the cheat sheet. */}
      <DesignGuideBody design={design} />

      {/* The exit: back to the CV the lessons were about. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
        <p className="text-xs text-gray-500">
          Finished the lesson? The 100 ready designs apply it for you.
        </p>
        <button
          type="button"
          onClick={() => navigate("/cv")}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-sky-400 hover:to-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to my CV
        </button>
      </div>
      </div>
    </div>
  );
};

export default DesignGuidePage;
