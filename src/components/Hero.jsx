import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Check, Download, Loader2, Palette, Pencil, Plus, Printer, X } from "lucide-react";
import visitorAvatar from "../assets/visitor-avatar.jpg";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";
import { pushNotification } from "../portfolio/notifications";
import { useProfilePicture } from "../portfolio/useProfilePicture";
import { toDataUrl } from "../portfolio/portfolio-export";
import { fetchGuestContent, readGuestToken } from "../lib/blocks/invites";
import { MERAJ_USER_ID } from "../content/merajPortfolio";
import { AccentText } from "../content/AccentText";
import {
  CV_PAGES,
  defaultCvFor,
  getActiveCv,
  getActivePortfolio,
  newId,
  normalizeContent,
  SKILL_COLOR_OPTIONS,
} from "../content/portfolioShape";
import { getMode } from "../modes";
import { ModeTabs } from "./ModeTabs";
import { CvDocument } from "./cv/CvDocument";
import { DesignGallery } from "./cv/DesignGallery";
import { DesignGuide } from "./cv/DesignGuide";
import {
  accentForDesign,
  clearVisitorDesign,
  CV_DESIGNS,
  cvDesignTokens,
  parseCvDesign,
  readVisitorDesign,
  resolveCvDesign,
  writeVisitorDesign,
} from "./cv/cvDesign";

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

const Hero = () => {
  const { content, save, guest, guestPicture } = usePortfolio();
  const { status, profile, canEdit } = useAuth();
  const authed = status === "authenticated";
  // Viewers browse the owner's site — the face on it is the owner's too,
  // and so are guest-link holders: the owner invited them to read the same
  // site, and their downloaded CV carries the same photo. Plain signed-out
  // visitors still get no lookup at all: they wear the bundled cartoon, and
  // that null is what stops their probe.
  const pictureUserId = !authed
    ? (guest ? MERAJ_USER_ID : null)
    : canEdit
      ? profile?.userId
      : MERAJ_USER_ID;
  // A guest's face arrives through the invite webhook (guestPicture), not a
  // storage lookup — signed-out guests have no session, so the hook's probe
  // would only 401. Null userId keeps the hook dormant for them.
  const { url, uploading, error, upload, pending: picPending } = useProfilePicture(
    guest ? null : pictureUserId,
    status !== "unauthenticated" && !profile,
  );
  const { pathname } = useLocation();

  // CV mode swaps the words, not the face: same layout and picture, but the
  // ACTIVE CV's hero fields (the owner picks which of their CVs is public)
  // instead of the portfolio's.
  const isCvPath = getMode(pathname).key === "cv";
  const activeCv = getActiveCv(content);
  const cvMode = isCvPath && Boolean(activeCv);
  const hero = cvMode ? activeCv : content?.hero;
  // The active CV's visual design — the whole /cv page (headline, document,
  // and the PDF through the stored field) renders in it. Portfolio pages
  // keep the dark showcase unconditionally. Visitors can't write the owner's
  // CV, so their pick rides on top as a per-device preference (localStorage):
  // the page and its PDF follow it, the stored design stays untouched, and
  // the saved design wins again on sign-in.
  const [visitorDesign, setVisitorDesign] = useState(readVisitorDesign);
  const storedDesign = cvMode ? resolveCvDesign(activeCv?.design) : "classic";
  // Visitors and viewer-only roles restyle per device; editors see the
  // stored design their pick would overwrite.
  const design = !canEdit && visitorDesign ? visitorDesign : storedDesign;
  const t = cvDesignTokens(design);
  // The design's dimensions: `header` picks the Hero's structural branch
  // (side/stack/slab/band/badge), `doc` lives inside CvDocument's tokens.
  const { header, doc } = parseCvDesign(design);
  const isBand = header === "band";

  // Everyone starts on the cartoon avatar — signed-in or visitor — until
  // this user uploads their own picture. Guests swap in the webhook's
  // presigned URL (empty until it answers, or when no picture exists).
  const picture = guest ? (guestPicture || visitorAvatar) : (url ?? visitorAvatar);
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

  // The viewer's CV download — busy flag and error line for their bar.
  const [cvBusy, setCvBusy] = useState(false);
  const [cvError, setCvError] = useState(null);

  // Per-section editing on the CV document: one pencil per section card,
  // the clicked card's body swaps to the inline editor until Save.
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [draftSection, setDraftSection] = useState(null);

  // The "Design" door above the picture — browsing is free, a pick restyles
  // the ACTIVE CV (no new CV is created); visitors restyle their own view
  // and the pick stays on their device.
  const [designOpen, setDesignOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [designBusy, setDesignBusy] = useState(false);
  const [designError, setDesignError] = useState(null);

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

  // A finished drag reorders the sections of the page group the card was
  // dropped in — the document shows a filtered view of the full section
  // list, so the full list is rebuilt by refilling those slots in the new
  // order and leaving every other section's slot untouched.
  const handleSectionsReorder = async (reordered) => {
    if (!activeCv || !reordered?.length) return;
    setSaveState(null);
    try {
      const groupIndex = new Map(
        reordered.map((section, index) => [section.id, index])
      );
      let next = 0;
      const savedContent = {
        ...content,
        cvs: (content.cvs ?? []).map((cv) =>
          cv.id === activeCv?.id
            ? {
                ...cv,
                sections: (cv.sections ?? []).map((section) =>
                  groupIndex.has(section.id) ? reordered[next++] : section
                ),
              }
            : cv
        ),
      };
      await save(normalizeContent(savedContent, content));
      setSaveState("saved");
      setTimeout(() => setSaveState(null), 2500);
    } catch (saveError) {
      setSaveState(saveError?.message || "Saving failed.");
    }
  };

  // "Add section" — a fresh empty section lands at the very top of the
  // active CV (which is the top of its own page group) and its editor opens
  // right away, so the first click is already writing into it.
  const handleSectionAdd = async (pageKey) => {
    if (!activeCv) return;
    setSaveState(null);
    const section = {
      id: newId("cvs"),
      type: "entry",
      page: pageKey,
      title: "New section",
      items: [],
    };
    try {
      // A new section lands below the headline card when that card leads
      // the list — the headline is the page's opener, not a peer.
      const existing = activeCv?.sections ?? [];
      const at = existing[0]?.type === "headline" ? 1 : 0;
      const withNew = [...existing.slice(0, at), section, ...existing.slice(at)];
      const savedContent = {
        ...content,
        cvs: (content.cvs ?? []).map((cv) =>
          cv.id === activeCv?.id ? { ...cv, sections: withNew } : cv
        ),
      };
      await save(normalizeContent(savedContent, content));
      startSectionEdit(section);
    } catch (saveError) {
      setSaveState(saveError?.message || "Saving failed.");
    }
  };

  // Delete — the card's trash (armed by a confirming second click) removes
  // the section and its items from the active CV for good; if it was open
  // in the editor, the editor closes with it. The headline card only hides
  // — its marker stays, and the "Add headline" button brings it back.
  const handleSectionDelete = async (sectionId) => {
    if (!activeCv) return;
    setSaveState(null);
    const deletingHeadline =
      activeCv?.sections?.find((section) => section.id === sectionId)?.type ===
      "headline";
    try {
      const savedContent = {
        ...content,
        cvs: (content.cvs ?? []).map((cv) =>
          cv.id === activeCv?.id
            ? {
                ...cv,
                sections: deletingHeadline
                  ? (cv.sections ?? []).map((section) =>
                      section.id === sectionId
                        ? { ...section, hidden: true }
                        : section
                    )
                  : (cv.sections ?? []).filter(
                      (section) => section.id !== sectionId
                    ),
              }
            : cv
        ),
      };
      await save(normalizeContent(savedContent, content));
      if (editingSectionId === sectionId) cancelSectionEdit();
      if (deletingHeadline) setEditing(false);
      setSaveState("saved");
      setTimeout(() => setSaveState(null), 2500);
    } catch (saveError) {
      setSaveState(saveError?.message || "Saving failed.");
    }
  };

  // Restore — the trash hid the headline card; this flips its marker's
  // hidden flag back so the card returns wherever the order keeps it.
  const handleHeadlineRestore = async () => {
    if (!activeCv) return;
    setSaveState(null);
    try {
      const savedContent = {
        ...content,
        cvs: (content.cvs ?? []).map((cv) =>
          cv.id === activeCv?.id
            ? {
                ...cv,
                sections: (cv.sections ?? []).map((section) =>
                  section.type === "headline"
                    ? { ...section, hidden: false }
                    : section
                ),
              }
            : cv
        ),
      };
      await save(normalizeContent(savedContent, content));
      setSaveState("saved");
      setTimeout(() => setSaveState(null), 2500);
    } catch (saveError) {
      setSaveState(saveError?.message || "Saving failed.");
    }
  };

  // One edit-config shared by every CvDocument group; null for visitors and
  // viewer-only roles (no clouduser) so the document renders read-only.
  const sectionEdit = authed && canEdit
    ? {
        activeId: editingSectionId,
        draft: draftSection,
        onDraftChange: setDraftSection,
        onStart: startSectionEdit,
        onSave: handleSectionSave,
        onCancel: cancelSectionEdit,
        onAdd: handleSectionAdd,
        onDelete: handleSectionDelete,
        onHeadlineEdit: startEdit,
        onHeadlineAdd: handleHeadlineRestore,
        headlineEditing: editing,
        onReorder: handleSectionsReorder,
        error: saveState && saveState !== "saved" ? saveState : null,
      }
    : null;

  // Picking a design flips the active CV's design field — nothing else about
  // the CV changes. Visitors AND viewer-only roles get the same flip as a
  // per-device preference: their page and its PDF restyle, the owner's
  // stored design stays untouched, and the saved design returns for editors.
  const handlePickDesign = async (key) => {
    if (designBusy) return;
    if (!authed || !canEdit) {
      writeVisitorDesign(key);
      setVisitorDesign(key);
      pushNotification({
        kind: "theme",
        title: "Theme applied",
        detail: `"${CV_DESIGNS.find((design) => design.key === key)?.label ?? key}" set for this device.`,
      });
      setDesignOpen(false);
      return;
    }
    // A stale local pick must not resurface if this user signs out later.
    clearVisitorDesign();
    if (!activeCv) {
      setDesignOpen(false);
      return;
    }
    setDesignError(null);
    setDesignBusy(true);
    try {
      const list = content.cvs ?? [activeCv];
      await save(
        normalizeContent(
          {
            ...content,
            cvs: list.map((cv) =>
              cv.id === activeCv.id ? { ...cv, design: key } : cv
            ),
          },
          content
        )
      );
      pushNotification({
        kind: "theme",
        title: "Theme applied",
        detail: `"${CV_DESIGNS.find((design) => design.key === key)?.label ?? key}" applied to "${activeCv.name ?? "your CV"}".`,
      });
      setDesignOpen(false);
    } catch (saveError) {
      setDesignError(
        saveError?.message || "Saving failed — please try again."
      );
    } finally {
      setDesignBusy(false);
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

  // ---- The page's building blocks, composed by the header branches below
  // (side/slab/badge share one markup — slab wraps the headline in its solid
  // block, badge in its framed panel; the band header moves photo, contact
  // and skills into a band beside the document). Defined once so the
  // branches share them verbatim.

  // The pill door above the picture (CV pages only): restyle the active CV.
  // Editors and plain visitors get it — a visitor's pick is per-device
  // anyway. Viewers (signed-in without clouduser) get no design doors at
  // all, and neither do guests: they browse one fixed document.
  // Signed-in owners sit 10px lower than visitors — their side also carries
  // the picture's upload hover, so the pill gives it a little more room.
  const pillsRow = isCvPath && (canEdit || (!authed && !guest)) ? (
    <div
      className={`flex items-center gap-2 ${
        authed ? "-translate-y-2.5" : "-translate-y-5"
      }`}
    >
      <button
        type="button"
        onClick={() => setDesignOpen(true)}
        title="Browse more CV templates"
        className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-gray-200 shadow-lg transition-colors hover:border-sky-400/50 hover:text-sky-300"
      >
        {/* The icon is a tiny color wheel — the one glyph that says
            "themes" better than any pictogram. It spins slowly while the
            button is hovered. */}
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[conic-gradient(from_180deg,#f472b6,#fb923c,#facc15,#4ade80,#22d3ee,#818cf8,#f472b6)] group-hover:animate-spin [animation-duration:3s]">
          <span className="h-2 w-2 rounded-full bg-gray-900" />
        </span>
        More Templates
      </button>
    </div>
  ) : null;

  // The owner's create action — one "Add section" for the whole page: new
  // sections land at the top of the stack, right after the headline card.
  // It rides the action bar on stacked layouts and the document column on
  // band layouts, so every design keeps the same create door.
  const addSectionBtn =
    sectionEdit && activeCv ? (
      <button
        type="button"
        onClick={() => handleSectionAdd("intro")}
        title="Add a new section"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-gray-200 shadow-lg transition-colors hover:border-sky-400/50 hover:text-sky-300"
      >
        <Plus className="h-3.5 w-3.5 text-sky-400" />
        Add section
      </button>
    ) : null;

  const moreTemplatesBtn = (
    <button
      type="button"
      onClick={() => setDesignOpen(true)}
      title="Browse more CV templates"
      className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-gray-200 shadow-lg transition-colors hover:border-sky-400/50 hover:text-sky-300"
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[conic-gradient(from_180deg,#f472b6,#fb923c,#facc15,#4ade80,#22d3ee,#818cf8,#f472b6)] group-hover:animate-spin [animation-duration:3s]">
        <span className="h-2 w-2 rounded-full bg-gray-900" />
      </span>
      More Templates
    </button>
  );

  const guidelinesBtn = (
    <button
      type="button"
      onClick={() => setGuideOpen(true)}
      title="How this design works"
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-gray-200 shadow-lg transition-colors hover:border-sky-400/50 hover:text-sky-300"
    >
      <Palette className="h-4 w-4 text-sky-400" />
      Guidelines
    </button>
  );

  // The action bar above the section stack (CV mode, non-band layouts),
  // hugging the card's own width. Owners get discovery on the left edge —
  // templates, then the guide — and the create door on the right; plain
  // visitors have no create door, so the guide keeps the right edge
  // instead. Viewers and guests get no bar at all (guests get the viewer's
  // download bar below). A fresh save flashes the Saved pill between sides.
  const pillsBar = isCvPath && (canEdit || (!authed && !guest)) ? (
    <div className="mx-auto mb-5 flex w-full max-w-3xl items-center justify-between gap-3 px-6">
      {addSectionBtn ? (
        <div className="flex items-center gap-2">
          {moreTemplatesBtn}
          {guidelinesBtn}
        </div>
      ) : (
        <>
          {moreTemplatesBtn}
          {guidelinesBtn}
        </>
      )}
      {saveState === "saved" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-sm font-medium text-teal-400">
          <Check className="w-4 h-4" /> Saved
        </span>
      )}
      {addSectionBtn}
    </div>
  ) : null;

  // The viewer's one CV affordance — "Print/Download PDF" opens the
  // owner's document as the print-ready PDF in an overlay whose own
  // buttons print it or save a copy. Guests get the same door: they
  // browse like a DataViewer member who never signed in. The design doors
  // stay owner/visitor-only, so the bar holds just this, right under the
  // tabs on every layout.
  // Guests have no storage session, so their photo rides the invite webhook
  // too: a FRESH presigned URL per download (the page-load one expires in
  // ~5 minutes), inlined for the PDF. Any failure degrades to no photo —
  // the download itself still works.
  const freshGuestPicture = async () => {
    try {
      const result = await fetchGuestContent(readGuestToken());
      return result.pictureUrl ? await toDataUrl(result.pictureUrl) : null;
    } catch {
      return null;
    }
  };

  // One shared PDF build for the download and the preview — guests fetch a
  // fresh presigned photo (the page-load one expires in ~5 minutes), owners
  // reuse the loaded one.
  const buildCvDoc = async () => {
    const [{ buildCvPdf }, picture] = await Promise.all([
      import("../portfolio/cv-pdf"),
      guest
        ? freshGuestPicture()
        : url
          ? toDataUrl(url)
          : Promise.resolve(null),
    ]);
    return buildCvPdf(content, picture);
  };

  const handleDownloadCv = async () => {
    if (cvBusy) return;
    setCvBusy(true);
    setCvError(null);
    try {
      const doc = await buildCvDoc();
      const { cvPdfFileName } = await import("../portfolio/cv-pdf");
      doc.save(cvPdfFileName(content));
    } catch (downloadError) {
      setCvError(
        downloadError?.message || "The download failed — please try again."
      );
    } finally {
      setCvBusy(false);
    }
  };

  // The preview: the same A4 PDF the download produces, shown in the
  // browser's own viewer inside an overlay — from there the guest prints
  // it or saves it. The blob URL lives in a ref so the unmount cleanup can
  // revoke it (state updates are no-ops by the time cleanup runs).
  const previewUrlRef = useRef(null);
  const previewFrameRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  const handlePreviewCv = async () => {
    if (cvBusy) return;
    setCvBusy(true);
    setCvError(null);
    try {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const doc = await buildCvDoc();
      previewUrlRef.current = String(doc.output("bloburl"));
      setPreviewUrl(previewUrlRef.current);
    } catch (previewError) {
      setCvError(
        previewError?.message || "The preview failed — please try again."
      );
    } finally {
      setCvBusy(false);
    }
  };

  const closePreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
  };

  // Chromium and Firefox print the embedded PDF in place; Apple's engine
  // refuses (it would print the page instead), so there the same document
  // opens in a new tab whose built-in viewer carries the print button.
  const handlePrintCv = () => {
    if (/apple/i.test(navigator.vendor) && previewUrl) {
      window.open(previewUrl, "_blank");
      return;
    }
    try {
      previewFrameRef.current?.contentWindow?.print();
    } catch {
      if (previewUrl) window.open(previewUrl, "_blank");
    }
  };

  const viewerCvBar = isCvPath && cvMode && (authed ? !canEdit : guest) ? (
    // Same width wrapper as the document below (doc dimension decides it),
    // so the button's right edge is the card column's right edge — above
    // the card, not drifting to the viewport's far corner.
    <>
      <div
        className={`-mt-2 mb-2 mx-auto flex w-full items-center justify-end gap-3 px-6 ${
          doc === "grid" ? "max-w-6xl" : doc === "columns" ? "max-w-5xl" : "max-w-3xl"
        }`}
      >
        {cvError && (
          <span className="text-xs text-red-400" role="alert">
            {cvError}
          </span>
        )}
        <button
          type="button"
          onClick={handlePreviewCv}
          disabled={cvBusy}
          title="Open the print-ready PDF — print it or download from there"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-gray-200 shadow-lg transition-colors hover:border-sky-400/50 hover:text-sky-300 disabled:cursor-wait disabled:opacity-60"
        >
          {cvBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
          ) : (
            <Printer className="h-3.5 w-3.5 text-sky-400" />
          )}
          Print/Download PDF
        </button>
      </div>
      {/* The print preview: the viewer's real A4 PDF in the browser's own
          viewer. Esc or the backdrop closes it and revokes the blob. */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closePreview}
          onKeyDown={(event) => event.key === "Escape" && closePreview()}
          role="dialog"
          aria-modal="true"
          aria-label="CV print preview"
        >
          <div
            className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Print preview
                </h3>
                <p className="mt-0.5 text-sm text-gray-400">
                  The exact A4 document the download produces — print it or
                  save a copy.
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                title="Close preview"
                aria-label="Close preview"
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-gray-800">
              <iframe
                ref={previewFrameRef}
                title="CV print preview"
                src={previewUrl}
                className="h-full w-full"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDownloadCv}
                disabled={cvBusy}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:border-sky-400/50 hover:text-sky-300 disabled:cursor-wait disabled:opacity-60"
              >
                {cvBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                ) : (
                  <Download className="h-4 w-4 text-sky-400" />
                )}
                Download PDF
              </button>
              <button
                type="button"
                onClick={handlePrintCv}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  ) : null;

  // The edit affordance — top-right of the section, level with the heading.
  // Owners only; visitors see the pure showcase. Plus the transient Saved.
  const cornerControls = (
    <>
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
    </>
  );

  // The picture and its upload affordances — shared by every layout.
  const avatarFigure = (
    <>
      <motion.div
        className="relative w-36 h-36 md:w-48 md:h-48 group"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <img
          src={picture}
          alt={content?.brand || "Profile"}
          className={`w-full h-full object-cover ${t.photoFrame} shadow-lg transition ${picPending ? "scale-110 blur-xl opacity-60 animate-pulse" : ""} ${uploading ? "opacity-50" : ""}`}
        />
        {/* Mobile: a camera badge pinned to the avatar. Desktop: a full
            hover overlay. One button, two presentations. Editors only —
            visitors and viewers browse read-only. */}
        {canEdit && (
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
    </>
  );

  // The headline's edit form — the same in every design (it is the editing
  // surface, not part of the design).
  const editorForm = (
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
  );

  const headlineCore = (
    <>
      <motion.h1
        className={t.heroGreeting}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {hero.greeting}
      </motion.h1>

      <motion.h2
        className={t.heroTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        {hero.title}
      </motion.h2>
    </>
  );

  // Personal information — the CV header's contact strip: city, phone,
  // email, one optional link, only the filled parts. Sidebar moves it to
  // the band, so the branch chooses whether to render it.
  const contactStrip =
    cvMode &&
    [
      hero.contact?.location,
      hero.contact?.phone,
      hero.contact?.email,
      hero.contact?.link,
    ].some(Boolean) && (
      <motion.p
        className={t.heroContact}
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
                <span className={t.contactSep}> · </span>
              )}
            </span>
          ))}
      </motion.p>
    );

  const bioBlock = (
    <motion.p
      className={t.heroBio}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.9 }}
    >
      <AccentText
        text={hero.bio.text}
        accentClass={accentForDesign(hero.bio.accentClass, design)}
      />
    </motion.p>
  );

  const skillsRow = (
    <motion.div
      className={t.skillsRow}
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
  );

  // The sidebar design's dark band: contact and skills move out of the
  // headline into the island beside the photo.
  const bandContact =
    cvMode &&
    [
      hero.contact?.location,
      hero.contact?.phone,
      hero.contact?.email,
      hero.contact?.link,
    ].some(Boolean) && (
      <div className="flex flex-col gap-1.5">
        <span className={t.bandLabel}>Contact</span>
        {[
          hero.contact.location,
          hero.contact.phone,
          hero.contact.email,
          hero.contact.link,
        ]
          .filter(Boolean)
          .map((part) => (
            <span key={part} className={t.bandRow}>
              {part}
            </span>
          ))}
      </div>
    );

  const bandSkills =
    (hero.skills?.length ?? 0) > 0 && (
      <div className="flex flex-col gap-2">
        <span className={t.bandLabel}>Skills</span>
        <div className="flex flex-wrap gap-2">
          {hero.skills.map((skill, index) => (
            <span
              key={index}
              className={`${skill.color} text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium`}
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>
    );

  // CV mode: the headline (greeting, title, contact, bio, skills) lives in
  // its own card in the section stack — the same edit/delete icons, the
  // same drag as every section. Each layout contributes its own composition
  // (the band keeps contact and skills in its aside, so its card carries
  // the greeting, title, bio and skills); while the hero editor is open,
  // the card shows the form itself.
  const headlineNode = !cvMode
    ? null
    : editing
      ? editorForm
      : isBand
        ? (
            <div className="flex flex-col gap-4">
              {headlineCore}
              {bioBlock}
            </div>
          )
        : header === "slab" || header === "badge"
          ? (
              <div className="flex flex-col-reverse items-center gap-5 sm:flex-row">
                <div className="min-w-0 flex-1 w-full">
                  <div className={header === "slab" ? t.bannerBlock : t.badgePanel}>
                    {headlineCore}
                    {contactStrip}
                  </div>
                  {bioBlock}
                  {skillsRow}
                </div>
                {avatarFigure}
              </div>
            )
          : (
              <div className="flex flex-col-reverse items-center gap-5 sm:flex-row">
                <div className="min-w-0 flex-1 w-full">
                  {headlineCore}
                  {contactStrip}
                  {bioBlock}
                  {skillsRow}
                </div>
                {avatarFigure}
              </div>
            );

  // The headline card's marker — its hidden flag drives the restore button.
  const headlineMarker = activeCv?.sections?.find(
    (section) => section.type === "headline"
  );
  const headlineHidden = headlineMarker?.hidden === true;

  // The document body — every section of the active CV on one page, grouped
  // by its "Show on" page (the old sub-pages), rendered in the CV's design.
  // Each group only shows when it has sections.
  const documents = isCvPath
    ? CV_PAGES.map((page) => (
        <CvDocument
          key={page.key}
          design={design}
          sections={activeCv?.sections?.filter(
            (section) => section.page === page.key
          )}
          headline={page.key === "intro" ? headlineNode : null}
          headlineHidden={page.key === "intro" ? headlineHidden : false}
          // The playful local drag is a plain-visitor toy — a guest was
          // invited to read one CV, not to rearrange it.
          visitorDrag={!authed && !guest}
          demo={!authed && !guest && page.key === "intro"}
          edit={sectionEdit && activeCv ? sectionEdit : null}
        />
      ))
    : null;

  // The band layouts' island: pills, photo, contact and skills move out of
  // the headline into the sticky band beside the document. Which side it
  // renders on is the branch's business; the content is shared.
  const bandAside = (
    <aside className={t.band}>
      {pillsRow}
      {avatarFigure}
      {bandContact}
      {bandSkills}
    </aside>
  );

  return (
    <div className={t.pageShell}>
      {/* Landing mode switch — Portfolio | CV, right under the navbar.
          The bottom margin is the tabs' own breathing room: content below
          (bar or none) never touches them. */}
      <div className="mb-5 flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>

      {/* Viewers' single CV door — the download sits between the tabs and
          whichever layout branch follows. */}
      {viewerCvBar}

      {isBand ? (
        <div className={t.cvGrid}>
          {cornerControls}
          {bandAside}
          <div className="flex flex-col gap-5">
            {/* Portfolio mode keeps its headline on top; in CV mode the
                headline is the marker card inside the documents. */}
            {!cvMode &&
              (editing ? (
                editorForm
              ) : (
                <div className="flex flex-col gap-4">
                  {headlineCore}
                  {bioBlock}
                </div>
              ))}
            {/* Band CV mode: the create door lives above the document —
                the band aside carries discovery, this carries action. */}
            {cvMode && addSectionBtn && (
              <div className="flex justify-end">{addSectionBtn}</div>
            )}
            {documents}
          </div>
        </div>
      ) : cvMode ? (
        // CV mode: the pill bar hugs the card's width — templates on the
        // left edge, the design door on the right — and the section stack
        // follows right below. The headline card carries its own pencil,
        // so no corner pencil in this branch.
        <div className="relative flex-1">
          {pillsBar}
          {/* The groups ride the same gap the cards do — after the group
              headings went, one shared rhythm holds the page together, and
              a single bottom pad closes it. */}
          <div className="flex flex-col gap-5 pb-16">{documents}</div>
        </div>
      ) : header === "stack" ? (
        <div className="relative flex-1 flex flex-col items-center p-6 md:p-10 gap-6 text-center">
          {cornerControls}
          {avatarFigure}
          <motion.div
            className="max-w-xl w-full flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {editing ? (
              editorForm
            ) : (
              <>
                {headlineCore}
                {contactStrip}
                {bioBlock}
                {skillsRow}
              </>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-10 gap-8">
          {cornerControls}
          {avatarFigure}
          <motion.div
            className="text-center md:text-left max-w-md w-full flex flex-col gap-4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {editing ? (
              editorForm
            ) : (
              <>
                {/* The slab/badge headers wrap the headline in their block
                    or panel; side keeps the bare headline. */}
                {header === "side" ? (
                  <>
                    {headlineCore}
                    {contactStrip}
                  </>
                ) : (
                  <div
                    className={
                      header === "slab" ? t.bannerBlock : t.badgePanel
                    }
                  >
                    {headlineCore}
                    {contactStrip}
                  </div>
                )}
                {bioBlock}
                {skillsRow}
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* The design gallery — browse for free; a pick restyles the active
          CV. For visitors the pick restyles their own view only, and the
          reset chip brings the saved design back. */}
      <DesignGallery
        open={designOpen}
        busy={designBusy}
        error={designError}
        activeDesign={design}
        localOnly={!canEdit}
        onResetLocal={
          visitorDesign
            ? () => {
                clearVisitorDesign();
                setVisitorDesign(null);
              }
            : null
        }
        cv={
          activeCv ?? {
            ...defaultCvFor({ hero: content.hero }),
            sections: [],
          }
        }
        content={content}
        picture={picture}
        onPick={handlePickDesign}
        onClose={() => setDesignOpen(false)}
      />
      {/* The design school — the recipe behind this look, in the active
          design's own accent. Its footer door hands the reader straight to
          the gallery above. */}
      <DesignGuide
        open={guideOpen}
        design={design}
        onBrowse={() => {
          setGuideOpen(false);
          setDesignOpen(true);
        }}
        onClose={() => setGuideOpen(false)}
      />
    </div>
  );
};

export default Hero;
