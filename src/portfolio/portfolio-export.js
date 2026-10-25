// Builds a downloadable, self-contained portfolio.html from a user's content.
// The markup mirrors the app's five views with the same Tailwind classes;
// styling resolves at open time via the Tailwind v4 browser build (one CDN
// script), so the file needs internet on first open. The profile picture is
// embedded as a data URL by the caller — the file itself carries no requests.

import visitorAvatar from "../assets/visitor-avatar.jpg";

// Lucide icon paths (mail, github, linkedin, link) so the exported buttons
// match the app without shipping a library.
const ICONS = {
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  github:
    '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  linkedin:
    '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  link: '<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/>',
};

const icon = (name) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

// `**accent**` markers → <span> with the field's accent class, same rule as
// the app's AccentText component.
const accentHtml = (text, accentClass) =>
  escapeHtml(text).replace(
    /\*\*(.+?)\*\*/g,
    (_, inner) => `<span class="${escapeHtml(accentClass)}">${inner}</span>`
  );

const slug = (value) =>
  String(value || "portfolio")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "portfolio";

const NAV_LINKS = [
  ["Intro", "#intro"],
  ["About", "#about"],
  ["Skills", "#skills"],
  ["Projects", "#projects"],
  ["Contact", "#contact"],
];

const NAV_ITEMS = NAV_LINKS.map(
  ([label, href]) =>
    `<li><a href="${href}" class="cursor-pointer hover:text-sky-300 text-gray-500">${label}</a></li>`
).join("");

// The avatar blocks: embedded picture, or initials on a sky disc when the
// picture could not be fetched at export time. Intro shows a circle, About a
// rounded square — same as the app.
const avatarHtml = (pictureDataUrl, brand, shape) => {
  const shapeClass =
    shape === "square"
      ? "rounded-xl border-sky-500"
      : "rounded-full border-sky-400";
  return pictureDataUrl
    ? `<img src="${pictureDataUrl}" alt="${escapeHtml(brand)}" class="w-full h-full object-cover border-4 ${shapeClass} shadow-lg"/>`
    : `<div class="w-full h-full border-4 ${shapeClass} shadow-lg bg-sky-500/20 flex items-center justify-center text-4xl font-bold text-sky-300">${escapeHtml((brand || "?").charAt(0).toUpperCase())}</div>`;
};

const contactButton = (iconName, href, label, hoverClass) => `
        <a href="${escapeHtml(href)}"
          class="flex items-center gap-2 text-gray-200 font-medium bg-gray-700 px-6 py-3 rounded-full shadow-md ${hoverClass} transition-colors duration-300">
          ${icon(iconName)}
          ${escapeHtml(label)}
        </a>`;

export function buildPortfolioHtml(content, pictureDataUrl) {
  const brand = content?.brand || "Portfolio";
  const hero = content?.hero ?? {};
  const bio = hero.bio ?? { text: "", accentClass: "" };
  const about = content?.about ?? { paragraphs: [] };
  const skills = content?.skills ?? [];
  const projects = content?.projects ?? [];
  const contact = content?.contact ?? {};
  const extras = contact.extras ?? [];

  const heroBadges = (hero.skills ?? [])
    .map(
      (skill) =>
        `<span class="${escapeHtml(skill.color)} text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium">${escapeHtml(skill.name)}</span>`
    )
    .join("");

  const aboutParagraphs = (about.paragraphs ?? [])
    .map(
      (paragraph, index) =>
        `<p class="${index === 0 ? "text-gray-300 text-lg leading-relaxed" : "text-gray-400 text-base"}">${accentHtml(paragraph.text, paragraph.accentClass)}</p>`
    )
    .join("");

  const skillChips = skills
    .map(
      (skill) =>
        `<span class="bg-gray-700 px-6 py-3 rounded-full shadow cursor-default hover:bg-sky-500 transition-all duration-300 text-white font-medium">${escapeHtml(skill)}</span>`
    )
    .join("");

  const projectCards = projects
    .map(
      (project) => `
          <div class="bg-gray-700 rounded-xl shadow-lg p-6 w-72 flex flex-col justify-between">
            <div>
              <h3 class="text-2xl font-semibold mb-2 text-white">${escapeHtml(project.title)}</h3>
              <p class="text-gray-300 mb-4">${escapeHtml(project.desc)}</p>
            </div>
            <div class="flex gap-4 justify-center mt-4">
              <a href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer" class="text-sky-400 font-semibold hover:underline">GitHub</a>
              <a href="${escapeHtml(project.live)}" target="_blank" rel="noopener noreferrer" class="text-sky-400 font-semibold hover:underline">Live Demo</a>
            </div>
          </div>`
    )
    .join("");

  const projectsBody =
    projects.length === 0
      ? `
          <div class="flex flex-col items-center gap-3 text-center bg-gray-700/40 border border-dashed border-white/15 rounded-2xl px-10 py-12 max-w-md">
            <p class="text-lg font-semibold text-gray-200">No projects yet</p>
            <p class="text-sm text-gray-400">Projects will appear here once the owner adds them.</p>
          </div>`
      : `<div class="flex flex-wrap justify-center gap-8">${projectCards}</div>`;

  const linkButtons = [
    contactButton("mail", contact?.mail?.href ?? "#", contact?.mail?.label ?? "", "hover:bg-sky-500"),
    contactButton("github", contact?.github?.href ?? "#", contact?.github?.label ?? "", "hover:bg-indigo-500"),
    contactButton("linkedin", contact?.linkedin?.href ?? "#", contact?.linkedin?.label ?? "", "hover:bg-blue-500"),
    ...extras.map((extra) =>
      contactButton("link", extra.href, extra.label, "hover:bg-emerald-500")
    ),
  ].join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(brand)} — Portfolio</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    html { scroll-behavior: smooth; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
    .fade-up { animation: fadeUp .7s ease both; }
    .d1 { animation-delay: .15s; } .d2 { animation-delay: .3s; } .d3 { animation-delay: .45s; }
  </style>
</head>
<body class="bg-gray-800">
  <nav class="bg-gray-800 sticky top-0 z-50 shadow-md">
    <div class="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
      <h2 class="text-2xl font-bold text-sky-400">${escapeHtml(brand)}</h2>
      <ul class="hidden md:flex gap-6 items-center">${NAV_ITEMS}</ul>
    </div>
    <ul class="md:hidden flex flex-wrap gap-x-4 gap-y-1 px-6 pb-3">${NAV_ITEMS}</ul>
  </nav>

  <section id="intro" class="min-h-[calc(100vh-64px)] flex flex-col md:flex-row items-center justify-center p-6 md:p-10 bg-gray-800 gap-8">
    <div class="fade-up flex flex-col items-center gap-3">
      <div class="w-36 h-36 md:w-48 md:h-48">${avatarHtml(pictureDataUrl, brand)}</div>
    </div>
    <div class="fade-up d1 text-center md:text-left max-w-md flex flex-col gap-4">
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white">${escapeHtml(hero.greeting ?? "")}</h1>
      <h2 class="text-xl sm:text-2xl text-sky-300 font-semibold">${escapeHtml(hero.title ?? "")}</h2>
      <p class="text-base sm:text-lg text-gray-300">${accentHtml(bio.text, bio.accentClass)}</p>
      <div class="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">${heroBadges}</div>
    </div>
  </section>

  <section id="about" class="min-h-[calc(100vh-64px)] flex flex-col md:flex-row items-center justify-center p-6 md:p-10 bg-gray-900 gap-8 md:gap-12">
    <div class="fade-up w-48 h-48 md:w-64 md:h-64 shrink-0">${avatarHtml(pictureDataUrl, brand, "square")}</div>
    <div class="fade-up d1 max-w-xl text-center md:text-left flex flex-col gap-4">
      <h2 class="text-4xl font-bold mb-4 text-sky-400">About Me</h2>
      ${aboutParagraphs}
    </div>
  </section>

  <section id="skills" class="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center bg-gray-900 px-6">
    <h2 class="fade-up text-4xl font-bold mb-10 text-sky-400">Skills</h2>
    <div class="fade-up d1 flex flex-wrap justify-center items-center gap-6">${skillChips}</div>
  </section>

  <section id="projects" class="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center bg-gray-800 px-6 py-10">
    <h2 class="fade-up text-4xl font-bold mb-10 text-sky-400 text-center">Projects</h2>
    ${projectsBody}
  </section>

  <section id="contact" class="min-h-[calc(100vh-64px)] flex justify-center items-center bg-linear-to-br from-sky-900 to-pink-900 px-6 py-8">
    <div class="fade-up max-w-lg w-full bg-gray-800 rounded-3xl shadow-2xl p-10">
      <h2 class="text-4xl font-bold text-sky-400 mb-6 text-center">Get in Touch</h2>
      <p class="text-gray-300 text-lg mb-8 text-center">${escapeHtml(contact?.intro ?? "")}</p>
      <div class="flex flex-col gap-4 items-center mb-6">${linkButtons}</div>
      <div class="text-center">
        <a href="${escapeHtml(contact?.mail?.href ?? "#")}" class="inline-block bg-linear-to-r from-sky-500 to-pink-500 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300">Send Email</a>
      </div>
    </div>
  </section>
</body>
</html>`;
}

// Fetches an image URL (pre-signed storage link or bundled asset) and returns
// it as a data URL for embedding. Returns null when it cannot be fetched —
// the template then falls back to an initials avatar.
export async function toDataUrl(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// The bundled cartoon avatar as a data URL — every PDF's default face when
// nobody uploaded a picture, since the pages themselves fall back to the
// same asset. Null-safe: toDataUrl already swallows its own failures.
export async function defaultPictureDataUrl() {
  return toDataUrl(visitorAvatar);
}

export const exportFileName = (content) =>
  `${slug(content?.brand)}-portfolio.html`;

export const exportPdfFileName = (content) =>
  `${slug(content?.brand)}-portfolio.pdf`;
