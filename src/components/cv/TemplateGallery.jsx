import { Loader2, X } from "lucide-react";
import { CV_PRESETS } from "../../content/portfolioShape";
import templatePreview from "../../assets/cv-template-preview.png";

// Every template builds the same document design — the one the /cv page
// renders — so the cards all show that real page as their picture: users
// guess the look by seeing it, and the section list under it tells the
// templates apart.
export const TemplateGallery = ({ open, busy, error, onPick, onClose }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Pick a CV template"
    >
      <div
        className="max-h-[85vh] w-full bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">Pick a template</h3>
            <p className="mt-0.5 text-sm text-gray-400">
              Starts with the sections that profession needs — rename,
              reorder, add or remove everything afterwards.
            </p>
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
        {/* Only the cards scroll — the header above and the blank-CV footer
            below stay put. */}
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
          {CV_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              disabled={busy}
              onClick={() => onPick(preset)}
              className="flex cursor-pointer flex-col gap-2 rounded-xl border border-white/10 bg-gray-800 p-3 text-left transition-colors hover:border-sky-400/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <img
                src={templatePreview}
                alt={`${preset.label} CV preview`}
                className="h-44 w-full rounded-lg border border-white/10 object-cover object-top"
              />
              <span className="text-sm font-semibold text-sky-300">
                {preset.label}
              </span>
              <span className="text-xs leading-relaxed text-gray-400">
                {preset.sections.map((section) => section.title).join(" · ")}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => onPick(null)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-400 underline-offset-4 transition-colors hover:text-sky-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start from a blank CV instead
          </button>
          {busy && <Loader2 className="h-4 w-4 animate-spin text-sky-400" />}
          {error && (
            <span className="text-xs text-red-400" role="alert">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
