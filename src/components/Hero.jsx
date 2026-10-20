import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Check, LayoutTemplate, Loader2, Pencil, X } from "lucide-react";
import visitorAvatar from "../assets/visitor-avatar.jpg";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";
import { useProfilePicture } from "../portfolio/useProfilePicture";
import { AccentText } from "../content/AccentText";
import {
  CV_PAGES,
  defaultCvFor,
  getActiveCv,
  getActivePortfolio,
  normalizeContent,
  seedSections,
  SKILL_COLOR_OPTIONS,
} from "../content/portfolioShape";
import { getMode } from "../modes";
import { ModeTabs } from "./ModeTabs";
import { CvDocument } from "./cv/CvDocument";
import { TemplateGallery } from "./cv/TemplateGallery";

// Skill badges read back as one comma-separated line; colors ride along by
// position — a brand-new badge falls back to the same sky default the full
// editor starts new badges on.
const skillsToText = (skills) =>
  (skills ?? []).map((skill) => skill.name).join(", ");

const textToSkills = (text, previous = []) =>
  text
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((name, index) => ({
      name,
      color: previous[index]?.color ?? SKILL_COLOR_OPTIONS[3],
    }));

// CV mode: the headline's personal-information strip (city, phone, email,
// one optional link) is editable from the same pencil form.
const EMPTY_CONTACT = { location: "", phone: "", email: "", link: "" };

const CONTACT_FIELDS = [
  { field: "location", label: "City / Country", placeholder: "Dhaka, Bangladesh" },
  { field: "phone", label: "Phone", placeholder: "+880 1XXX XXX XXX" },
  { field: "email", label: "Email", placeholder: "you@example.com" },
  { field: "link", label: "LinkedIn / portfolio", placeholder: "linkedin.com/in/you" },
];

// Fresh CV ids — same idiom as the shelf.
const newId = (prefix) =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Math.random().toString(16).slice(2)}`;

const Hero = () => {
  const { content, save } = usePortfolio();
  const { status, profile } = useAuth();
  const { url, uploading, error, upload } = useProfilePicture(profile?.userId);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // CV mode swaps the words, not the face: same layout and picture, but the
  // ACTIVE CV's hero fields (the owner picks which of their CVs is public)
  // instead of the portfolio's.
  const isCvPath = getMode(pathname).key === "cv";
  const activeCv = getActiveCv(content);
  const cvMode = isCvPath && Boolean(activeCv);
  const hero = cvMode ? activeCv : content?.hero;

  // Everyone starts on the cartoon avatar — signed-in or visitor — until
  // this user uploads their own picture.
  const picture = url ?? visitorAvatar;
  const fileInputRef = useRef(null);

  // Inline editing, About-style: the pencil turns the text column itself
  // into fields; save writes back into whichever hero is on display (the
  // active CV in CV mode, the active portfolio otherwise) — the same move
  // Edit portfolio makes.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    greeting: "",
    title: "",
    bioText: "",
    skillsText: "",
    contact: { ...EMPTY_CONTACT },
  });
  const [saveState, setSaveState] = useState(null); // null | "saved" | error message

  // Per-section editing on the CV document: one pencil per section card,
  // the clicked card's body swaps to the inline editor until Save.
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [draftSection, setDraftSection] = useState(null);

  // The "More templates" door on /cv — the same gallery the shelf's New CV
  // opens. Picking a preset creates a fresh CV from it and makes it the
  // active one this page shows.
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [templateError, setTemplateError] = useState(null);
  const authed = status === "authenticated";

  const startEdit = () => {
    setDraft({
      greeting: hero.greeting,
      title: hero.title,
      bioText: hero.bio.text,
      skillsText: skillsToText(hero.skills),
      contact: { ...EMPTY_CONTACT, ...(hero.contact ?? {}) },
    });
    setEditing(true);
  };

  const patchDraft = (next) => setDraft((prev) => ({ ...prev, ...next }));

  const handleSave = async () => {
    setSaveState(null);
    try {
      const words = {
        greeting: draft.greeting,
        title: draft.title,
        bio: { ...hero.bio, text: draft.bioText },
        skills: textToSkills(draft.skillsText, hero.skills),
        // Personal information rides along in CV mode only — the portfolio
        // hero has no contact strip.
        ...(cvMode ? { contact: draft.contact } : {}),
      };
      const savedContent = cvMode
        ? {
            ...content,
            cvs: (content.cvs ?? []).map((cv) =>
              cv.id === activeCv?.id ? { ...cv, ...words } : cv
            ),
          }
        : {
            ...content,
            portfolios: (content.portfolios ?? []).map((pf) =>
              pf.id === getActivePortfolio(content)?.id
                ? { ...pf, hero: { ...pf.hero, ...words } }
                : pf
            ),
          };
      await save(normalizeContent(savedContent, content));
      setEditing(false);
      setSaveState("saved");
      setTimeout(() => setSaveState(null), 2500);
    } catch (saveError) {
      setSaveState(saveError?.message || "Saving failed.");
    }
  };

  // Shared across the fields: Esc backs out, Ctrl/Cmd+Enter saves.
  const draftKeys = (event) => {
    if (event.key === "Escape") setEditing(false);
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSave();
    }
  };

  // Section editing on the CV document — the same pencil pattern one level
  // deeper: the clicked card's items become the draft, Save writes the whole
  // section back into the active CV.
  const startSectionEdit = (section) => {
    setDraftSection({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    });
    setEditingSectionId(section.id);
  };

  const cancelSectionEdit = () => {
    setEditingSectionId(null);
    setDraftSection(null);
  };

  const handleSectionSave = async () => {
    if (!draftSection) return;
    setSaveState(null);
    try {
      const savedContent = {
        ...content,
        cvs: (content.cvs ?? []).map((cv) =>
          cv.id === activeCv?.id
            ? {
                ...cv,
                sections: (cv.sections ?? []).map((section) =>
                  section.id === draftSection.id ? draftSection : section
                ),
              }
            : cv
        ),
      };
      await save(normalizeContent(savedContent, content));
      cancelSectionEdit();
      setSaveState("saved");
      setTimeout(() => setSaveState(null), 2500);
    } catch (saveError) {
      setSaveState(saveError?.message || "Saving failed.");
    }
  };

  // One edit-config shared by every CvDocument group; null for visitors so
  // the document renders read-only.
  const sectionEdit = authed
    ? {
        activeId: editingSectionId,
        draft: draftSection,
        onDraftChange: setDraftSection,
        onStart: startSectionEdit,
        onSave: handleSectionSave,
        onCancel: cancelSectionEdit,
        error: saveState && saveState !== "saved" ? saveState : null,
      }
    : null;

  // Picking a template creates a fresh CV from the preset (the shelf's New
  // CV flow) and makes it active — this page immediately shows it. Visitors
  // can browse the gallery, but a pick walks them to sign-in first;
  // returnTo brings them straight back here.
  const handlePickTemplate = async (preset) => {
    if (templateBusy) return;
    if (!authed) {
      navigate(`/login?returnTo=${encodeURIComponent("/cv")}`);
      return;
    }
    setTemplateError(null);
    setTemplateBusy(true);
    try {
      const list = content.cvs ?? [];
      const fresh = {
        id: newId("cv"),
        name: `CV ${list.length + 1}`,
        ...defaultCvFor({ hero: content.hero }),
        sections: preset ? seedSections(preset) : [],
      };
      await save(
        normalizeContent(
          { ...content, cvs: [...list, fresh], activeCvId: fresh.id },
          content
        )
      );
      setTemplateOpen(false);
    } catch (createError) {
      setTemplateError(
        createError?.message || "Creating failed — please try again."
      );
    } finally {
      setTemplateBusy(false);
    }
  };

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be picked again
    if (!file) return;
    await upload(file);
  };

  const fieldClass =
    "w-full rounded-xl border border-sky-400/40 bg-gray-900 p-2.5 text-sm leading-relaxed text-gray-100 outline-none placeholder:text-gray-500 focus:border-sky-400";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-800 flex flex-col">
      {/* Landing mode switch — Portfolio | CV, right under the navbar. */}
      <div className="flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>

      <div className="relative flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-10 gap-8">
        {/* The edit affordance — top-right of the section, level with the
            heading. Owners only; visitors see the pure showcase. */}
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

      <div className="flex flex-col items-center gap-3">
        {/* The templates door — sits right above the picture, centered on it
            (CV mode only): owners pick a preset to start a fresh CV from it,
            visitors are walked to sign-in on a pick. */}
        {isCvPath && (
          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            title="Browse CV templates"
            className="inline-flex -translate-y-5 cursor-pointer items-center gap-1.5 rounded-full bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400"
          >
            <LayoutTemplate className="w-4 h-4" /> More templates
          </button>
        )}
        <motion.div
          className="relative w-36 h-36 md:w-48 md:h-48 group"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={picture}
            alt={content?.brand || "Profile"}
            className={`w-full h-full rounded-full object-cover border-4 border-sky-400 shadow-lg transition ${uploading ? "opacity-50" : ""}`}
          />
          {/* Mobile: a camera badge pinned to the avatar. Desktop: a full
              hover overlay. One button, two presentations. Shown only when
              signed in — visitors browse the public showcase read-only. */}
          {authed && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Change profile picture"
              aria-label="Change profile picture"
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-sky-500 border-4 border-gray-800 flex items-center justify-center text-white shadow-lg transition hover:bg-sky-400 md:w-full md:h-full md:border-0 md:rounded-full md:bg-gray-900/70 md:hover:bg-gray-900/60 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 disabled:cursor-wait"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 md:w-7 md:h-7 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 md:w-7 md:h-7" />
              )}
              <span className="hidden md:block text-xs font-medium mt-1">
                {uploading ? "Uploading…" : "Change photo"}
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleChange}
          />
        </motion.div>
        {error && (
          <p className="text-sm text-red-400 text-center max-w-48" role="alert">
            {error}
          </p>
        )}
      </div>

      <motion.div
        className="text-center md:text-left max-w-md w-full flex flex-col gap-4"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {editing ? (
          <div className="flex flex-col gap-3 text-left">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">Greeting</span>
              <input
                type="text"
                value={draft.greeting}
                onChange={(event) => patchDraft({ greeting: event.target.value })}
                onKeyDown={draftKeys}
                autoFocus
                placeholder="Hi, I'm …"
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">Title</span>
              <input
                type="text"
                value={draft.title}
                onChange={(event) => patchDraft({ title: event.target.value })}
                onKeyDown={draftKeys}
                placeholder="Frontend Developer | React Enthusiast"
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">Intro</span>
              <textarea
                value={draft.bioText}
                onChange={(event) => patchDraft({ bioText: event.target.value })}
                onKeyDown={draftKeys}
                rows={4}
                placeholder="Write your intro — **like this** to highlight words."
                className={`${fieldClass} resize-none`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">Skill badges</span>
              <input
                type="text"
                value={draft.skillsText}
                onChange={(event) => patchDraft({ skillsText: event.target.value })}
                onKeyDown={draftKeys}
                placeholder="React, Tailwind CSS, …"
                className={fieldClass}
              />
            </label>
            {cvMode && (
              <>
                <span className="-mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Personal information
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CONTACT_FIELDS.map(({ field, label, placeholder }) => (
                    <label key={field} className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-400">{label}</span>
                      <input
                        type="text"
                        value={draft.contact[field]}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, [field]: event.target.value },
                          }))
                        }
                        onKeyDown={draftKeys}
                        placeholder={placeholder}
                        className={fieldClass}
                      />
                    </label>
                  ))}
                </div>
              </>
            )}
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
          <>
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {hero.greeting}
            </motion.h1>

            <motion.h2
              className="text-xl sm:text-2xl md:text-2xl text-sky-300 font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              {hero.title}
            </motion.h2>

            {/* Personal information — the CV header's contact strip: city,
                phone, email, one optional link, only the filled parts. */}
            {cvMode &&
              [
                hero.contact?.location,
                hero.contact?.phone,
                hero.contact?.email,
                hero.contact?.link,
              ].some(Boolean) && (
                <motion.p
                  className="flex flex-wrap justify-center gap-x-2 text-sm text-gray-400 md:justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  {[
                    hero.contact.location,
                    hero.contact.phone,
                    hero.contact.email,
                    hero.contact.link,
                  ]
                    .filter(Boolean)
                    .map((part, index, all) => (
                      <span key={part}>
                        {part}
                        {index < all.length - 1 && (
                          <span className="text-gray-600"> · </span>
                        )}
                      </span>
                    ))}
                </motion.p>
              )}

            <motion.p
              className="text-base sm:text-lg text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <AccentText
                text={hero.bio.text}
                accentClass={hero.bio.accentClass}
              />
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1, delayChildren: 1 }}
            >
              {hero.skills.map((skill, index) => (
                <motion.span
                  key={index}
                  className={`${skill.color} text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                >
                  {skill.name}
                </motion.span>
              ))}
            </motion.div>
          </>
        )}
      </motion.div>
      </div>

      {/* CV mode: the document body — every section of the active CV on one
          page, grouped by its "Show on" page (the old sub-pages): intro
          under the hero, then About, Skills, Projects and Contact. Each
          group only shows when it has sections. Downloading lives on the
          My CV shelf. */}
      {isCvPath &&
        CV_PAGES.map((page) => (
          <CvDocument
            key={page.key}
            sections={activeCv?.sections?.filter(
              (section) => section.page === page.key
            )}
            header={
              page.key === "intro" ? null : (
                <h2 className="text-xl font-bold text-white">{page.label}</h2>
              )
            }
            edit={sectionEdit}
          />
        ))}

      {/* The shared template gallery — a pick seeds a fresh CV (owners) or
          walks the visitor to sign-in. Backdrop click or Esc closes. */}
      <TemplateGallery
        open={templateOpen}
        busy={templateBusy}
        error={templateError}
        onPick={handlePickTemplate}
        onClose={() => setTemplateOpen(false)}
      />
    </div>
  );
};

export default Hero;
