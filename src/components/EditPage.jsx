import { useMemo, useState } from "react";
import { Check, Loader2, RotateCcw, Save } from "lucide-react";
import { usePortfolio } from "../portfolio/portfolio-context";
import { normalizeContent } from "../content/portfolioShape";
import { HeroForm } from "./edit/HeroForm";
import { AboutForm } from "./edit/AboutForm";
import { SkillsForm } from "./edit/SkillsForm";
import { ProjectsForm } from "./edit/ProjectsForm";
import { ContactForm } from "./edit/ContactForm";
import { ProfilePicSection } from "./edit/ProfilePicSection";
import { ExportButton } from "./edit/ExportButton";

const SECTIONS = [
  { key: "hero", label: "Hero", Form: HeroForm },
  { key: "about", label: "About", Form: AboutForm },
  { key: "skills", label: "Skills", Form: SkillsForm },
  { key: "projects", label: "Projects", Form: ProjectsForm },
  { key: "contact", label: "Contact", Form: ContactForm },
  { key: "profile", label: "Profile" },
];

const EMPTY_SECTIONS = {
  hero: { greeting: "", title: "", bio: { text: "", accentClass: "" }, skills: [] },
  about: { paragraphs: [] },
  skills: [],
  projects: [],
  contact: { intro: "", mail: {}, github: {}, linkedin: {}, extras: [] },
};

// The active tab survives a page refresh via sessionStorage (cleared when the
// browser tab closes, so a later visit always starts fresh at Hero).
const sectionKeyFromSession = () => {
  try {
    const saved = sessionStorage.getItem("edit:section");
    return SECTIONS.some((s) => s.key === saved) ? saved : "hero";
  } catch {
    return "hero";
  }
};

const EditPage = () => {
  const { content, saving, save } = usePortfolio();
  const [activeKey, setActiveKey] = useState(sectionKeyFromSession);
  const [draft, setDraft] = useState(content);
  const [saveState, setSaveState] = useState(null); // null | "saved" | error message

  const selectSection = (key) => {
    setActiveKey(key);
    try {
      sessionStorage.setItem("edit:section", key);
    } catch {
      // Storage unavailable (private mode) — the switch itself still works.
    }
  };

  const ActiveForm = useMemo(
    () => (SECTIONS.find((s) => s.key === activeKey) ?? SECTIONS[0]).Form,
    [activeKey]
  );

  if (!draft) return null;

  const dirty = JSON.stringify(draft) !== JSON.stringify(content);

  const handleSave = async () => {
    setSaveState(null);
    try {
      await save(normalizeContent(draft, content));
      setSaveState("saved");
      setTimeout(() => setSaveState(null), 2500);
    } catch (error) {
      setSaveState(error?.message || "Saving failed.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-900 px-4 py-8 md:px-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-28">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-sky-400">
              Edit portfolio
            </h2>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Changes show on your live pages as soon as you save.
            </p>
          </div>
          <ExportButton draft={draft} />
        </header>

        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => selectSection(s.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                s.key === activeKey
                  ? "bg-sky-500 border-sky-400 text-white"
                  : "bg-gray-800 border-white/10 text-gray-300 hover:text-sky-300 hover:border-sky-400/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {activeKey === "contact" ? (
          <section className="bg-gray-800 border border-white/10 rounded-2xl shadow-xl p-5 md:p-8">
            <ContactForm
              value={draft.contact ?? EMPTY_SECTIONS.contact}
              onChange={(next) => setDraft({ ...draft, contact: next })}
            />
          </section>
        ) : activeKey === "profile" ? (
          <div className="max-w-sm">
            <ProfilePicSection />
          </div>
        ) : (
          <section className="bg-gray-800 border border-white/10 rounded-2xl shadow-xl p-5 md:p-8">
            <ActiveForm
              value={draft[activeKey] ?? EMPTY_SECTIONS[activeKey]}
              onChange={(next) => setDraft({ ...draft, [activeKey]: next })}
            />
          </section>
        )}
      </div>

      {/* Sticky save bar — always visible, shows dirty state and result. */}
      <div className="fixed bottom-0 inset-x-0 bg-gray-800/90 backdrop-blur border-t border-white/10 z-40">
        <div className="max-w-3xl mx-auto px-4 md:px-10 py-3 flex items-center gap-3">
          <span className="text-sm text-gray-400 flex-1">
            {saveState === "saved" ? (
              <span className="inline-flex items-center gap-1.5 text-green-400">
                <Check className="w-4 h-4" /> Saved
              </span>
            ) : typeof saveState === "string" ? (
              <span className="text-red-400">{saveState}</span>
            ) : dirty ? (
              "Unsaved changes"
            ) : (
              "Everything saved"
            )}
          </span>
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setDraft(content);
                setSaveState(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-gray-300 border border-white/10 hover:border-sky-400/40 hover:text-sky-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Discard
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-linear-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-sky-500/25 transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPage;
