import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { cvDesignTokens } from "./cvDesign";

// Fresh ids for items added while a section is being edited inline.
const newItemId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `cvi-${Math.random().toString(16).slice(2)}`;

// The inline editor that takes over a section card's body on /cv — the same
// pencil pattern as the other pages: the title and every item become plain
// fields, Save writes the section back through the caller. Colors come from
// the design's token map, so the editor stays readable on light designs too.
const SectionEditor = ({ section, onChange, onSave, onCancel, error, t }) => {
  const setItems = (items) => onChange({ ...section, items });

  const updateItem = (itemId, next) =>
    setItems(section.items.map((item) => (item.id === itemId ? next : item)));

  const removeItem = (itemId) =>
    setItems(section.items.filter((item) => item.id !== itemId));

  const addItem = () =>
    section.type === "entry"
      ? setItems([
          ...section.items,
          { id: newItemId(), heading: "", sub: "", period: "", details: "" },
        ])
      : setItems([...section.items, { id: newItemId(), text: "" }]);

  const draftKeys = (event) => {
    if (event.key === "Escape") onCancel();
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onSave();
    }
  };

  return (
    <div className="flex flex-col gap-3 text-left" onKeyDown={draftKeys}>
      <input
        type="text"
        value={section.title}
        onChange={(event) => onChange({ ...section, title: event.target.value })}
        placeholder="Section title"
        aria-label="Section title"
        autoFocus
        className={`${t.editorField} font-semibold`}
      />

      {section.type === "entry" &&
        section.items.map((item) => (
          <div
            key={item.id}
            className={t.editorEntryCard}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={item.heading}
                onChange={(event) =>
                  updateItem(item.id, { ...item, heading: event.target.value })
                }
                placeholder="Role / Degree / Title"
                aria-label="Role or title"
                className={t.editorField}
              />
              <input
                type="text"
                value={item.sub}
                onChange={(event) =>
                  updateItem(item.id, { ...item, sub: event.target.value })
                }
                placeholder="Organization / Place"
                aria-label="Organization or place"
                className={t.editorField}
              />
            </div>
            <input
              type="text"
              value={item.period}
              onChange={(event) =>
                updateItem(item.id, { ...item, period: event.target.value })
              }
              placeholder="2024 — Present"
              aria-label="Period"
              className={t.editorField}
            />
            <textarea
              rows={3}
              value={item.details}
              onChange={(event) =>
                updateItem(item.id, { ...item, details: event.target.value })
              }
              placeholder="What you did, tools used, results…"
              aria-label="Details"
              className={`${t.editorField} resize-none leading-relaxed`}
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className={t.editorRemovePlain}
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove entry
            </button>
          </div>
        ))}

      {section.type === "list" &&
        section.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="text"
              value={item.text}
              onChange={(event) =>
                updateItem(item.id, { ...item, text: event.target.value })
              }
              placeholder="e.g. Bengali — Native"
              aria-label="Item"
              className={t.editorField}
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              title="Remove item"
              aria-label="Remove item"
              className={t.editorRemoveBoxed}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

      {section.type === "text" &&
        section.items.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <textarea
              rows={3}
              value={item.text}
              onChange={(event) =>
                updateItem(item.id, { ...item, text: event.target.value })
              }
              placeholder="Write…"
              aria-label="Paragraph"
              className={`${t.editorField} resize-none leading-relaxed`}
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              title="Remove paragraph"
              aria-label="Remove paragraph"
              className={t.editorRemoveBoxed}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

      <button
        type="button"
        onClick={addItem}
        className={t.editorAddItem}
      >
        <Plus className="h-3.5 w-3.5" />{" "}
        {section.type === "entry" ? "Add entry" : "Add item"}
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400"
        >
          <Check className="w-4 h-4" /> Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={t.editorCancel}
        >
          <X className="w-4 h-4" /> Cancel
        </button>
        <span className="text-xs text-gray-500">
          Ctrl+Enter saves · Esc cancels
        </span>
        {error && (
          <span className="text-xs text-red-400" role="alert">
            {error}
          </span>
        )}
      </div>
    </div>
  );
};

const EntryItem = ({ item, t }) => (
  <article className={t.entryCard}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h4 className={t.entryHeading}>{item.heading}</h4>
      {item.period && (
        <span className={t.entryPeriod}>{item.period}</span>
      )}
    </div>
    {item.sub && <p className={t.entrySub}>{item.sub}</p>}
    {item.details && <p className={t.entryDetails}>{item.details}</p>}
  </article>
);

// The CV document body — renders under the hero on /cv. Generic on purpose:
// every profession's sections flow through the same three shapes (entry /
// list / text), and the section title carries the profession's own wording.
// Colors and card shapes come from the CV's design (`classic` / `paper` /
// `sidebar`) through the token map in cvDesign.js.
//
// `edit` turns on the owner's inline editing: a pencil on every card, and
// while one is active its card renders the SectionEditor fed by the caller's
// draft. Absent (visitors, the previews), the document is read-only.
export const CvDocument = ({
  sections,
  header = null,
  edit = null,
  design = "classic",
}) => {
  const t = cvDesignTokens(design);
  if (!sections?.length) return null;
  return (
    <div className={t.docWrap}>
      {header}
      {sections.map((section) => {
        const editingThis = edit != null && edit.activeId === section.id;
        return (
          <section key={section.id} className={t.sectionCard}>
            {edit && !editingThis && (
              <button
                type="button"
                onClick={() => edit.onStart(section)}
                title="Edit this section"
                aria-label={`Edit ${section.title}`}
                className={t.editPencil}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {editingThis ? (
              <SectionEditor
                section={edit.draft}
                onChange={edit.onDraftChange}
                onSave={edit.onSave}
                onCancel={edit.onCancel}
                error={edit.error}
                t={t}
              />
            ) : (
              <>
                <h3 className={t.sectionTitle}>{section.title}</h3>
                <div className="mt-3 flex flex-col gap-3">
                  {section.type === "entry" &&
                    section.items.map((item) => (
                      <EntryItem key={item.id} item={item} t={t} />
                    ))}
                  {section.type === "list" && (
                    <ul className="flex flex-wrap gap-2">
                      {section.items.map((item) => (
                        <li key={item.id} className={t.listPill}>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.type === "text" &&
                    section.items.map((item) => (
                      <p key={item.id} className={t.bodyText}>
                        {item.text}
                      </p>
                    ))}
                  {section.items.length === 0 && (
                    <p className={t.emptyText}>Nothing here yet.</p>
                  )}
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default CvDocument;
