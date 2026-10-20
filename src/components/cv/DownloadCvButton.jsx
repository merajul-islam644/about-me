import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useAuth } from "../../auth/auth-context";
import { usePortfolio } from "../../portfolio/portfolio-context";
import { useProfilePicture } from "../../portfolio/useProfilePicture";
import { toDataUrl } from "../../portfolio/portfolio-export";

// The one document action on the CV views: build a print-ready A4 PDF of
// the WHOLE CV (all sections, not just the page you're on) and save it.
// Owner-only: the button renders for signed-in users — visitors browse the
// public showcase without it. `draftCv` (an unsaved CV draft) overrides the
// saved content — without it the PDF is built from the active CV. The
// uploaded profile picture is fetched and embedded top-right at download
// time. The PDF module (~350 KB with jsPDF) loads on demand, exactly like
// the portfolio's export.
export const DownloadCvButton = ({ draftCv }) => {
  const { status, profile } = useAuth();
  const { content } = usePortfolio();
  const { url: pictureUrl } = useProfilePicture(profile?.userId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (status !== "authenticated") return null;

  const source = draftCv
    ? { ...content, cvs: undefined, cv: draftCv }
    : content;

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const [{ buildCvPdf, cvPdfFileName }, picture] = await Promise.all([
        import("../../portfolio/cv-pdf"),
        pictureUrl ? toDataUrl(pictureUrl) : Promise.resolve(null),
      ]);
      const doc = buildCvPdf(source, picture);
      doc.save(cvPdfFileName(source));
    } catch (exportError) {
      setError(exportError?.message || "Export failed — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow transition-colors hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Building PDF…
          </>
        ) : (
          <>
            <Download className="h-4 w-4" /> Download CV
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default DownloadCvButton;
