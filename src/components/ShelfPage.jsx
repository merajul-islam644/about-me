import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  FilePlus2,
  FolderPlus,
  Loader2,
  Pencil,
  PenLine,
  Trash2,
} from "lucide-react";
import { usePortfolio } from "../portfolio/portfolio-context";
import {
  blankPortfolioFields,
  defaultCvFor,
  getActiveCv,
  getActivePortfolio,
  normalizeContent,
  seedSections,
} from "../content/portfolioShape";
import { ModeTabs } from "./ModeTabs";
import { DownloadCvButton } from "./cv/DownloadCvButton";
import { TemplateGallery } from "./cv/TemplateGallery";

const newId = (prefix) =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Math.random().toString(16).slice(2)}`;

// The "New …" pill — used in the shelf header and in the empty state.
const NewButton = ({ busy, kind, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {busy ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : kind === "cv" ? (
      <FilePlus2 className="h-4 w-4" />
    ) : (
      <FolderPlus className="h-4 w-4" />
    )}
    {label}
  </button>
);

// Per-kind wiring for the two shelves — what the list is, how a fresh item
// is seeded, and where View/Edit take you. Everything else (cards, opening,
// deleting, the active badge) is shared.
const SHELF_KINDS = {
  portfolio: {
    title: "My portfolio",
    intro:
      "Every showcase you have built, saved in one place. Open one to view or edit it — the one marked Active is what visitors see.",
    emptyText: "Nothing saved yet — build your first portfolio.",
    newLabel: "New portfolio",
    lastGuard: "Your last portfolio cannot be deleted",
    viewTo: "/",
    editTo: "/edit",
    // Subtitle + count line on each card.
    subtitle: (item) => item.hero?.title,
    stats: (item) => {
      const projectCount = item.projects?.length ?? 0;
      const skillCount = item.skills?.length ?? 0;
      return `${projectCount} project${projectCount === 1 ? "" : "s"} · ${skillCount} skill${skillCount === 1 ? "" : "s"}`;
    },
    activeId: (content) => getActivePortfolio(content)?.id,
    list: (content) => content.portfolios ?? [],
    switchPatch: (id) => ({ activePortfolioId: id }),
    // A fresh portfolio starts from the neutral blanks — never a clone of an
    // existing one — and is opened straight in the editor.
    create: (content) => {
      const list = content.portfolios ?? [];
      const fresh = {
        id: newId("pf"),
        name: `Portfolio ${list.length + 1}`,
        ...blankPortfolioFields(),
      };
      return {
        patch: { portfolios: [...list, fresh], activePortfolioId: fresh.id },
        fresh,
        to: "/edit",
      };
    },
  },
  cv: {
    title: "My CV",
    intro:
      "Every CV you have built, saved in one place. View opens the whole CV — every section on one page, editable right there with its pencil icons.",
    emptyText: "No CV here yet — build your first one and it shows up as a card.",
    newLabel: "New CV",
    // CVs may be emptied out entirely — the shelf then shows its empty
    // state. Portfolios always keep one (the public pages need something
    // to show).
    canDeleteLast: true,
    viewTo: "/cv",
    // No separate editor anymore — /cv itself is editable, so the cards
    // carry no Edit button.
    subtitle: (item) => item.title,
    stats: (item) => {
      const sectionCount = item.sections?.length ?? 0;
      const skillCount = (item.skills ?? []).filter((skill) =>
        skill.name.trim()
      ).length;
      return `${sectionCount} section${sectionCount === 1 ? "" : "s"} · ${skillCount} skill chip${skillCount === 1 ? "" : "s"}`;
    },
    activeId: (content) => getActiveCv(content)?.id,
    list: (content) => content.cvs ?? [],
    switchPatch: (id) => ({ activeCvId: id }),
    // A fresh CV is seeded from the active portfolio's hero — same personal
    // defaults as a first CV. A picked template seeds its sections through
    // the shared seedSections (fresh ids, starter items included); blank
    // starts with none.
    create: (content, preset = null) => {
      const list = content.cvs ?? [];
      const fresh = {
        id: newId("cv"),
        name: `CV ${list.length + 1}`,
        ...defaultCvFor({ hero: content.hero }),
        sections: preset ? seedSections(preset) : [],
      };
      return {
        patch: { cvs: [...list, fresh], activeCvId: fresh.id },
        fresh,
        to: "/cv",
      };
    },
  },
};

// One shelf page: every saved item of one kind, in a list. Opening an item
// (View or Edit) makes it the active one — the showcase the public pages
// show — then takes you to the document or its editor. Deleting asks first;
// the last item cannot go unless the kind opts in (CVs may be emptied to
// nothing, leaving the empty state).
export const ShelfPage = ({ kind }) => {
  const spec = SHELF_KINDS[kind] ?? SHELF_KINDS.portfolio;
  const { content, save } = usePortfolio();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // The CV shelf's New button opens the template gallery first; the
  // portfolio shelf creates straight away.
  const [templateOpen, setTemplateOpen] = useState(false);

  if (!content) return null;

  const items = spec.list(content);
  const currentActiveId = spec.activeId(content);
  const listKey = kind === "cv" ? "cvs" : "portfolios";
  const activeKey = kind === "cv" ? "activeCvId" : "activePortfolioId";

  const persist = async (patch) => {
    const next = normalizeContent({ ...content, ...patch }, content);
    await save(next);
    return next;
  };

  // View/Edit both "open" the item: it becomes the active one, then the
  // route takes you to the document or editor.
  const openItem = async (id, to) => {
    if (busy) return;
    setError(null);
    try {
      if (currentActiveId !== id) {
        await persist(spec.switchPatch(id));
      }
      navigate(to);
    } catch (openError) {
      setError(openError?.message || "That did not save — please try again.");
    }
  };

  const createItem = async (preset = null) => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const { patch, to } = spec.create(content, preset);
      await persist(patch);
      setTemplateOpen(false);
      navigate(to);
    } catch (createError) {
      setError(createError?.message || "Creating failed — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleNew = () => (kind === "cv" ? setTemplateOpen(true) : createItem());

  // Rename asks for the new name and saves it straight into the list —
  // cancelling the prompt changes nothing.
  const renameItem = async (item) => {
    const nextName = window.prompt("Rename", item.name ?? "");
    if (nextName === null) return; // cancelled
    const trimmed = nextName.trim();
    if (busy || !trimmed || trimmed === item.name) return;
    setError(null);
    setBusy(true);
    try {
      await persist({
        [listKey]: items.map((entry) =>
          entry.id === item.id ? { ...entry, name: trimmed } : entry
        ),
      });
    } catch (renameError) {
      setError(renameError?.message || "Renaming failed — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async (item) => {
    if (busy || (items.length <= 1 && !spec.canDeleteLast)) return; // the last item cannot go
    if (
      !window.confirm(
        `Delete “${item.name ?? "this"}”? This cannot be undone.`
      )
    ) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const remaining = items.filter((entry) => entry.id !== item.id);
      await persist({
        [listKey]: remaining,
        // Only deleting the active item moves the pick — removing any other
        // card must leave the owner's choice (what the public pages show)
        // exactly as it was.
        [activeKey]:
          item.id === currentActiveId ? remaining[0]?.id : currentActiveId,
      });
    } catch (deleteError) {
      setError(deleteError?.message || "Deleting failed — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const cardActionClass =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:border-sky-400/40 hover:text-sky-300";
  const deleteActionClass =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-gray-900 flex flex-col">
      {/* The way back — CV mode's menu is just this shelf, so the page
          carries its own back arrow (one step through history). */}
      {kind === "cv" && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          title="Go back"
          aria-label="Go back"
          className="absolute left-4 top-4 md:left-10 md:top-10 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div className="flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 px-4 py-8 md:px-6">
        <header>
          <h2 className="text-3xl md:text-4xl font-bold text-sky-400">
            {spec.title}
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-400">
            {spec.intro}
          </p>
        </header>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <section className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-white">{spec.title}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {/* The CV shelf keeps the PDF export (the retired Edit CV page
                was its old home): Download builds the active CV. */}
            {kind === "cv" && <DownloadCvButton />}
            <NewButton
              busy={busy}
              kind={kind}
              label={spec.newLabel}
              onClick={handleNew}
            />
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 -mt-3">
          {items.map((item) => {
            const isActive = item.id === currentActiveId;
            return (
              <article
                key={item.id}
                className={`flex flex-col gap-3 rounded-2xl border bg-gray-800 p-5 shadow-xl ${
                  isActive ? "border-sky-400/60" : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="min-w-0 truncate text-lg font-bold text-white">
                    {item.name || "Untitled"}
                  </h4>
                  {isActive && (
                    <span className="shrink-0 rounded-full bg-sky-500 px-2.5 py-1 text-xs font-semibold text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-sky-300">
                  {spec.subtitle(item)}
                </p>
                <p className="text-xs text-gray-500">{spec.stats(item)}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openItem(item.id, spec.viewTo)}
                    className={cardActionClass}
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  {spec.editTo && (
                    <button
                      type="button"
                      onClick={() => openItem(item.id, spec.editTo)}
                      className={cardActionClass}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => renameItem(item)}
                    className={cardActionClass}
                  >
                    <PenLine className="h-3.5 w-3.5" /> Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    disabled={
                      (items.length <= 1 && !spec.canDeleteLast) || busy
                    }
                    title={
                      items.length <= 1 && !spec.canDeleteLast
                        ? spec.lastGuard
                        : `Delete “${item.name ?? "this"}”`
                    }
                    className={deleteActionClass}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Empty shelf — nothing saved (or every CV deleted). */}
        {items.length === 0 && (
          <div className="-mt-3 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <p className="text-sm text-gray-400">{spec.emptyText}</p>
            <NewButton
              busy={busy}
              kind={kind}
              label={spec.newLabel}
              onClick={handleNew}
            />
          </div>
        )}
      </div>

      {/* New CV opens the shared template gallery first — a profession
          preset seeds the sections that profession needs (all editable
          afterwards); blank starts truly blank. */}
      <TemplateGallery
        open={templateOpen}
        busy={busy}
        error={error}
        onPick={createItem}
        onClose={() => setTemplateOpen(false)}
      />
    </div>
  );
};

// The two navbar destinations: one shelf for portfolios, one for CVs.
export const PortfolioShelf = () => <ShelfPage kind="portfolio" />;
export const CvShelf = () => <ShelfPage kind="cv" />;

export default ShelfPage;
