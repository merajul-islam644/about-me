import { useEffect, useRef, useState } from "react";
import { motion, Reorder, useReducedMotion } from "framer-motion";
import { Check, Hand, MoveVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { cvDesignTokens, parseCvDesign } from "./cvDesign";

// Fresh ids for items added while a section is being edited inline.
const newItemId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `cvi-${Math.random().toString(16).slice(2)}`;

// Column labels for the entry "table" layout — Education gets its own set,
// any other entry section falls back to the generic trio.
const tableHeaders = (section) =>
  /education/i.test(section.title || "")
    ? ["Qualification", "Institution", "Years"]
    : ["Title", "Organization", "Period"];

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

      {section.type === "entry" && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500">Rows as:</span>
          {[
            { key: "cards", label: "Cards" },
            { key: "grid", label: "Table" },
          ].map((option) => {
            const active =
              option.key === "grid"
                ? section.layout === "grid"
                : section.layout !== "grid";
            return (
              <button
                key={option.key}
                type="button"
                onClick={() =>
                  onChange({ ...section, layout: option.key === "grid" ? "grid" : "cards" })
                }
                aria-pressed={active}
                className={
                  active
                    ? "cursor-pointer rounded-full bg-sky-500 px-2.5 py-1 text-xs font-semibold text-white"
                    : "cursor-pointer rounded-full border border-gray-400/40 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-sky-400 hover:text-sky-500"
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

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
      <h3 className={t.entryHeading}>{item.heading}</h3>
      {item.period && (
        <span className={t.entryPeriod}>{item.period}</span>
      )}
    </div>
    {item.sub && <p className={t.entrySub}>{item.sub}</p>}
    {item.details && <p className={t.entryDetails}>{item.details}</p>}
  </article>
);

// One section card. When the design lets sections drag-reorder, the whole
// card is the drag surface — hold it anywhere and pull. The card being
// edited keeps its Reorder.Item slot (so the group still animates around
// it) but its own drag is switched off, leaving the form fields free.
// The headline marker renders the caller's headline node instead of
// title+items; its pencil opens the caller's headline editor and its drag
// freezes while that editor is open (the form has its own Save/Cancel).
const SectionCard = ({
  section,
  editingThis,
  edit,
  t,
  reorderable,
  commitDrag,
  headline,
  demoChip = false,
  inviteChip = false,
  onUserDragStart,
}) => {
  // The trash needs a confirm: the first click arms it (it turns red), the
  // second deletes, and moving the pointer away disarms it again.
  const [confirming, setConfirming] = useState(false);
  const isHeadline = section.type === "headline";
  const frozen = editingThis || (isHeadline && edit?.headlineEditing);
  const inner = (
    <>
      {/* The teaching chip: rides on the card while the scripted demo moves
          it, so the animation reads as "this card is draggable", not as a
          glitch. The invite chip then takes the same corner — a bouncing
          arrow that stays until the visitor actually tries a drag. */}
      {demoChip && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5, y: 6 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: [0, -2, 2, -2, 2, 0],
            rotate: [0, -1.5, 1.5, -1.5, 1.5, 0],
          }}
          transition={{
            opacity: { type: "spring", stiffness: 400, damping: 22 },
            scale: { type: "spring", stiffness: 400, damping: 22 },
            y: { type: "spring", stiffness: 400, damping: 22 },
            x: { duration: 0.5, repeat: Infinity, repeatDelay: 1.4 },
            rotate: { duration: 0.5, repeat: Infinity, repeatDelay: 1.4 },
          }}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-sky-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-sky-500/30"
        >
          <Hand className="h-3 w-3" /> Drag
        </motion.span>
      )}
      {inviteChip && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5, y: 6 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: [0, -2, 2, -2, 2, 0],
            rotate: [0, -1.5, 1.5, -1.5, 1.5, 0],
          }}
          transition={{
            opacity: { type: "spring", stiffness: 400, damping: 22 },
            scale: { type: "spring", stiffness: 400, damping: 22 },
            y: { type: "spring", stiffness: 400, damping: 22 },
            x: { duration: 0.5, repeat: Infinity, repeatDelay: 1.4 },
            rotate: { duration: 0.5, repeat: Infinity, repeatDelay: 1.4 },
          }}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-sky-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-sky-500/30"
        >
          <motion.span
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex"
          >
            <MoveVertical className="h-3 w-3" />
          </motion.span>
          Try dragging
        </motion.span>
      )}
      {edit && !editingThis && !isHeadline && (
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
      {edit?.onHeadlineEdit && isHeadline && !edit.headlineEditing && (
        <button
          type="button"
          onClick={() => edit.onHeadlineEdit()}
          title="Edit the headline"
          aria-label="Edit the headline"
          className={t.editPencil}
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {/* The headline marker is the document's main section — it edits,
          but it never offers the trash. */}
      {edit?.onDelete && !isHeadline && !frozen && (
        <button
          type="button"
          onClick={() => (confirming ? edit.onDelete(section.id) : setConfirming(true))}
          onMouseLeave={() => setConfirming(false)}
          onBlur={() => setConfirming(false)}
          title={confirming ? "Click again to delete" : isHeadline ? "Hide the headline" : "Delete this section"}
          aria-label={
            confirming
              ? `Confirm delete ${section.title}`
              : isHeadline
                ? "Hide the headline"
                : `Delete ${section.title}`
          }
          className={`${t.editTrash} ${
            confirming ? "bg-red-500/20 text-red-400 opacity-100" : ""
          }`}
        >
          <Trash2 className="w-4 h-4" />
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
      ) : isHeadline ? (
        headline
      ) : (
        <>
          {/* Section titles are h2 — the headline card above is the page's
              h1, so the outline steps h1 → h2 → h3 with no skips. */}
          <h2 className={t.sectionTitle}>{section.title}</h2>
          <div className="mt-3 flex flex-col gap-3">
            {section.type === "entry" &&
              (section.layout === "grid" ? (
                <div className="overflow-x-auto">
                  <table className={t.tableEl}>
                    <thead>
                      <tr>
                        {tableHeaders(section).map((label) => (
                          <th key={label} scope="col" className={t.tableHeadCell}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item) => (
                        <tr key={item.id}>
                          <td className={t.tableCell}>
                            <h3 className={t.entryHeading}>{item.heading}</h3>
                            {item.details && (
                              <div className="mt-1">
                                <p className={t.entryDetailsFlat}>{item.details}</p>
                              </div>
                            )}
                          </td>
                          <td className={t.tableCell}>{item.sub}</td>
                          <td className={t.tableCell}>{item.period}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                section.items.map((item) => (
                  <EntryItem key={item.id} item={item} t={t} />
                ))
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
    </>
  );
  if (!reorderable) {
    return <section className={`${t.sectionCard} group`}>{inner}</section>;
  }
  return (
    <Reorder.Item
      as="section"
      value={section}
      dragListener={!frozen}
      onDragStart={onUserDragStart}
      onDragEnd={commitDrag}
      whileDrag={{ scale: 1.01 }}
      className={
        frozen
          ? `${t.sectionCard} group`
          : `${t.sectionCard} group cursor-grab active:cursor-grabbing ${
              demoChip || inviteChip ? "ring-2 ring-sky-400/60" : ""
            }`
      }
    >
      {inner}
    </Reorder.Item>
  );
};

// The drag-reorderable document body. Owns the order mid-drag — rendering
// the cards FROM that array is what makes the neighbours step aside live
// while a card is pulled past them. The order survives the drop (so nothing
// snaps back while the save travels); the parent's key resets it whenever
// the stored order changes under it. With no owner editing (visitors), the
// commit is a no-op — the arrangement simply lives here until unmount.
const ReorderableDoc = ({ sections, edit, t, headline, demo = false }) => {
  const [dragOrder, setDragOrder] = useState(null);
  const [demoCardId, setDemoCardId] = useState(null);
  // After the scripted pass settles, the arrow chip keeps pointing at the
  // card until the visitor's own first drag retires it.
  const [inviteCardId, setInviteCardId] = useState(null);
  const liveOrder = dragOrder ?? sections;
  const commitDrag = () => {
    const moved =
      liveOrder.length !== sections.length ||
      liveOrder.some((section, index) => section.id !== sections[index]?.id);
    if (moved) edit?.onReorder?.(liveOrder);
  };

  // The one-time teaching pass: shortly after load, the first real card
  // drops a slot and settles back — the mechanic demonstrated by itself,
  // with a tiny "Drag" chip riding the moving card. Visitors only, skipped
  // under reduced motion, and any real grab kills it mid-flight.
  const timersRef = useRef([]);
  const sectionsRef = useRef(sections);
  const reducedMotion = useReducedMotion();
  // Keep the latest list reachable for the demo timer without making the
  // timer depend on a prop whose identity changes every parent render.
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);
  useEffect(() => {
    if (!demo || reducedMotion) return undefined;
    let cancelled = false;
    const start = setTimeout(() => {
      if (cancelled) return;
      const list = sectionsRef.current;
      // Skip the headline marker — the demo moves a content card, the one
      // the visitor would actually grab.
      const at = list[0]?.type === "headline" ? 1 : 0;
      const card = list[at];
      const next = list[at + 1];
      if (!card || !next) return;
      setDemoCardId(card.id);
      setDragOrder([...list.slice(0, at), next, card, ...list.slice(at + 2)]);
      timersRef.current.push(setTimeout(() => setDragOrder(null), 1000));
      timersRef.current.push(
        setTimeout(() => {
          setDemoCardId(null);
          setInviteCardId(card.id);
        }, 1300)
      );
    }, 1400);
    timersRef.current.push(start);
    return () => {
      cancelled = true;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [demo, reducedMotion]);
  const cancelDemo = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setDragOrder(null);
    setDemoCardId(null);
    setInviteCardId(null);
  };
  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={liveOrder}
      onReorder={setDragOrder}
      className="flex flex-col gap-5"
    >
      {liveOrder.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          editingThis={edit != null && edit.activeId === section.id}
          edit={edit}
          t={t}
          reorderable={true}
          commitDrag={commitDrag}
          headline={headline}
          demoChip={demoCardId === section.id}
          inviteChip={inviteCardId === section.id}
          onUserDragStart={cancelDemo}
        />
      ))}
    </Reorder.Group>
  );
};

// The CV document body — renders under the hero on /cv. Generic on purpose:
// every profession's sections flow through the same three shapes (entry /
// list / text), and the section title carries the profession's own wording.
// Colors and card shapes come from the CV's design (`classic` / `paper` /
// `sidebar`) through the token map in cvDesign.js.
//
// `edit` turns on the owner's inline editing: a pencil on every card, and
// while one is active its card renders the SectionEditor fed by the caller's
// draft. It also enables drag-reordering — hold any card and pull it to a
// new spot; `edit.onReorder(newSections)` fires once per completed drag.
// Absent (visitors, the previews), the document is read-only.
//
// `headline` is the React node the headline marker section renders — the
// greeting/title/contact/bio/skills block the caller owns. Without it
// (previews), headline markers never render; hidden sections never render.
export const CvDocument = ({
  sections,
  header = null,
  edit = null,
  design = "classic",
  headline = null,
  headlineHidden = false,
  visitorDrag = false,
  demo = false,
}) => {
  const t = cvDesignTokens(design);
  // Drag-reorder lives where sections stack in one visible column — the
  // grid and columns arrangements read in two dimensions, so their cards
  // stay put. Owners reorder for real (edit carries the save); visitors
  // drag too, but their arrangement lives only in this render — nothing
  // saves, and a refresh hands every card back its stored spot.
  const reorderable =
    (edit != null || visitorDrag) &&
    !["grid", "columns"].includes(parseCvDesign(design).doc);
  const list = (sections ?? []).filter(
    (section) =>
      !section.hidden && (section.type !== "headline" || headline != null)
  );
  if (!list.length && !(edit?.onHeadlineAdd && headlineHidden)) return null;

  // The restore door for a hidden headline — owner-only. "Add section"
  // lives in the caller's action bar above the document now, so this row
  // only renders when it actually has a job. Reuses the editor's
  // dashed-pill styling, which carries the design's own dark/light tokens.
  const addRow =
    edit?.onHeadlineAdd && headlineHidden ? (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => edit.onHeadlineAdd()}
          className={t.editorAddItem}
        >
          <Plus className="h-3.5 w-3.5" /> Add headline
        </button>
      </div>
    ) : null;

  if (!reorderable) {
    return (
      <div className={t.docWrap}>
        {header}
        {addRow}
        {list.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            editingThis={edit != null && edit.activeId === section.id}
            edit={edit}
            t={t}
            reorderable={false}
            headline={headline}
          />
        ))}
      </div>
    );
  }
  return (
    <div className={t.docWrap}>
      {header}
      {addRow}
      {/* Keyed by the STORED order — when a save (or another CV) changes it,
          the doc remounts and any leftover mid-drag state dies with it. The
          group carries the card gap itself so spacing matches the plain
          document exactly. */}
      <ReorderableDoc
        key={list.map((section) => section.id).join("|")}
        sections={list}
        edit={edit}
        t={t}
        headline={headline}
        demo={demo && edit == null}
      />
    </div>
  );
};

export default CvDocument;
