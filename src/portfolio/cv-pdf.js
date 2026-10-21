import { jsPDF } from "jspdf";
import { getActiveCv } from "../content/portfolioShape";
import { cvDesignPrint } from "../components/cv/cvDesign";

// Builds a print-ready A4 PDF of the CV with jsPDF — a document, not a
// screenshot: crisp selectable text an employer can read and print. Layout
// mirrors the app's CV views: headline + summary + skill chips, then EVERY
// section in the order the owner arranged them (the per-page assignment is a
// website concern; the PDF is always the whole document).
//
// The PDF follows the CV's design (see cvDesignPrint). The header pattern
// picks the page geometry: side keeps the classic headline (photo top-right),
// badge frames the same headline in an accent panel, stack centers it, slab
// paints an accent banner across the top of page one (later pages keep a
// thin strip), and band paints a dark accent band down the left edge —
// photo, contact, skills — repainting it on every page break. The document
// pattern picks the body arrangement: flow stacks the sections, rail adds an
// accent timeline beside entry sections, columns and grid split the sections
// across two balanced columns (grid boxes each section), zebra tints
// alternate sections. The accent hue always follows the design's accent, and
// the tone decides the paper itself: dark designs print on their dark tinted
// page with light text and glassy card washes — exactly what the gallery card
// shows — while light ones keep the soft tinted paper.

// The light-tone paper palette — a dark design swaps these for its own
// light-on-dark set inside buildCvPdf.
const BODY = "#374151"; // gray-700
const MUTED = "#6b7280"; // gray-500
const TITLE = "#111827"; // gray-900
const LINE = "#e5e7eb"; // gray-200

const PAGE_H = 297;
const MARGIN_X = 18;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 18;
const RIGHT_X = 210 - MARGIN_X;
const CONTENT_W = 210 - MARGIN_X * 2;

// `**accent**` markers → styled runs, same convention as the app.
const parseRuns = (text) => {
  const runs = [];
  const source = String(text ?? "");
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match;
  while ((match = re.exec(source))) {
    if (match.index > last) runs.push({ text: source.slice(last, match.index), accent: false });
    runs.push({ text: match[1], accent: true });
    last = re.lastIndex;
  }
  if (last < source.length) runs.push({ text: source.slice(last), accent: false });
  return runs;
};

export const cvPdfFileName = (content) => {
  const name = String(content?.brand || "cv")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${name || "cv"}-cv.pdf`;
};

export function buildCvPdf(content, pictureDataUrl, designOverride = null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN_TOP;
  // The design's palette — accent hue follows the CV's design, so a rose
  // paper CV prints rose headings, a teal one prints teal. `designOverride`
  // previews a design the CV does not store (the gallery's print preview):
  // a look, never a write.
  const theme = cvDesignPrint(designOverride ?? getActiveCv(content)?.design);
  const { layout, doc: docPattern, photo } = theme;
  const ACCENT = theme.hex;
  const BAND = theme.hexDeep;
  const BAND_SUB = theme.hexLight;
  // The tone decides the paper itself: a dark design prints on its dark
  // tinted page with light text — exactly what its gallery card shows — and
  // the accent details lighten to stay visible on it. BAND_SUB (the
  // accent's light hex) doubles as the dark tone's accent shade.
  const dark = theme.tone === "dark";
  const ACCENT_RUN = dark ? BAND_SUB : ACCENT;
  const C_BODY = dark ? "#d1d5db" : BODY; // gray-300 / gray-700
  const C_MUTED = dark ? "#9ca3af" : MUTED; // gray-400 / gray-500
  const C_TITLE = dark ? "#f9fafb" : TITLE; // gray-50 / gray-900
  const C_LINE = dark ? theme.lineDark : LINE;
  const PAGE_BG = dark ? theme.pageDark : theme.pageLight;
  // jsPDF can't clip an image to a circle — the photo shape shows as the
  // frame's corner rounding (square vs soft).
  const photoR = photo === "square" ? 1 : 6;
  // Every page starts with the design's page tint, repainted on every
  // break; the band/banner flows swap in page + chrome repaints.
  const paintPage = () => {
    doc.setFillColor(PAGE_BG);
    doc.rect(0, 0, 210, PAGE_H, "F");
  };
  paintPage();
  let afterPageBreak = paintPage;
  // Band layouts move the page number into their main column.
  let footerRight = RIGHT_X;

  const setStyle = (size, style, color) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color);
  };

  const ensureSpace = (needed) => {
    if (y + needed > PAGE_H - MARGIN_BOTTOM) {
      doc.addPage();
      y = MARGIN_TOP;
      afterPageBreak?.();
      return true;
    }
    return false;
  };

  // Greedy word-wrap that keeps accent styling per word (splitTextToSize
  // cannot color runs mid-line). Everything positions inside `col` —
  // { x, width, right } in mm — so one body serves every layout.
  const drawRich = (text, size, baseColor, col) => {
    const words = [];
    parseRuns(text).forEach((run) =>
      String(run.text)
        .split(/\s+/)
        .filter(Boolean)
        .forEach((word) => words.push({ word, accent: run.accent }))
    );
    if (words.length === 0) return;
    const lineHeight = size * 0.352778 * 1.45;
    setStyle(size, "normal", baseColor);
    const spaceW = doc.getTextWidth(" ");
    let x = col.x;
    words.forEach(({ word, accent }) => {
      setStyle(size, accent ? "bold" : "normal", accent ? ACCENT_RUN : baseColor);
      const wordW = doc.getTextWidth(word);
      if (x + wordW > col.right && x > col.x) {
        x = col.x;
        y += lineHeight;
      }
      ensureSpace(lineHeight);
      doc.text(word, x, y);
      x += wordW + spaceW;
    });
    y += lineHeight;
  };

  const sectionTitle = (label, col) => {
    y += 5;
    ensureSpace(12);
    setStyle(13, "bold", dark ? BAND_SUB : ACCENT);
    doc.text(String(label).toUpperCase(), col.x, y);
    y += 2.5;
    doc.setDrawColor(C_LINE);
    doc.line(col.x, y, col.right, y);
    y += 6;
  };

  const cv = getActiveCv(content) ?? {};
  const brand = content?.brand || "Curriculum Vitae";
  // Chips print in the skill's own color, like the web chips — this hex map
  // mirrors SKILL_COLOR_OPTIONS (whose classes Tailwind owns).
  const SKILL_HEX = {
    "bg-yellow-400 text-gray-800": { fill: "#facc15", text: "#1f2937" },
    "bg-indigo-500": { fill: "#6366f1", text: "#ffffff" },
    "bg-green-500": { fill: "#22c55e", text: "#ffffff" },
    "bg-sky-500": { fill: "#0ea5e9", text: "#ffffff" },
    "bg-pink-500": { fill: "#ec4899", text: "#ffffff" },
  };
  const skills = (cv.skills ?? [])
    .map((skill) => {
      const name = String(skill?.name ?? "").trim();
      if (!name) return null;
      return {
        name,
        color: SKILL_HEX[skill?.color] ?? { fill: "#0ea5e9", text: "#ffffff" },
      };
    })
    .filter(Boolean);
  const contactParts = [
    cv.contact?.location,
    cv.contact?.phone,
    cv.contact?.email,
    cv.contact?.link,
  ].filter(Boolean);
  const contact = contactParts.join("  ·  ");

  // One entry — heading, right-aligned period, sub, details — indented by
  // `indent` mm (the timeline rail needs room for its dots).
  const drawEntry = (item, col, indent = 0) => {
    setStyle(11, "bold", C_TITLE);
    const textX = col.x + indent;
    const headingLines = doc.splitTextToSize(
      String(item.heading ?? ""),
      col.width - 35 - indent // leave room for the right-aligned period
    );
    ensureSpace(headingLines.length * 5.5 + 8);
    const firstLineY = y;
    headingLines.forEach((line) => {
      doc.text(line, textX, y);
      y += 5.5;
    });
    if (item.period) {
      setStyle(9, "normal", C_MUTED);
      doc.text(String(item.period), col.right, firstLineY, {
        align: "right",
      });
    }
    if (item.sub) {
      setStyle(9.5, "italic", ACCENT_RUN);
      doc.text(String(item.sub), textX, y);
      y += 5;
    }
    if (item.details) {
      setStyle(9.5, "normal", C_BODY);
      doc.splitTextToSize(String(item.details), col.width - indent).forEach((line) => {
        ensureSpace(4.8);
        doc.text(line, textX, y);
        y += 4.8;
      });
    }
    y += 2.5;
  };

  // One section (entry / list / text). The timeline variant draws an accent
  // rail with a dot per entry.
  const drawOneSection = (section, col, timeline) => {
    const items = section.items ?? [];
    if (items.length === 0) return;
    sectionTitle(section.title || "Section", col);

    if (section.type === "entry") {
        const indent = timeline ? 4 : 0;
        const dots = [];
        items.forEach((item) => {
          dots.push(y - 1.3); // the first heading line's mid-cap height
          drawEntry(item, col, indent);
        });
        if (timeline) {
          doc.setDrawColor(ACCENT_RUN);
          doc.setLineWidth(0.4);
          doc.line(col.x + 1, dots[0] - 1, col.x + 1, y - 3);
          doc.setFillColor(ACCENT_RUN);
          dots.forEach((dotY) => doc.circle(col.x + 1, dotY, 1.1, "F"));
        }
      } else if (section.type === "list") {
        setStyle(10, "normal", C_BODY);
        items.forEach((item) => {
          const lines = doc.splitTextToSize(String(item.text ?? ""), col.width - 5);
          ensureSpace(lines.length * 5);
          const bulletY = y;
          doc.setFillColor(ACCENT_RUN);
          doc.circle(col.x + 1, bulletY - 1.3, 0.8, "F");
          lines.forEach((line) => {
            ensureSpace(5);
            doc.text(line, col.x + 5, y);
            y += 5;
          });
        });
      } else {
        // text section: free-form paragraphs
        items.forEach((item) => {
          if (item.text) drawRich(item.text, 10, C_BODY, col);
          y += 1;
        });
      }
      y += 1.5;
  };

  // Every section, flowing down `col` in the owner's order. Dark designs
  // veil each section as a glassy card, like their web cards.
  const drawSections = (col, timeline = false) => {
    (cv.sections ?? []).forEach((section) => {
      if (!dark) {
        drawOneSection(section, col, timeline);
        return;
      }
      const page = doc.getNumberOfPages();
      const y0 = y;
      drawOneSection(section, col, timeline);
      frameSection("card", page, y0, y + 1, col);
      // The rail's dark cards carry a border on the web; plain flow cards
      // are fill only.
      if (timeline) frameSection("box", page, y0, y + 1, col);
      y += 2;
    });
  };

  // Skill chips — shared by the column and band flows. Each chip prints in
  // the skill's own color, exactly like the web chips.
  const drawSkillChips = (col) => {
    if (skills.length === 0) return;
    y += 2;
    const chipH = 6.5;
    const gap = 2.5;
    let chipX = col.x;
    let chipTop = y;
    skills.forEach(({ name, color }) => {
      setStyle(9.5, "bold", color.text);
      const chipW = doc.getTextWidth(name) + 6;
      if (chipX + chipW > col.right) {
        chipX = col.x;
        chipTop += chipH + gap;
      }
      if (ensureSpace(chipH + gap)) {
        // The break reset y to the new page's top — the chip row restarts
        // there too, or this chip would draw at the old (bottom) position
        // and push every later chip onto yet another page.
        chipTop = y;
        chipX = col.x;
      }
      doc.setFillColor(color.fill);
      doc.roundedRect(chipX, chipTop, chipW, chipH, 3, 3, "F");
      doc.text(name, chipX + 3, chipTop + 4.5);
      chipX += chipW + gap;
      y = chipTop + chipH + gap;
    });
  };

  // The shared headline: brand + photo top-right, title, contact strip,
  // thin rule.
  const drawHeadline = (col) => {
    setStyle(24, "bold", C_TITLE);
    doc.text(brand, col.x, y + 8);
    if (pictureDataUrl) {
      try {
        doc.addImage(pictureDataUrl, col.right - 26, MARGIN_TOP - 6, 26, 26);
        doc.setDrawColor(ACCENT);
        doc.setLineWidth(0.5);
        doc.roundedRect(col.right - 26, MARGIN_TOP - 6, 26, 26, photoR, photoR, "S");
      } catch {
        // jsPDF only decodes PNG/JPEG reliably — skip the photo otherwise.
      }
    }
    y += 14;
    if (cv.title) {
      setStyle(12, "normal", C_MUTED);
      doc.text(String(cv.title), col.x, y);
      y += 6;
    }
    if (contact) {
      setStyle(9.5, "normal", C_BODY);
      doc.splitTextToSize(contact, col.width).forEach((line) => {
        ensureSpace(5);
        doc.text(line, col.x, y);
        y += 5;
      });
    }
    y += 1;
    doc.setDrawColor(C_LINE);
    doc.line(col.x, y, col.right, y);
    y += 4;
  };

  // side: the classic single-column document — headline, then the body.
  const drawSidePdf = () => {
    const col = { x: MARGIN_X, width: CONTENT_W, right: RIGHT_X };
    drawHeadline(col);
    drawDocument(col);
  };

  // badge: the same headline framed in an accent panel.
  const drawBadgePdf = () => {
    const col = { x: MARGIN_X, width: CONTENT_W, right: RIGHT_X };
    const panelTop = MARGIN_TOP - 8;
    drawHeadline(col);
    doc.setDrawColor(ACCENT);
    doc.setLineWidth(0.8);
    doc.roundedRect(col.x - 3, panelTop, col.width + 6, y - panelTop - 2, 4, 4, "S");
    // The panel's tint, washed over the headline region like the web
    // panel's fill — light enough that the text beneath stays readable.
    try {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: dark ? 0.1 : 0.3 }));
      doc.setFillColor(dark ? ACCENT : BAND_SUB);
      doc.roundedRect(col.x - 3, panelTop, col.width + 6, y - panelTop - 2, 4, 4, "F");
      doc.restoreGraphicsState();
    } catch {
      // GState unsupported — the panel stays an outline.
    }
    drawDocument(col);
  };

  // A section's post-draw frame — the grid box (stroke, drawn over nothing
  // it could hide), the zebra tint (a near-transparent wash, light enough
  // that the text beneath stays readable), or the dark tone's card veil
  // (a glassy dark wash imitating the web cards). Skipped when the section
  // crossed a page break: the recorded range would land on the wrong page.
  const frameSection = (kind, page, y0, y1, col) => {
    if (doc.getNumberOfPages() !== page || y1 - y0 < 4) return;
    doc.setPage(page);
    if (kind === "box") {
      doc.setDrawColor(C_LINE);
      doc.setLineWidth(0.3);
      doc.roundedRect(col.x - 2, y0 - 2, col.width + 4, y1 - y0 + 3, 3, 3, "S");
      return;
    }
    try {
      doc.saveGraphicsState();
      doc.setGState(
        kind === "card"
          ? new doc.GState({ opacity: 0.2 })
          : new doc.GState({ opacity: dark ? 0.05 : 0.07 })
      );
      // The web cards are glassy gray-900/60 — a darker neutral card on the
      // tinted page — so the veil washes that exact color over the section.
      doc.setFillColor(kind === "card" ? "#111827" : dark ? "#ffffff" : ACCENT);
      doc.roundedRect(col.x - 2, y0 - 2, col.width + 4, y1 - y0 + 3, 3, 3, "F");
      doc.restoreGraphicsState();
    } catch {
      // GState unsupported — this section just skips the wash.
    }
  };

  // The document body in the design's arrangement: bio, chips, then the
  // sections in the doc pattern.
  const drawDocument = (col, { withChips = true } = {}) => {
    if (cv.bio?.text) drawRich(cv.bio.text, 10.5, C_BODY, col);
    if (withChips) drawSkillChips(col);
    if (docPattern === "columns") {
      drawSplitSections(false, col);
    } else if (docPattern === "grid") {
      drawSplitSections(true, col);
    } else if (docPattern === "zebra") {
      drawZebraSections(col);
    } else {
      drawSections(col, docPattern === "rail");
    }
  };

  // columns / grid: the non-empty sections split into two balanced halves
  // drawn down either half of `col` — the band's narrow main column
  // included, not just the page margins; grid frames each section in a box.
  const drawSplitSections = (boxed, col) => {
    const list = (cv.sections ?? []).filter(
      (section) => (section.items ?? []).length > 0
    );
    if (list.length === 0) return;
    const half = Math.ceil(list.length / 2);
    const colW = (col.width - 10) / 2;
    const leftCol = { x: col.x, width: colW, right: col.x + colW };
    const rightCol = { x: col.x + colW + 10, width: colW, right: col.right };
    const columnTop = y + 4;
    const drawHalf = (sections, col) => {
      y = columnTop;
      sections.forEach((section) => {
        const page = doc.getNumberOfPages();
        const y0 = y;
        drawOneSection(section, col, false);
        if (dark) {
          // Dark cards: the glassy wash plus an outline — grid and columns
          // cards carry a border on the web.
          frameSection("card", page, y0, y + 1, col);
          frameSection("box", page, y0, y + 1, col);
        } else if (boxed) {
          frameSection("box", page, y0, y + 1, col);
        }
        y += boxed ? 5 : 1.5;
      });
    };
    drawHalf(list.slice(0, half), leftCol);
    drawHalf(list.slice(half), rightCol);
  };

  // zebra: full-width sections, alternate ones carrying a faint accent tint.
  const drawZebraSections = (col) => {
    (cv.sections ?? []).forEach((section) => {
      if ((section.items ?? []).length === 0) return;
      const page = doc.getNumberOfPages();
      const y0 = y;
      drawOneSection(section, col, false);
      frameSection("tint", page, y0, y + 1, col);
      y += 3;
    });
  };

  // band-left / band-right: the dark band (photo, contact, skills — page 1
  // only, stopping above the bottom margin) plus the document down the main
  // column on the other side.
  const drawBandPdf = (side) => {
    const BAND_W = 66;
    const bandX = side === "right" ? 210 - BAND_W : 0;
    const bandCol =
      side === "right"
        ? { x: 210 - BAND_W + 8, width: BAND_W - 16, right: 210 - 8 }
        : { x: 8, width: BAND_W - 16, right: BAND_W - 8 };
    const mainCol =
      side === "right"
        ? { x: 14, width: 210 - BAND_W - 12 - 14, right: 210 - BAND_W - 12 }
        : { x: BAND_W + 12, width: 210 - BAND_W - 12 - 14, right: 210 - 14 };
    const paintBand = () => {
      doc.setFillColor(BAND);
      doc.rect(bandX, 0, BAND_W, PAGE_H, "F");
    };
    paintPage();
    paintBand();
    // Page tint under everything, band chrome on top — on every break.
    afterPageBreak = () => {
      paintPage();
      paintBand();
    };
    footerRight = mainCol.right;

    // ---- Band content (page 1) ----
    let bandY = MARGIN_TOP + 2;
    if (pictureDataUrl) {
      try {
        const size = 30;
        doc.addImage(pictureDataUrl, bandCol.x, bandY, size, size);
        doc.setDrawColor("#ffffff");
        doc.setLineWidth(0.5);
        doc.roundedRect(bandCol.x, bandY, size, size, photoR, photoR, "S");
      } catch {
        // undecodable picture — skip it, the band still reads fine.
      }
      bandY += 38;
    }
    if (contactParts.length > 0) {
      setStyle(8, "bold", BAND_SUB);
      doc.text("CONTACT", bandCol.x, bandY);
      bandY += 5.5;
      setStyle(9, "normal", "#ffffff");
      contactParts.forEach((field) => {
        doc.splitTextToSize(field, bandCol.width).forEach((line) => {
          if (bandY > PAGE_H - MARGIN_BOTTOM) return;
          doc.text(line, bandCol.x, bandY);
          bandY += 4.8;
        });
      });
      bandY += 4;
    }
    if (skills.length > 0) {
      setStyle(8, "bold", BAND_SUB);
      doc.text("SKILLS", bandCol.x, bandY);
      bandY += 5.5;
      setStyle(9, "normal", "#ffffff");
      skills.forEach(({ name }) => {
        doc.splitTextToSize(name, bandCol.width).forEach((line, index) => {
          if (bandY > PAGE_H - MARGIN_BOTTOM) return;
          if (index === 0) {
            doc.setFillColor(BAND_SUB);
            doc.circle(bandCol.x + 1, bandY - 1.3, 0.8, "F");
          }
          doc.text(line, bandCol.x + 4.5, bandY);
          bandY += 4.8;
        });
      });
    }

    // ---- Main column ----
    y = MARGIN_TOP;
    setStyle(22, "bold", C_TITLE);
    doc.text(brand, mainCol.x, y + 8);
    y += 14;
    if (cv.title) {
      setStyle(12, "normal", C_MUTED);
      doc.splitTextToSize(String(cv.title), mainCol.width).forEach((line) => {
        doc.text(line, mainCol.x, y);
        y += 6;
      });
    }
    y += 1;
    doc.setDrawColor(C_LINE);
    doc.line(mainCol.x, y, mainCol.right, y);
    y += 4;
    // Bio and sections come from drawDocument — it draws the bio itself, so
    // drawing it here too printed every band CV's bio twice. Skills live in
    // the band; the main column skips the chip rows.
    drawDocument(mainCol, { withChips: false });
  };

  // banner: an accent banner across the top of page one carries the
  // headline; later pages keep a thin strip so the design survives breaks.
  const drawBannerPdf = () => {
    const BAND_H = 34;
    doc.setFillColor(ACCENT);
    doc.rect(0, 0, 210, BAND_H, "F");
    setStyle(20, "bold", "#ffffff");
    doc.text(brand, 14, 14.5);
    let bannerY = 21;
    if (cv.title) {
      setStyle(11, "normal", "#ffffff");
      doc.text(String(cv.title), 14, bannerY);
      bannerY += 6;
    }
    if (contact) {
      setStyle(8.5, "normal", "#ffffff");
      doc.splitTextToSize(contact, 150).forEach((line) => {
        if (bannerY > BAND_H - 3) return;
        doc.text(line, 14, bannerY);
        bannerY += 4.5;
      });
    }
    if (pictureDataUrl) {
      try {
        const size = 22;
        doc.addImage(pictureDataUrl, 210 - 14 - size, 6, size, size);
        doc.setDrawColor("#ffffff");
        doc.setLineWidth(0.5);
        doc.roundedRect(210 - 14 - size, 6, size, size, photoR, photoR, "S");
      } catch {
        // undecodable picture — skip it.
      }
    }
    const paintStrip = () => {
      doc.setFillColor(ACCENT);
      doc.rect(0, 0, 210, 6, "F");
    };
    afterPageBreak = () => {
      paintPage();
      paintStrip();
    };

    y = BAND_H + 8;
    const col = { x: MARGIN_X, width: CONTENT_W, right: RIGHT_X };
    drawDocument(col);
  };

  // centered: photo and headline centered at the top, then the standard
  // document body.
  const drawCenteredPdf = () => {
    const col = { x: MARGIN_X, width: CONTENT_W, right: RIGHT_X };
    if (pictureDataUrl) {
      try {
        const size = 26;
        const photoX = 105 - size / 2;
        doc.addImage(pictureDataUrl, photoX, MARGIN_TOP - 6, size, size);
        doc.setDrawColor(ACCENT);
        doc.setLineWidth(0.5);
        doc.roundedRect(photoX, MARGIN_TOP - 6, size, size, photoR, photoR, "S");
      } catch {
        // undecodable picture — skip it.
      }
    }
    setStyle(24, "bold", C_TITLE);
    doc.text(brand, 105, y + 24, { align: "center" });
    y += 28;
    if (cv.title) {
      setStyle(12, "normal", C_MUTED);
      doc.text(String(cv.title), 105, y, { align: "center" });
      y += 6;
    }
    if (contact) {
      setStyle(9.5, "normal", C_BODY);
      doc.splitTextToSize(contact, col.width).forEach((line) => {
        doc.text(line, 105, y, { align: "center" });
        y += 5;
      });
    }
    y += 1;
    doc.setDrawColor(C_LINE);
    doc.line(col.x, y, col.right, y);
    y += 4;
    drawDocument(col);
  };

  // The header pattern picks the page geometry.
  if (layout === "band") {
    drawBandPdf();
  } else if (layout === "slab") {
    drawBannerPdf();
  } else if (layout === "stack") {
    drawCenteredPdf();
  } else if (layout === "badge") {
    drawBadgePdf();
  } else {
    drawSidePdf();
  }

  // ---- Footer page numbers (always over the main area, never the band) ----
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setStyle(8, "normal", C_MUTED);
    doc.text(`${page} / ${pageCount}`, footerRight, PAGE_H - 8, {
      align: "right",
    });
  }

  return doc;
}
