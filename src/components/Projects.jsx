import { useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, X } from "lucide-react";
import { usePortfolio } from "../portfolio/portfolio-context";
import { useAuth } from "../auth/auth-context";
import {
  getActivePortfolio,
  normalizeContent,
} from "../content/portfolioShape";
import { usePageMeta } from "../lib/usePageMeta";
import { ModeTabs } from "./ModeTabs";

const emptyDraft = { title: "", desc: "", github: "", live: "" };

const addButtonClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-gray-800 p-2.5 text-sm leading-relaxed text-gray-100 outline-none placeholder:text-gray-500 focus:border-sky-400";

const Projects = () => {
  const { content, save } = usePortfolio();
  const { canEdit } = useAuth();
  const projects = content?.projects ?? [];

  // The tab pair sells the wall: whose work it is and what a visitor gets
  // on the cards (code + live demo, exactly what the links offer).
  usePageMeta({
    title: `Projects — ${content?.brand ?? "Portfolio"}`,
    description: `Selected work by ${(content?.brand ?? "this developer").trim()} — what each project does, with code and live demos.`,
  });

  // The Add Project flow: an "Add Project" button — centered in the empty
  // state, top-right once cards exist — opens a modal; saving appends the
  // project to the active portfolio (the same move Edit portfolio makes).
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saveState, setSaveState] = useState(null); // null | error message

  const openModal = () => {
    setDraft(emptyDraft);
    setSaveState(null);
    setModalOpen(true);
  };

  const patchDraft = (next) => setDraft((prev) => ({ ...prev, ...next }));

  const handleAdd = async () => {
    const title = draft.title.trim();
    if (!title) return;
    setSaveState(null);
    try {
      const project = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `p-${Date.now()}`,
        title,
        desc: draft.desc.trim(),
        github: draft.github.trim(),
        live: draft.live.trim(),
      };
      const activePortfolio = getActivePortfolio(content);
      const savedPortfolios = (content.portfolios ?? []).map((pf) =>
        pf.id === activePortfolio?.id
          ? { ...pf, projects: [...(pf.projects ?? []), project] }
          : pf
      );
      await save(
        normalizeContent({ ...content, portfolios: savedPortfolios }, content)
      );
      setModalOpen(false);
    } catch (error) {
      setSaveState(error?.message || "Adding the project failed.");
    }
  };

  // Shared across the fields: Esc backs out, Ctrl/Cmd+Enter adds.
  const modalKeys = (event) => {
    if (event.key === "Escape") setModalOpen(false);
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleAdd();
    }
  };

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
  };

  return (
    <div className="overflow-auto h-[calc(100vh-64px)] flex flex-col bg-gray-800">
      {/* Landing mode switch — Portfolio | CV, right under the navbar. */}
      <div className="flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>
      <div className="relative flex-1 flex flex-col justify-center items-center bg-gray-800 px-6 py-10">
        {/* Editors only — with cards on the wall the button sits top-right,
            level with the heading; visitors and viewers see the pure
            showcase. */}
        {canEdit && projects.length > 0 && (
          <button
            type="button"
            onClick={openModal}
            className={`absolute right-4 top-4 md:right-10 md:top-10 z-10 ${addButtonClass}`}
          >
            <Plus className="w-4 h-4" /> Add Project
          </button>
        )}

        <motion.h1
          className="text-4xl font-bold mb-10 text-sky-400 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Projects
        </motion.h1>

        {projects.length === 0 ? (
          <motion.div
            className="flex flex-col items-center gap-3 text-center bg-gray-700/40 border border-dashed border-white/15 rounded-2xl px-10 py-12 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <FolderOpen className="w-10 h-10 text-sky-400/70" />
            <p className="text-lg font-semibold text-gray-200">No projects yet</p>
            <p className="text-sm text-gray-400">
              {canEdit
                ? "Nothing here yet — add your first project."
                : "Projects will appear here once the owner adds them."}
            </p>
            {canEdit && (
              <button type="button" onClick={openModal} className={`${addButtonClass} mt-2`}>
                <Plus className="w-4 h-4" /> Add Project
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-wrap justify-center gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {projects.map(({ id, title, desc, github, live }) => (
              <motion.div
                key={id}
                className="w-72 rounded-xl border border-white/10 bg-gray-700 shadow-lg p-6 flex flex-col justify-between cursor-pointer"
                variants={cardVariants}
                whileHover={{ scale: 1.05, boxShadow: "0 15px 25px rgba(0,0,0,0.3)" }}
              >
                <div>
                  <h3 className="text-2xl font-semibold mb-2 text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-300 mb-4">{desc}</p>
                </div>
                {(github || live) && (
                  <div className="flex gap-4 justify-center mt-4">
                    {github && (
                      <a
                        href={github}
                        className="text-sky-400 font-semibold hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub
                      </a>
                    )}
                    {live && (
                      <a
                        href={live}
                        className="text-sky-400 font-semibold hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Live Demo
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* The Add Project modal — backdrop click or Esc closes, Ctrl/Cmd+Enter
          adds. Title is the one required field. */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Add project"
        >
          <div
            className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add project</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                title="Close"
                aria-label="Close"
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">Title</span>
              <input
                type="text"
                value={draft.title}
                onChange={(event) => patchDraft({ title: event.target.value })}
                onKeyDown={modalKeys}
                autoFocus
                placeholder="Portfolio & CV Builder"
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">Description</span>
              <textarea
                value={draft.desc}
                onChange={(event) => patchDraft({ desc: event.target.value })}
                onKeyDown={modalKeys}
                rows={3}
                placeholder="What it does, in a line or two."
                className={`${fieldClass} resize-none`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">GitHub link</span>
              <input
                type="url"
                value={draft.github}
                onChange={(event) => patchDraft({ github: event.target.value })}
                onKeyDown={modalKeys}
                placeholder="https://github.com/you/your-project"
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">Live demo link</span>
              <input
                type="url"
                value={draft.live}
                onChange={(event) => patchDraft({ live: event.target.value })}
                onKeyDown={modalKeys}
                placeholder="https://your-project.dev"
                className={fieldClass}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!draft.title.trim()}
                className={`${addButtonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Plus className="w-4 h-4" /> Add Project
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:border-sky-400/40 hover:text-sky-300"
              >
                Cancel
              </button>
              <span className="text-xs text-gray-500">
                Ctrl+Enter adds · Esc closes
              </span>
              {saveState && (
                <span className="text-xs text-red-400" role="alert">
                  {saveState}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
