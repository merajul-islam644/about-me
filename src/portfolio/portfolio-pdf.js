import { jsPDF } from "jspdf";

// Builds a light, print-ready A4 PDF of the portfolio with jsPDF. Deliberately
// a document (crisp selectable text), not a screenshot of the dark app — this
// is the version you attach to an email or print. Accent spans (`**…**`)
// render in the sky accent color, as on the site.

const ACCENT = "#0284c7"; // sky-600
const BODY = "#374151"; // gray-700
const MUTED = "#6b7280"; // gray-500
const TITLE = "#111827"; // gray-900
const LINE = "#e5e7eb"; // gray-200

const PAGE_H = 297;
const MARGIN_X = 18;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 18;
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

export function buildPortfolioPdf(content, pictureDataUrl) {
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
    }
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
      if (x + wordW > 210 - MARGIN_X && x > MARGIN_X) {
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
    doc.text(label.toUpperCase(), MARGIN_X, y);
    y += 2.5;
    doc.setDrawColor(LINE);
    doc.line(MARGIN_X, y, 210 - MARGIN_X, y);
    y += 6;
  };

  const brand = content?.brand || "Portfolio";
  const hero = content?.hero ?? {};
  const bio = hero.bio ?? { text: "", accentClass: "" };
  const contact = content?.contact ?? {};

  // ---- Header ----
  setStyle(24, "bold", TITLE);
  doc.text(brand, MARGIN_X, y + 8);
  if (pictureDataUrl) {
    try {
      doc.addImage(pictureDataUrl, 210 - MARGIN_X - 26, MARGIN_TOP - 6, 26, 26);
      doc.setDrawColor(ACCENT);
      doc.setLineWidth(0.5);
      doc.rect(210 - MARGIN_X - 26, MARGIN_TOP - 6, 26, 26);
    } catch {
      // jsPDF only decodes PNG/JPEG reliably — skip the photo otherwise.
    }
  }
  y += 14;
  setStyle(12, "normal", MUTED);
  doc.text(hero.title ?? "", MARGIN_X, y);
  y += 6;
  setStyle(9, "normal", ACCENT);
  let linkX = MARGIN_X;
  [contact.mail, contact.github, contact.linkedin].forEach((link) => {
    const label = link?.label ?? "";
    if (!label) return;
    doc.textWithLink(label, linkX, y, { url: link?.href || "#" });
    linkX += doc.getTextWidth(label) + 5;
  });
  y += 3;
  doc.setDrawColor(LINE);
  doc.line(MARGIN_X, y, 210 - MARGIN_X, y);
  y += 4;

  // ---- Intro ----
  if (bio.text) drawRich(bio.text, 10.5, BODY);

  // ---- About ----
  const paragraphs = content?.about?.paragraphs ?? [];
  if (paragraphs.length > 0) {
    sectionTitle("About Me");
    paragraphs.forEach((paragraph) => drawRich(paragraph.text, 10, BODY));
  }

  // ---- Skills ----
  const skills = content?.skills ?? [];
  if (skills.length > 0) {
    sectionTitle("Skills");
    setStyle(9.5, "bold", BODY);
    const chipH = 6.5;
    const gap = 2.5;
    let chipX = MARGIN_X;
    let chipTop = y;
    skills.forEach((skill) => {
      const chipW = doc.getTextWidth(String(skill)) + 6;
      if (chipX + chipW > 210 - MARGIN_X) {
        chipX = MARGIN_X;
        chipTop += chipH + gap;
      }
      ensureSpace(chipH + gap);
      doc.setFillColor("#f1f5f9");
      doc.roundedRect(chipX, chipTop, chipW, chipH, 3, 3, "F");
      doc.text(String(skill), chipX + 3, chipTop + 4.5);
      chipX += chipW + gap;
      y = chipTop + chipH + gap;
    });
  }

  // ---- Projects ----
  const projects = content?.projects ?? [];
  if (projects.length > 0) {
    sectionTitle("Projects");
    projects.forEach((project, index) => {
      ensureSpace(20);
      if (index > 0) y += 2;
      setStyle(11, "bold", TITLE);
      doc.splitTextToSize(String(project.title), CONTENT_W).forEach((line) => {
        ensureSpace(5.5);
        doc.text(line, MARGIN_X, y);
        y += 5.5;
      });
      if (project.desc) {
        setStyle(9.5, "normal", BODY);
        doc.splitTextToSize(String(project.desc), CONTENT_W).forEach((line) => {
          ensureSpace(4.8);
          doc.text(line, MARGIN_X, y);
          y += 4.8;
        });
      }
      setStyle(9, "normal", ACCENT);
      let linkX_ = MARGIN_X;
      [
        ["GitHub", project.github],
        ["Live Demo", project.live],
      ].forEach(([label, href]) => {
        if (!href || href === "#") return;
        doc.textWithLink(label, linkX_, y, { url: href });
        linkX_ += doc.getTextWidth(label) + 6;
      });
      y += 5;
    });
  }

  // ---- Contact ----
  if (contact.intro) {
    sectionTitle("Contact");
    drawRich(contact.intro, 10, BODY);
    setStyle(9.5, "normal", ACCENT);
    let contactY = y + 1;
    [contact.mail, contact.github, contact.linkedin, ...(contact.extras ?? [])]
      .filter((link) => link?.label)
      .forEach((link) => {
        ensureSpace(5);
        doc.textWithLink(link.label, MARGIN_X, contactY, { url: link.href || "#" });
        contactY += 5;
      });
    y = contactY;
  }

  // ---- Footer page numbers ----
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setStyle(8, "normal", MUTED);
    doc.text(`${page} / ${pageCount}`, 210 - MARGIN_X, PAGE_H - 8, {
      align: "right",
    });
  }

  return doc;
}
