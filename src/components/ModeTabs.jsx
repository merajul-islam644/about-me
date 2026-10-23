import { Link, useLocation } from "react-router-dom";
import { getMode, MODES } from "../modes";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";

// The landing switcher: pick what you're building today. Portfolio is the
// live showcase; CV opens its own workspace. Active state follows the URL
// through getMode — which reads ?returnTo on /login, so the strip agrees
// with the navbar about which mode the login page is wearing. Everyone
// sees it — visitors flip between the showcases, and the signed-in owner
// too (the navbar menus stay as the second way across). One label bends
// per audience: signed-in invited users (viewers) and guest-link holders
// read "My CV" — it's their reading room, not a builder — while the owner
// and plain signed-out visitors see "CV Builder".
export const ModeTabs = () => {
  const { pathname, search } = useLocation();
  const { status, canEdit } = useAuth();
  const { guest } = usePortfolio();
  const viewer = status === "authenticated" && !canEdit;
  const current = getMode(pathname, search);
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-gray-900/70 p-1">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = mode.key === current.key;
        const label = mode.key === "cv" && (viewer || guest) ? "My CV" : mode.label;
        return (
          <Link
            key={mode.key}
            to={mode.to}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active ? "bg-sky-500 text-white" : "text-gray-300 hover:text-sky-300"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </Link>
        );
      })}
    </div>
  );
};

export default ModeTabs;
