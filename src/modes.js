import { FileText, LayoutGrid } from "lucide-react";

// The two building modes. `match` decides which mode a URL belongs to, so
// the tab strip and the navbar menu always agree — the mode is derived from
// the URL alone, never from shared component state.
export const MODES = [
  {
    key: "portfolio",
    label: "Portfolio",
    to: "/",
    icon: LayoutGrid,
    match: (path) => !path.startsWith("/cv"),
  },
  {
    key: "cv",
    label: "CV",
    to: "/cv",
    icon: FileText,
    match: (path) => path.startsWith("/cv"),
  },
];

// The login page adopts the mode of the page the visitor is trying to reach,
// so after "CV tab → bounced to login" the bar still reads like CV mode.
export const getMode = (pathname, search = "") => {
  if (pathname === "/login") {
    const returnTo = new URLSearchParams(search).get("returnTo") ?? "";
    if (returnTo.startsWith("/cv")) return MODES[1];
  }
  return MODES.find((mode) => mode.match(pathname)) ?? MODES[0];
};

// The navbar is fully mode-native: in CV mode every menu opens the CV
// counterpart of that page (/cv/…), in portfolio mode the portfolio pages.
// Each menu ends with that mode's owner destinations — its shelf (every
// saved portfolio, or every saved CV, in one list) and its editor.
// Signed-out visitors clicking any of them are sent to login first.
export const getMenuForMode = (modeKey) =>
  modeKey === "cv"
    ? [
        { name: "Intro", to: "/cv" },
        { name: "About", to: "/cv/about" },
        { name: "Skills", to: "/cv/skills" },
        { name: "Projects", to: "/cv/projects" },
        { name: "Contact", to: "/cv/contact" },
        { name: "My CV", to: "/cv/library" },
        { name: "Edit CV", to: "/cv/edit" },
      ]
    : [
        { name: "Intro", to: "/" },
        { name: "About", to: "/about" },
        { name: "Skills", to: "/skills" },
        { name: "Projects", to: "/projects" },
        { name: "Contact", to: "/contact" },
        { name: "My portfolio", to: "/library" },
        { name: "Edit portfolio", to: "/edit" },
      ];
