import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, User } from "lucide-react";
import visitorAvatar from "../assets/visitor-avatar.jpg";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";
import { useProfilePicture } from "../portfolio/useProfilePicture";
import { getMenuForMode, getMenuForGuest, getMode } from "../modes";
import { clearGuestToken } from "../lib/blocks/invites";
import { NotificationBell } from "./NotificationBell";

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { status, claims, profile, logout, canEdit } = useAuth();
  // A signed-in user without the editor role is a viewer: the notification
  // bell and the owner destinations (My CV, Job Alerts) are owner/visitor
  // chrome, not theirs.
  const viewer = status === "authenticated" && !canEdit;
  // The brand comes from the signed-in user's content; signed-out visitors
  // see the site default, exactly as before.
  const { content, guest } = usePortfolio();
  // Everyone starts on the cartoon avatar — signed-in or visitor — until
  // this user uploads their own picture.
  const { url, pending: picPending } = useProfilePicture(
    profile?.userId,
    status !== "unauthenticated" && !profile,
  );
  const picture = url ?? visitorAvatar;

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    claims?.email?.split("@")[0] ||
    "Signed in";
  const email = claims?.email || profile?.email || "";

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    // Signing out ends every persona the browser was wearing — including
    // the guest one. A leftover invite token would otherwise re-boot the
    // next page load as that guest with no visible way back in, since the
    // guest chrome hides the Sign in button.
    clearGuestToken();
    // Wherever they signed out from, the signed-out journey starts at the
    // public intro showcase — replace, so Back never revisits a signed-in
    // view wearing visitor clothes.
    navigate("/", { replace: true });
  };

  // Close the avatar dropdown on any click outside it, and on navigation.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [menuOpen]);

  // The menu follows the building mode: showcase pages while browsing the
  // portfolio, the CV workspace while on /cv — the landing tab switch drives
  // it (menus live in src/modes.js). The search string matters on /login,
  // which adopts the mode of the page its returnTo is heading to.
  // Guests trade the whole mode machine for the content tour: no owner
  // destinations, no Job Alerts — My CV reads the CV itself.
  const links = guest
    ? getMenuForGuest()
    : getMenuForMode(getMode(location.pathname, location.search).key)
        .filter((link) => !viewer || !["/cv/library", "/cv/jobs"].includes(link.to));

  // On the login page the visitor is "heading to" their returnTo — keep the
  // menu they clicked highlighted (My CV vs Edit portfolio stays visibly
  // selected, so the redirect reads as a continuation, not a dead end).
  const highlightPath =
    location.pathname === "/login"
      ? new URLSearchParams(location.search).get("returnTo") ?? location.pathname
      : location.pathname;

  return (
    <nav className="bg-gray-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
        <h2 className="text-2xl font-bold text-sky-400">
          {content?.brand ?? "Merajul"}
        </h2>

        <div className="flex items-center gap-3">
          <ul className="hidden md:flex gap-6 items-center">
            {links.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.to}
                  className={`cursor-pointer hover:text-sky-300 text-gray-500
                  ${highlightPath === link.to && "text-sky-300"}`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* The bell sits just left of the account area — the avatar when
              signed in, the Sign in button for visitors. Viewers and guests
              don't get it: neither holds an account to notify. */}
          {!viewer && !guest && <NotificationBell />}

          {/* Visitors: Sign in sits right of the bell, mirroring where the
              avatar hangs for signed-in users. Guests never see it — the
              link IS their way in. */}
          {status !== "authenticated" && !guest && (
            <Link
              to="/login"
              className="cursor-pointer px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors"
            >
              Sign in
            </Link>
          )}

          {/* Signed in: the avatar IS the account menu — name, email and
              sign out live in its dropdown instead of sitting on the bar. */}
          {status === "authenticated" && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title={email || "Signed in"}
                className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 p-1 pr-1.5 transition-colors hover:border-sky-400/50"
              >
                <img
                  src={picture}
                  alt="Profile"
                  className={`h-8 w-8 rounded-full border-2 border-sky-400 object-cover ${picPending ? "scale-110 blur-md opacity-60 animate-pulse" : ""}`}
                />
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-white/10 bg-gray-900 p-2 shadow-xl">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold text-gray-100">
                      {displayName}
                    </p>
                    {email && (
                      <p className="truncate text-xs text-gray-400">{email}</p>
                    )}
                  </div>
                  <div className="my-1 h-px bg-white/10" />
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-white/5 hover:text-sky-300"
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-white/5"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 focus:outline-none"
            >
              {isOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-gray-800 px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              className="cursor-pointer text-gray-300 hover:text-sky-300 text-lg"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          {status !== "authenticated" && !guest && (
            <Link
              to="/login"
              className="cursor-pointer text-sky-300 hover:text-sky-200 text-lg"
              onClick={() => setIsOpen(false)}
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
