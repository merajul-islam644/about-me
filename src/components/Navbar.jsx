import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import visitorAvatar from "../assets/visitor-avatar.jpg";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";
import { useProfilePicture } from "../portfolio/useProfilePicture";

const Navbar = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { status, claims, profile, logout } = useAuth();
  // The brand comes from the signed-in user's content; signed-out visitors
  // see the site default, exactly as before.
  const { content } = usePortfolio();
  // Everyone starts on the cartoon avatar — signed-in or visitor — until
  // this user uploads their own picture.
  const { url } = useProfilePicture(profile?.userId);
  const picture = url ?? visitorAvatar;

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    claims?.email?.split("@")[0] ||
    "Signed in";
  const email = claims?.email || profile?.email || "";

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
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

  const links = [
    { name: "Intro", to: "/" },
    { name: "About", to: "/about" },
    { name: "Skills", to: "/skills" },
    { name: "Projects", to: "/projects" },
    { name: "Contact", to: "/contact" },
    // Editing lives on its own page — the six view pages stay pure display.
    // Everyone sees the link: signed-out visitors are sent to login (or
    // signup) first, then land straight in the editor.
    { name: "Edit portfolio", to: "/edit" },
  ];

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
                  smooth={true}
                  offset={-80}
                  duration={600}
                  className={`cursor-pointer hover:text-sky-300 text-gray-500
                  ${location.pathname === link.to && "text-sky-300"}`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            {status !== "authenticated" && (
              <li>
                <Link
                  to="/login"
                  className="cursor-pointer px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </li>
            )}
          </ul>

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
                  className="h-8 w-8 rounded-full border-2 border-sky-400 object-cover"
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
              smooth={true}
              offset={-80}
              duration={600}
              className="cursor-pointer text-gray-300 hover:text-sky-300 text-lg"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          {status !== "authenticated" && (
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
