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
    label: "CV Builder",
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

// The navbar is fully mode-native. Portfolio mode ends with the CV shelf —
// the one owner destination in the bar (the portfolio shelf and portfolio
// editor live on at their URLs, /library and /edit, but no longer sit in
// the menu). CV mode is the owner's workspace: its menu carries My CV plus
// the Job Alerts dashboard. Signed-out visitors clicking it
// are sent to login first.
export const getMenuForMode = (modeKey) =>
  modeKey === "cv"
    ? [
        { name: "My CV", to: "/cv/library" },
        { name: "Job Alerts", to: "/cv/jobs" },
      ]
    : [
        { name: "Intro", to: "/" },
        { name: "About", to: "/about" },
        { name: "Skills", to: "/skills" },
        { name: "Projects", to: "/projects" },
        { name: "Contact", to: "/contact" },
        { name: "My CV", to: "/cv/library" },
      ];
