import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  Hammer,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { usePortfolio } from "../portfolio/portfolio-context";
import { useAuth } from "../auth/auth-context";
import { useProfilePicture } from "../portfolio/useProfilePicture";
import visitorAvatar from "../assets/visitor-avatar.jpg";
import {
  CV_PAGES,
  CV_PRESETS,
  getActiveCv,
  normalizeContent,
  normalizeCv,
  SKILL_COLOR_OPTIONS,
} from "../content/portfolioShape";
import { AccentText } from "../content/AccentText";
import { SelectField, TextAreaField, TextField } from "./edit/fields";
import { ModeTabs } from "./ModeTabs";
import { CvDocument } from "./cv/CvDocument";
import { DownloadCvButton } from "./cv/DownloadCvButton";

const newId = (prefix) =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Math.random().toString(16).slice(2)}`;

const TYPE_OPTIONS = [
  { value: "entry", label: "Entries — experience, education, projects…" },
  { value: "list", label: "List — skills, languages, activities…" },
  { value: "text", label: "Paragraphs — summary, notes…" },
];

const FALLBACK_TITLE = { entry: "Details", list: "List", text: "Notes" };
const TYPE_LABELS = { entry: "Entries", list: "List", text: "Paragraphs" };

// The editor's two faces: the forms, and a live document preview of the
// draft. Icons live here so the toggle can map over both at once.
const VIEWS = [
  { key: "build", label: "Build", icon: Hammer },
  { key: "preview", label: "Preview", icon: Eye },
];

const SKILL_COLOR_NAMES = ["Yellow", "Indigo", "Green", "Sky", "Pink"];
const SKILL_COLOR_CHOICES = SKILL_COLOR_OPTIONS.map((value, index) => ({
  value,
  label: SKILL_COLOR_NAMES[index] ?? value,
}));

// The hero words of the CV view — profession-specific title, summary and
// the skill chips under them.
const HeadlineCard = ({ cv, onChange }) => (
  <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gray-800 p-5 shadow-xl">
    <header className="flex items-center justify-between gap-2">
      <h3 className="text-lg font-bold text-white">CV headline</h3>
      <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300">
        Top of the CV tab
      </span>
    </header>
    <div className="grid gap-3 md:grid-cols-2">
      <TextField
        label="Headline text"
        value={cv.greeting}
        onChange={(value) => onChange({ ...cv, greeting: value })}
        placeholder="Curriculum Vitae"
      />
      <TextField
        label="Professional title"
        value={cv.title}
        onChange={(value) => onChange({ ...cv, title: value })}
        placeholder="General Physician | MBBS, FCPS"
      />
    </div>
    <TextAreaField
      label="Professional summary"
      rows={3}
      value={cv.bio?.text ?? ""}
      onChange={(value) => onChange({ ...cv, bio: { ...cv.bio, text: value } })}
    />
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-300">Skill chips</span>
      {cv.skills.map((skill, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={skill.name}
            onChange={(event) =>
              onChange({
                ...cv,
                skills: cv.skills.map((s, i) =>
                  i === index ? { ...s, name: event.target.value } : s
                ),
              })
            }
            placeholder="Skill name"
            aria-label="Skill name"
            className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-sky-400 focus:outline-none"
          />
          <select
            value={skill.color}
            onChange={(event) =>
              onChange({
                ...cv,
                skills: cv.skills.map((s, i) =>
                  i === index ? { ...s, color: event.target.value } : s
                ),
              })
            }
            aria-label="Skill chip color"
            className="shrink-0 cursor-pointer rounded-lg border border-white/10 bg-gray-900 px-2 py-2 text-sm text-gray-200 focus:border-sky-400 focus:outline-none"
          >
            {SKILL_COLOR_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...cv,
                skills: cv.skills.filter((_, i) => i !== index),
              })
            }
            title="Remove skill"
            aria-label="Remove skill"
            className="shrink-0 cursor-pointer rounded-lg border border-white/10 p-2 text-red-400 transition-colors hover:bg-white/5"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...cv,
            skills: [
              ...cv.skills,
              { name: "", color: SKILL_COLOR_OPTIONS[0] },
            ],
          })
        }
        className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-dashed border-white/20 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
      >
        <Plus className="h-3.5 w-3.5" /> Add skill chip
      </button>
    </div>
  </section>
);

// Section shape presets are seeded fresh on pick: new ids, empty items.
const seedSections = (preset) =>
  preset.sections.map((section) => ({
    ...section,
    id: newId("cvs"),
    items: [],
  }));

const EntryItemForm = ({ item, onChange, onRemove }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-gray-900/60 p-4">
    <div className="grid gap-3 md:grid-cols-2">
      <TextField
        label="Role / Degree / Title"
        value={item.heading}
        onChange={(value) => onChange({ ...item, heading: value })}
        placeholder="Software Engineering Intern"
      />
      <TextField
        label="Organization / Place"
        value={item.sub}
        onChange={(value) => onChange({ ...item, sub: value })}
        placeholder="Company, hospital, school…"
      />
    </div>
    <TextField
      label="Period"
      value={item.period}
      onChange={(value) => onChange({ ...item, period: value })}
      placeholder="2024 — Present"
    />
    <TextAreaField
      label="Details"
      rows={3}
      value={item.details}
      onChange={(value) => onChange({ ...item, details: value })}
      placeholder="What you did, tools used, results…"
    />
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-lg px-2 py-1 text-xs text-red-400 transition-colors hover:bg-white/5"
    >
      <Trash2 className="h-3.5 w-3.5" /> Remove entry
    </button>
  </div>
);

const SectionCard = ({ section, index, total, onChange, onMove, onRemove }) => {
  const setItems = (items) => onChange({ ...section, items });

  const updateItem = (itemId, next) =>
    setItems(section.items.map((item) => (item.id === itemId ? next : item)));

  const removeItem = (itemId) =>
    setItems(section.items.filter((item) => item.id !== itemId));

  const addItem = () => {
    if (section.type === "entry") {
      setItems([
        ...section.items,
        { id: newId("cvi"), heading: "", sub: "", period: "", details: "" },
      ]);
    } else {
      setItems([...section.items, { id: newId("cvi"), text: "" }]);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gray-800 p-5 shadow-xl">
      <header className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={section.title}
          onChange={(event) => onChange({ ...section, title: event.target.value })}
          aria-label="Section title"
          className="min-w-40 flex-1 rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-sm font-semibold text-gray-100 focus:border-sky-400 focus:outline-none"
        />
        <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300">
          {TYPE_LABELS[section.type] ?? section.type}
        </span>
        <button
          type="button"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          title="Move section up"
          aria-label="Move section up"
          className="cursor-pointer rounded-lg border border-white/10 p-1.5 text-gray-400 transition-colors hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
          title="Move section down"
          aria-label="Move section down"
          className="cursor-pointer rounded-lg border border-white/10 p-1.5 text-gray-400 transition-colors hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Remove section"
          aria-label="Remove section"
          className="cursor-pointer rounded-lg border border-white/10 p-1.5 text-red-400 transition-colors hover:bg-white/5"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      {/* Which CV page this section appears on — the CV navbar menus open
          these pages, mirroring the portfolio's menu. */}
      <div className="max-w-60">
        <SelectField
          label="Show on CV page"
          value={section.page ?? "intro"}
          onChange={(value) => onChange({ ...section, page: value })}
          options={CV_PAGES.map((page) => ({
            value: page.key,
            label: page.label,
          }))}
        />
      </div>

      {section.type === "entry" && (
        <div className="flex flex-col gap-3">
          {section.items.map((item) => (
            <EntryItemForm
              key={item.id}
              item={item}
              onChange={(next) => updateItem(item.id, next)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
          <button
            type="button"
            onClick={addItem}
            className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-dashed border-white/20 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
          >
            <Plus className="h-3.5 w-3.5" /> Add entry
          </button>
        </div>
      )}

      {section.type === "list" && (
        <div className="flex flex-col gap-2">
          {section.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="text"
                value={item.text}
                onChange={(event) =>
                  updateItem(item.id, { ...item, text: event.target.value })
                }
                placeholder="e.g. Bengali — Native"
                className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-sky-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                title="Remove item"
                aria-label="Remove item"
                className="shrink-0 cursor-pointer rounded-lg border border-white/10 p-2 text-red-400 transition-colors hover:bg-white/5"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-dashed border-white/20 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
        </div>
      )}

      {section.type === "text" && (
        <div className="flex flex-col gap-3">
          {section.items.map((item) => (
            <div key={item.id} className="flex flex-col gap-1.5">
              <TextAreaField
                label="Paragraph"
                rows={3}
                value={item.text}
                onChange={(value) => updateItem(item.id, { ...item, text: value })}
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-lg px-2 py-1 text-xs text-red-400 transition-colors hover:bg-white/5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove paragraph
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-dashed border-white/20 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
          >
            <Plus className="h-3.5 w-3.5" /> Add paragraph
          </button>
        </div>
      )}
    </section>
  );
};

// The CV editor ("Edit CV" destination): builds the ACTIVE CV — the one the
// public CV tab shows. The CV list itself (switch, rename, create, delete)
// lives on the My CV shelf (/cv/library). Sections are profession-agnostic:
// start from a preset, then add, remove, rename or reorder anything — the
// /cv view renders whatever this produces.
export const CvPage = () => {
  const { content, saving, save } = usePortfolio();
  const { profile } = useAuth();
  // Same picture the Hero and About pages show — the uploaded one, or the
  // bundled avatar until this user uploads their own.
  const { url: pictureUrl } = useProfilePicture(profile?.userId);
  const picture = pictureUrl ?? visitorAvatar;
  const [draft, setDraft] = useState(getActiveCv(content));
  const [saveState, setSaveState] = useState(null); // null | "saved" | error message
  const [pickerDismissed, setPickerDismissed] = useState(false);
  const [newType, setNewType] = useState("entry");
  const [newTitle, setNewTitle] = useState("");
  const [view, setView] = useState("build"); // "build" | "preview"

  if (!draft) return null;

  const sections = draft.sections ?? [];

  const moveSection = (from, to) =>
    setDraft((current) => {
      const next = [...current.sections];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...current, sections: next };
    });

  const addSection = () => {
    const title = newTitle.trim() || FALLBACK_TITLE[newType];
    setDraft((current) => ({
      ...current,
      sections: [
        ...current.sections,
        { id: newId("cvs"), type: newType, page: "intro", title, items: [] },
      ],
    }));
    setNewTitle("");
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(getActiveCv(content));

  const handleSave = async () => {
    setSaveState(null);
    try {
      // Write the draft back into its slot in the owner's CV list — the
      // normalize pass re-mirrors it into `cv` for legacy readers.
      const savedCv = {
        ...normalizeCv(draft, content.cv),
        id: draft.id,
        name: draft.name?.trim() || "My CV",
      };
      const nextCvs = (content.cvs ?? [savedCv]).map((cv) =>
        cv.id === savedCv.id ? savedCv : cv
      );
      await save(normalizeContent({ ...content, cvs: nextCvs }, content));
      // Adopt the saved shape as the draft: normalizeCv fills in keys the
      // forms leave off (e.g. `page: "intro"` on preset-seeded sections), and
      // the dirty check stringifies the draft against the saved CV — without
      // this a just-saved preset CV still reads as unsaved.
      setDraft(savedCv);
      setSaveState("saved");
      setTimeout(() => setSaveState(null), 2500);
    } catch (error) {
      setSaveState(error?.message || "Saving failed.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-900 flex flex-col">
      <div className="flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 px-4 py-8 md:px-6 pb-32">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-sky-400">
              Edit CV
            </h2>
            <p className="mt-2 text-sm md:text-base text-gray-400">
              Shape every section of this CV. Switch, rename, create or delete
              CVs from the My CV page.
            </p>
          </div>
          {/* Build | Preview, and the document action beside them — the
              download here exports the DRAFT, matching the preview. */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-gray-800 p-1">
              {VIEWS.map((viewOption) => {
                const Icon = viewOption.icon;
                const active = view === viewOption.key;
                return (
                  <button
                    key={viewOption.key}
                    type="button"
                    onClick={() => setView(viewOption.key)}
                    aria-current={active ? "true" : undefined}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-sky-500 text-white"
                        : "text-gray-300 hover:text-sky-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {viewOption.label}
                  </button>
                );
              })}
            </div>
            <DownloadCvButton draftCv={draft} />
          </div>
        </header>

        {view === "preview" ? (
          <section className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-gray-900/60 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">CV preview</h3>
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300">
                Live draft — unsaved edits included
              </span>
            </div>

            {/* Headline — what the CV tab's hero shows, photo included:
                a CV without a face is a form without a signature. */}
            <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-gray-800 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
                  {draft.greeting}
                </p>
                <p className="mt-1 text-xl font-bold text-white">{draft.title}</p>
                {draft.bio?.text && (
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">
                    <AccentText
                      text={draft.bio.text}
                      accentClass={draft.bio.accentClass ?? "text-sky-400 font-medium"}
                    />
                  </p>
                )}
                {draft.skills.some((skill) => skill.name.trim()) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {draft.skills
                      .filter((skill) => skill.name.trim())
                      .map((skill, index) => (
                        <span
                          key={index}
                          className={`${skill.color} rounded-full px-3 py-1 text-xs font-medium text-white`}
                        >
                          {skill.name}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              <img
                src={picture}
                alt={content?.brand || "Profile"}
                className="h-24 w-24 shrink-0 rounded-xl border-2 border-sky-500/60 object-cover md:h-28 md:w-28"
              />
            </div>

            {/* Sections grouped by their assigned CV page, in draft order. */}
            {CV_PAGES.map((page) => {
              const pageSections = sections.filter(
                (section) => (section.page ?? "intro") === page.key
              );
              if (pageSections.length === 0) return null;
              return (
                <div key={page.key} className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    {page.label} page
                  </p>
                  <CvDocument sections={pageSections} />
                </div>
              );
            })}
          </section>
        ) : (
          <>
            <HeadlineCard cv={draft} onChange={(next) => setDraft(next)} />

        {sections.length === 0 && !pickerDismissed ? (
          <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gray-800 p-5 md:p-8 shadow-xl">
            <div>
              <h3 className="text-lg font-bold text-white">
                Start from your profession
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Picks the sections that profession's CV actually needs — you can
                rename, reorder, add or remove everything afterwards.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CV_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, sections: seedSections(preset) })
                  }
                  className="flex cursor-pointer flex-col items-start gap-2 rounded-xl border border-white/10 bg-gray-900/60 p-4 text-left transition-colors hover:border-sky-400/50"
                >
                  <span className="text-sm font-semibold text-sky-300">
                    {preset.label}
                  </span>
                  <span className="text-xs leading-relaxed text-gray-400">
                    {preset.sections.map((s) => s.title).join(" · ")}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPickerDismissed(true)}
              className="self-start text-sm font-medium text-gray-400 underline-offset-4 transition-colors hover:text-sky-300 hover:underline"
            >
              Start from a blank CV instead
            </button>
          </section>
        ) : (
          <>
            <div className="flex flex-col gap-5">
              {sections.map((section, index) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  index={index}
                  total={sections.length}
                  onChange={(next) =>
                    setDraft((current) => ({
                      ...current,
                      sections: current.sections.map((s) =>
                        s.id === section.id ? next : s
                      ),
                    }))
                  }
                  onMove={moveSection}
                  onRemove={() =>
                    setDraft((current) => ({
                      ...current,
                      sections: current.sections.filter(
                        (s) => s.id !== section.id
                      ),
                    }))
                  }
                />
              ))}
              {sections.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-gray-400">
                  Your CV has no sections yet — add the first one below.
                </p>
              )}
            </div>

            <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-gray-800 p-5 shadow-xl">
              <div className="min-w-45 flex-1">
                <SelectField
                  label="New section type"
                  value={newType}
                  onChange={setNewType}
                  options={TYPE_OPTIONS}
                />
              </div>
              <div className="min-w-45 flex-1">
                <TextField
                  label="Section title"
                  value={newTitle}
                  onChange={setNewTitle}
                  placeholder={
                    newTitle.trim()
                      ? newTitle
                      : "e.g. Publications, Awards, Volunteer Work…"
                  }
                />
              </div>
              <button
                type="button"
                onClick={addSection}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400"
              >
                <Plus className="h-4 w-4" /> Add section
              </button>
            </section>
          </>
        )}
          </>
        )}
      </div>

      {/* Sticky save bar — same pattern as the portfolio editor. */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-gray-800/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 md:px-10">
          <span className="flex-1 text-sm text-gray-400">
            {saveState === "saved" ? (
              <span className="inline-flex items-center gap-1.5 text-green-400">
                <Check className="h-4 w-4" /> Saved
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
                setDraft(getActiveCv(content));
                setSaveState(null);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-sky-400/40 hover:text-sky-300"
            >
              <RotateCcw className="h-4 w-4" /> Discard
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CvPage;
