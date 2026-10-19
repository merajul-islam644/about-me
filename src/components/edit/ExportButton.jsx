import { useState } from "react";
import { Download, FileText, Loader2, Lock } from "lucide-react";
import { useAuth } from "../../auth/auth-context";
import { usePortfolio } from "../../portfolio/portfolio-context";
import { useProfilePicture } from "../../portfolio/useProfilePicture";
import { useEntitlement } from "../../payments/useEntitlement";
import { normalizeContent } from "../../content/portfolioShape";
import {
  buildPortfolioHtml,
  toDataUrl,
  exportFileName,
  exportPdfFileName,
} from "../../portfolio/portfolio-export";

// One-click export of the portfolio next to the header: a self-contained
// .html website file (free) and a print-ready .pdf document (Pro — the
// Upgrade tab unlocks it). Both export the CURRENT DRAFT (unsaved edits
// included) via the `draft` prop from EditPage. The profile picture is
// fetched and embedded at download time. The PDF module (jspdf, ~350 KB) is
// loaded on demand so it never weighs down first paint.
export const ExportButton = ({ draft }) => {
  const { profile } = useAuth();
  const { content } = usePortfolio();
  const { url } = useProfilePicture(profile?.userId);
  const { loading: entitlementLoading, plan } = useEntitlement();
  const [busy, setBusy] = useState(null); // null | "html" | "pdf"
  const [error, setError] = useState(null);
  const [pdfHint, setPdfHint] = useState(false);
  const pdfReady = !entitlementLoading && plan === "pro";

  const source = draft ?? content;

  // No uploaded picture → null: the HTML export renders its initials avatar
  // and the PDF skips the photo block — never a placeholder photo of someone.
  const pictureDataUrl = () => (url ? toDataUrl(url) : Promise.resolve(null));

  const downloadBlob = (blob, fileName) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleDownloadHtml = async () => {
    setBusy("html");
    setError(null);
    try {
      const picture = await pictureDataUrl();
      const html = buildPortfolioHtml(normalizeContent(source), picture);
      downloadBlob(new Blob([html], { type: "text/html" }), exportFileName(source));
    } catch (exportError) {
      setError(exportError?.message || "Export failed — please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadPdf = async () => {
    setBusy("pdf");
    setError(null);
    try {
      const [{ buildPortfolioPdf }, picture] = await Promise.all([
        import("../../portfolio/portfolio-pdf"),
        pictureDataUrl(),
      ]);
      const doc = buildPortfolioPdf(normalizeContent(source), picture);
      doc.save(exportPdfFileName(source));
    } catch (exportError) {
      setError(exportError?.message || "Export failed — please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handlePdfClick = () => {
    if (entitlementLoading) return; // plan not resolved yet — do nothing
    if (!pdfReady) {
      setPdfHint(true);
      return;
    }
    handleDownloadPdf();
  };

  const pillClass =
    "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-sky-500/10 border border-sky-400/30 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 disabled:opacity-40 disabled:cursor-wait transition-colors";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDownloadHtml}
          disabled={busy !== null}
          className={pillClass}
        >
          {busy === "html" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Building your site…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Download site (.html)
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handlePdfClick}
          disabled={busy !== null}
          className={pillClass}
        >
          {busy === "pdf" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Building your PDF…
            </>
          ) : pdfReady ? (
            <>
              <FileText className="w-4 h-4" /> Download PDF
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" /> Download PDF · Pro
            </>
          )}
        </button>
      </div>
      {pdfHint && !pdfReady && (
        <p className="text-xs text-amber-400">
          PDF export is a Pro feature — upgrade on the Upgrade tab below.
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};
