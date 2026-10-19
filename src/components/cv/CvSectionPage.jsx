import { usePortfolio } from "../../portfolio/portfolio-context";
import { getActiveCv } from "../../content/portfolioShape";
import { ModeTabs } from "../ModeTabs";
import { CvDocument } from "./CvDocument";

// A CV-mode page (About / Skills / Projects / Contact): shows the sections
// the owner assigned to this page in the CV editor, of the CV they marked
// active. Public, like the rest of the showcase — only editing is gated.
export const CvSectionPage = ({ pageKey, label }) => {
  const { content } = usePortfolio();
  const sections = (getActiveCv(content)?.sections ?? []).filter(
    (section) => section.page === pageKey
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-gray-800">
      <div className="flex justify-center px-6 pt-6">
        <ModeTabs />
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 py-10">
        <header className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
            Curriculum Vitae
          </p>
          <h2 className="text-2xl font-bold text-white">{label}</h2>
        </header>
        <CvDocument sections={sections} />
        {sections.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-gray-400">
            Nothing on this page yet — assign a section to “{label}” from Edit
            CV.
          </p>
        )}
      </div>
    </div>
  );
};

export default CvSectionPage;
