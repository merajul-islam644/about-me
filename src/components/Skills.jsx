import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";
import {
  getActivePortfolio,
  normalizeContent,
} from "../content/portfolioShape";
import { ModeTabs } from "./ModeTabs";

const Skills = () => {
  const { content, save } = usePortfolio();
  const { status } = useAuth();

  // Inline editing, About-style: the pencil turns the badge wall itself
  // into a textarea — one skill per line — and save writes the list back
  // into the active portfolio (the same move Edit portfolio makes).
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [saveState, setSaveState] = useState(null); // null | "saved" | error message
  const authed = status === "authenticated";

  const startEdit = () => {
    setDraftText((content?.skills ?? []).join("\n"));
    setEditing(true);
  };

  const handleSave = async () => {
    setSaveState(null);
    try {
      const skills = draftText
        .split("\n")
        .map((skill) => skill.trim())
        .filter(Boolean);
      const activePortfolio = getActivePortfolio(content);
      const savedPortfolios = (content.portfolios ?? []).map((pf) =>
        pf.id === activePortfolio?.id ? { ...pf, skills } : pf
      );
      await save(
        normalizeContent({ ...content, portfolios: savedPortfolios }, content)
      );
      setEditing(false);
      setSaveState("saved");
      setTimeout(() => setSaveState(null), 2500);
    } catch (error) {
      setSaveState(error?.message || "Saving failed.");
    }
  };

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
  };

  return (
    <div className="overflow-auto h-[calc(100vh-64px)] flex flex-col bg-gray-900">
      {/* Landing mode switch — Portfolio | CV, right under the navbar. */}
      <div className="flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>
      <div className="relative flex-1 flex flex-col justify-center items-center bg-gray-900 px-6 pb-8">
        {/* The edit affordance — top-right of the section. Owners only;
            visitors see the pure showcase. */}
        {authed && !editing && (
          <button
            type="button"
            onClick={startEdit}
            title="Edit this section"
            aria-label="Edit this section"
            className="absolute right-4 top-4 md:right-10 md:top-10 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
        {saveState === "saved" && (
          <span className="absolute right-4 top-4 md:right-10 md:top-10 z-10 inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-sm font-medium text-teal-400">
            <Check className="w-4 h-4" /> Saved
          </span>
        )}

        <motion.h2
          className="text-4xl font-bold mb-10 text-sky-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Skills
        </motion.h2>

        {editing ? (
          <div className="w-full max-w-md flex flex-col gap-2">
            <textarea
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setEditing(false);
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  handleSave();
                }
              }}
              rows={8}
              autoFocus
              placeholder="One skill per line — each becomes a badge."
              className="w-full resize-none rounded-xl border border-sky-400/40 bg-gray-800 p-3 text-sm leading-relaxed text-gray-100 outline-none placeholder:text-gray-500 focus:border-sky-400"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400"
              >
                <Check className="w-4 h-4" /> Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-sm font-semibold text-gray-300 transition-colors hover:border-sky-400/40 hover:text-sky-300"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <span className="text-xs text-gray-500">
                Ctrl+Enter saves · Esc cancels
              </span>
              {saveState && saveState !== "saved" && (
                <span className="text-xs text-red-400" role="alert">
                  {saveState}
                </span>
              )}
            </div>
          </div>
        ) : (
          <motion.div
            className="flex flex-wrap justify-center items-center gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {content?.skills.map((skill) => (
              <motion.span
                key={skill}
                className="bg-gray-700 px-6 py-3 rounded-full shadow cursor-default hover:bg-sky-500 transition-all duration-300 text-white font-medium"
                variants={badgeVariants}
                whileHover={{ scale: 1.1 }}
              >
                {skill}
              </motion.span>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Skills;
