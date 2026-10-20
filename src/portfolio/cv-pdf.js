import { jsPDF } from "jspdf";
import { getActiveCv } from "../content/portfolioShape";

// Builds a print-ready A4 PDF of the CV with jsPDF — a document, not a
// screenshot: crisp selectable text an employer can read and print. Layout
// mirrors the app's CV views: headline + summary + skill chips, then EVERY
// section in the order the owner arranged them (the per-page assignment is a
// website concern; the PDF is always the whole document).

const ACCENT = "#0284c7"; // sky-600
const BODY = "#374151"; // gray-700
const MUTED = "#6b7280"; // gray-500
const TITLE = "#111827"; // gray-900
const LINE = "#e5e7eb"; // gray-200
const CHIP = "#f1f5f9"; // slate-100

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

export function buildCvPdf(content, pictureDataUrl) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN_TOP;

  const setStyle = (size, style, color) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color);
  };

  const ensureSpace = (needed) => {
    if (y + needed > PAGE_H - MARGIN_BOTTOM) {
      doc.addPage();
      y = MARGIN_TOP;
      return true;
    }
    return false;
  };

  // Greedy word-wrap that keeps accent styling per word (splitTextToSize
  // cannot color runs mid-line).
  const drawRich = (text, size, baseColor) => {
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
    let x = MARGIN_X;
    words.forEach(({ word, accent }) => {
      setStyle(size, accent ? "bold" : "normal", accent ? ACCENT : baseColor);
      const wordW = doc.getTextWidth(word);
      if (x + wordW > RIGHT_X && x > MARGIN_X) {
        x = MARGIN_X;
        y += lineHeight;
      }
      ensureSpace(lineHeight);
      doc.text(word, x, y);
      x += wordW + spaceW;
    });
    y += lineHeight;
  };

  const sectionTitle = (label) => {
    y += 5;
    ensureSpace(12);
    setStyle(13, "bold", ACCENT);
    doc.text(String(label).toUpperCase(), MARGIN_X, y);
    y += 2.5;
    doc.setDrawColor(LINE);
    doc.line(MARGIN_X, y, RIGHT_X, y);
    y += 6;
  };

  const cv = getActiveCv(content) ?? {};
  const brand = content?.brand || "Curriculum Vitae";

  // ---- Headline ----
  setStyle(24, "bold", TITLE);
  doc.text(brand, MARGIN_X, y + 8);
  if (pictureDataUrl) {
    try {
      doc.addImage(pictureDataUrl, RIGHT_X - 26, MARGIN_TOP - 6, 26, 26);
      doc.setDrawColor(ACCENT);
      doc.setLineWidth(0.5);
      doc.rect(RIGHT_X - 26, MARGIN_TOP - 6, 26, 26);
    } catch {
      // jsPDF only decodes PNG/JPEG reliably — skip the photo otherwise.
    }
  }
  y += 14;
  if (cv.title) {
    setStyle(12, "normal", MUTED);
    doc.text(String(cv.title), MARGIN_X, y);
    y += 6;
  }
  // ---- Personal information — the contact strip under the headline ----
  const contact = [
    cv.contact?.location,
    cv.contact?.phone,
    cv.contact?.email,
    cv.contact?.link,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (contact) {
    setStyle(9.5, "normal", BODY);
    doc.splitTextToSize(contact, CONTENT_W).forEach((line) => {
      ensureSpace(5);
      doc.text(line, MARGIN_X, y);
      y += 5;
    });
  }
  y += 1;
  doc.setDrawColor(LINE);
  doc.line(MARGIN_X, y, RIGHT_X, y);
  y += 4;

  // ---- Summary ----
  if (cv.bio?.text) drawRich(cv.bio.text, 10.5, BODY);

  // ---- Skill chips ----
  const skills = cv.skills ?? [];
  if (skills.length > 0) {
    y += 2;
    setStyle(9.5, "bold", BODY);
    const chipH = 6.5;
    const gap = 2.5;
    let chipX = MARGIN_X;
    let chipTop = y;
    skills.forEach((skill) => {
      const label = String(skill?.name ?? "").trim();
      if (!label) return;
      const chipW = doc.getTextWidth(label) + 6;
      if (chipX + chipW > RIGHT_X) {
        chipX = MARGIN_X;
        chipTop += chipH + gap;
      }
      if (ensureSpace(chipH + gap)) {
        // The break reset y to the new page's top — the chip row restarts
        // there too, or this chip would draw at the old (bottom) position
        // and push every later chip onto yet another page.
        chipTop = y;
        chipX = MARGIN_X;
      }
      doc.setFillColor(CHIP);
      doc.roundedRect(chipX, chipTop, chipW, chipH, 3, 3, "F");
      doc.text(label, chipX + 3, chipTop + 4.5);
      chipX += chipW + gap;
      y = chipTop + chipH + gap;
    });
  }

  // ---- Sections (owner's order; entry / list / text) ----
  (cv.sections ?? []).forEach((section) => {
    const items = section.items ?? [];
    if (items.length === 0) return;
    sectionTitle(section.title || "Section");

    items.forEach((item) => {
      if (section.type === "entry") {
        setStyle(11, "bold", TITLE);
        const headingLines = doc.splitTextToSize(
          String(item.heading ?? ""),
          CONTENT_W - 35 // leave room for the right-aligned period
        );
        ensureSpace(headingLines.length * 5.5 + 8);
        const firstLineY = y;
        headingLines.forEach((line) => {
          doc.text(line, MARGIN_X, y);
          y += 5.5;
        });
        if (item.period) {
          setStyle(9, "normal", MUTED);
          doc.text(String(item.period), RIGHT_X, firstLineY, { align: "right" });
        }
        if (item.sub) {
          setStyle(9.5, "italic", ACCENT);
          doc.text(String(item.sub), MARGIN_X, y);
          y += 5;
        }
        if (item.details) {
          setStyle(9.5, "normal", BODY);
          doc.splitTextToSize(String(item.details), CONTENT_W).forEach((line) => {
            ensureSpace(4.8);
            doc.text(line, MARGIN_X, y);
            y += 4.8;
          });
        }
        y += 2.5;
      } else if (section.type === "list") {
        setStyle(10, "normal", BODY);
        {
          const lines = doc.splitTextToSize(String(item.text ?? ""), CONTENT_W - 5);
          ensureSpace(lines.length * 5);
          const bulletY = y;
          doc.setFillColor(ACCENT);
          doc.circle(MARGIN_X + 1, bulletY - 1.3, 0.8, "F");
          lines.forEach((line) => {
            ensureSpace(5);
            doc.text(line, MARGIN_X + 5, y);
            y += 5;
          });
        }
      } else {
        // text section: free-form paragraphs
        if (item.text) drawRich(item.text, 10, BODY);
        y += 1;
      }
    });
    y += 1.5;
  });

  // ---- Footer page numbers ----
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setStyle(8, "normal", MUTED);
    doc.text(`${page} / ${pageCount}`, RIGHT_X, PAGE_H - 8, {
      align: "right",
    });
  }

  return doc;
}
