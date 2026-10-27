import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import visitorAvatar from "../assets/visitor-avatar.jpg";
import { motion } from "framer-motion";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";
import { useProfilePicture } from "../portfolio/useProfilePicture";
import { AccentText } from "../content/AccentText";
import {
  ACCENT_CLASS_OPTIONS,
  getActivePortfolio,
  normalizeContent,
} from "../content/portfolioShape";
import { metaText, usePageMeta } from "../lib/usePageMeta";
import { ModeTabs } from "./ModeTabs";

// The About text reads as one plain block: paragraphs separated by a blank
// line, **double asterisks** marking highlights, each paragraph keeping its
// highlight style when the block is written back.
const paragraphsToText = (paragraphs) =>
  (paragraphs ?? []).map((p) => p.text).join("\n\n");

const textToParagraphs = (text, previous = []) =>
  text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk, index) => ({
      text: chunk,
      accentClass: previous[index]?.accentClass ?? ACCENT_CLASS_OPTIONS[0],
    }));

const About = () => {
  const { content, save, guest, guestPicture } = usePortfolio();
  const { status, profile, canEdit } = useAuth();
  const { url, pending: picPending } = useProfilePicture(
    profile?.userId,
    status !== "unauthenticated" && !profile,
  );

  // Everyone starts on the cartoon avatar — signed-in or visitor — until
  // this user uploads their own picture. Guests swap in the webhook's
  // presigned URL, the same face Hero shows them.
  const picture = guest ? (guestPicture || visitorAvatar) : (url ?? visitorAvatar);

  // Signed-in owners edit the section in place: the pencil turns the text
  // block itself into a textarea; save writes it back into the active
  // portfolio (the same move Edit portfolio makes).
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [saveState, setSaveState] = useState(null); // null | "saved" | error message
  const authed = status === "authenticated";

  // The tab names the page and its owner; the description borrows the
  // opening paragraph — the story's own first line sells the page.
  usePageMeta({
    title: `About — ${content?.brand ?? "Portfolio"}`,
    description: metaText(content?.about?.paragraphs?.[0]?.text),
  });

  const startEdit = () => {
    setDraftText(paragraphsToText(content?.about?.paragraphs));
    setEditing(true);
  };

  const handleSave = async () => {
    setSaveState(null);
    try {
      const about = {
        paragraphs: textToParagraphs(draftText, content?.about?.paragraphs),
      };
      const activePortfolio = getActivePortfolio(content);
      const savedPortfolios = (content.portfolios ?? []).map((pf) =>
        pf.id === activePortfolio?.id ? { ...pf, about } : pf
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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-900 flex flex-col">
      {/* Landing mode switch — Portfolio | CV, right under the navbar. */}
      <div className="flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>
      <div className="relative flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-10 gap-8 md:gap-12">
        {/* The edit affordance — top-right of the section, level with the
            heading. Editors only; visitors and viewers see the pure
            showcase. */}
        {authed && canEdit && !editing && (
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

        <motion.img
          src={picture}
          alt={content?.brand || "Profile"}
          className={`w-48 h-48 md:w-64 md:h-64 rounded-xl object-cover border-4 border-sky-500 shadow-lg ${picPending ? "scale-110 blur-xl opacity-60 animate-pulse" : ""}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        />

        <motion.div
          className="max-w-xl w-full text-center md:text-left flex flex-col gap-4"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h1 className="text-4xl font-bold mb-4 text-sky-400">About Me</h1>

          {editing ? (
            <div className="flex flex-col gap-2 text-left">
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
                placeholder="Write your story — **like this** to highlight, blank line between paragraphs."
                className="w-full resize-none rounded-xl border border-sky-400/40 bg-gray-800 p-3 text-sm leading-relaxed text-gray-100 outline-none placeholder:text-gray-500 focus:border-sky-400"
              />
              <div className="flex items-center gap-2">
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
              </div>
            </div>
          ) : (
            content?.about.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={
                  index === 0
                    ? "text-gray-300 text-lg leading-relaxed"
                    : "text-gray-400 text-base"
                }
              >
                <AccentText text={paragraph.text} accentClass={paragraph.accentClass} />
              </p>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default About;
