import { useEffect, useRef, useState } from "react";
import { Eye, Loader2, X } from "lucide-react";
import { CvMiniPreview } from "./CvMiniPreview";
import { CV_DESIGNS, designComboKey } from "./cvDesign";

// The Design picker — a hundred CV designs as one scrollable grid, like a
// template store: browse, and pick the one that looks right. Each card is a
// LIVE miniature of the whole CV rendered in that design (the real
// components scaled down — no screenshots). A hundred full renders at once
// would be heavy, so every card mounts its preview only when it scrolls near
// the viewport; until then it shows a quiet placeholder.
//
// Hovering a card reveals a "Print preview" button: it builds that design's
// real print PDF (the same jsPDF document the download produces) and shows
// it in an overlay, so picking is an informed decision. The PDF module
// (~350 KB with jsPDF) loads on demand, exactly like the download.
const PREVIEW_W = 800; // design-render width in px…
const SCALE = 0.3; // …scaled into the ~240px card.

const useInView = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);
  return [ref, inView];
};

const DesignCard = ({ design, cv, picture, active, busy, onPick, onPreview }) => {
  const [ref, inView] = useInView();
  return (
    // A div, not a button — the hover-revealed Print preview button cannot
    // nest inside one. Pick = click anywhere on the card (or Enter on it).
    <div
      role="button"
      tabIndex={0}
      onClick={() => onPick(design.key)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !busy) onPick(design.key);
      }}
      className={
        active
          ? "group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-sky-400/60 bg-gray-800 p-3 text-left transition-colors"
          : "group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-white/10 bg-gray-800 p-3 text-left transition-colors hover:border-sky-400/50"
      }
    >
      <div
        ref={ref}
        className={`relative h-72 w-full overflow-hidden rounded-lg border border-white/10 ${
          design.tone === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* A transform never reflows, so the inner node keeps its explicit
            800px width and just shrinks — pinned top-left, click-through,
            cropped by the card. */}
        {inView ? (
          <div
            className="pointer-events-none absolute left-0 top-0 origin-top-left"
            style={{ width: PREVIEW_W, transform: `scale(${SCALE})` }}
            aria-hidden="true"
          >
            <CvMiniPreview cv={cv} design={design.key} picture={picture} />
          </div>
        ) : (
          <div className="h-full w-full animate-pulse bg-gray-700/40" />
        )}
        {/* The hover overlay: reveals the print-preview door without
            blocking the click-to-pick thumbnail. */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPreview(design);
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400"
          >
            <Eye className="h-4 w-4" /> Print preview
          </button>
        </div>
      </div>
      <span className="flex items-center gap-2 text-sm font-semibold text-sky-300">
        {design.label}
        {active && (
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
            Active
          </span>
        )}
      </span>
      <span className="text-xs leading-relaxed text-gray-400">
        {design.description}
      </span>
    </div>
  );
};

export const DesignGallery = ({
  open,
  busy,
  error,
  activeDesign,
  cv,
  content,
  picture,
  onPick,
  onClose,
  localOnly = false,
  onResetLocal = null,
}) => {
  // The print-preview overlay: one design at a time, its PDF built on
  // demand and shown in the browser's own PDF viewer. The blob URL lives in
  // a ref too, so the unmount cleanup can revoke it — state updates are
  // no-ops by the time cleanup runs.
  const previewUrlRef = useRef(null);
  const [previewDesign, setPreviewDesign] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  if (!open) return null;

  const activeCombo = designComboKey(activeDesign);

  const openPreview = async (design) => {
    if (previewBusy) return;
    setPreviewDesign(design);
    setPreviewBusy(true);
    setPreviewError(null);
    try {
      // Both heavy modules load on demand, exactly like the download —
      // nothing about the preview costs the pages that never open it.
      const [{ buildCvPdf }, pictureData] = await Promise.all([
        import("../../portfolio/cv-pdf"),
        import("../../portfolio/portfolio-export").then((module) =>
          picture
            ? module.toDataUrl(picture)
            : module.defaultPictureDataUrl()
        ),
      ]);
      // The third argument pins the PDF to THIS design — the active CV's
      // stored design stays untouched; this is a look, not a pick.
      const doc = buildCvPdf(content, pictureData, design.key);
      previewUrlRef.current = String(doc.output("bloburl"));
      setPreviewUrl(previewUrlRef.current);
    } catch (previewFailure) {
      setPreviewError(
        previewFailure?.message || "Preview failed — please try again."
      );
    } finally {
      setPreviewBusy(false);
    }
  };

  const closePreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setPreviewDesign(null);
    setPreviewError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Pick a CV design"
    >
      <div
        className="max-h-[85vh] w-full bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">Pick a design</h3>
            <p className="mt-0.5 text-sm text-gray-400">
              {CV_DESIGNS.length} designs. The whole CV — the page and its
              PDF — re-renders in the one you pick; your content stays
              exactly as it is.
              {localOnly && " As a visitor, your pick stays on this device."}
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
        {/* Only the cards scroll — the header and status row stay put. */}
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
          {CV_DESIGNS.map((design) => (
            <DesignCard
              key={design.key}
              design={design}
              cv={cv}
              picture={picture}
              active={design.key === activeCombo}
              busy={busy}
              onPick={onPick}
              onPreview={openPreview}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {busy && <Loader2 className="h-4 w-4 animate-spin text-sky-400" />}
          {error && (
            <span className="text-xs text-red-400" role="alert">
              {error}
            </span>
          )}
          {/* Visitors' picks ride on a per-device preference — this chip
              hands the saved design back. */}
          {localOnly && onResetLocal && (
            <button
              type="button"
              onClick={onResetLocal}
              className="ml-auto cursor-pointer rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
            >
              Reset to the saved design
            </button>
          )}
        </div>
      </div>

      {/* The print preview: the design's real A4 PDF, full-screen over the
          gallery. Esc or the backdrop closes it. */}
      {previewDesign && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closePreview}
          onKeyDown={(event) => event.key === "Escape" && closePreview()}
          role="dialog"
          aria-modal="true"
          aria-label="Print preview"
        >
          <div
            className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Print preview
                </h3>
                <p className="mt-0.5 text-sm text-gray-400">
                  {previewDesign.label} — the exact A4 document the download
                  produces in this design.
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                title="Close preview"
                aria-label="Close preview"
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-gray-800">
              {previewBusy && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
                  Building the print PDF…
                </div>
              )}
              {previewError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm text-red-400" role="alert">
                    {previewError}
                  </span>
                </div>
              )}
              {previewUrl && (
                <iframe
                  title="CV print preview"
                  src={previewUrl}
                  className="h-full w-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignGallery;
