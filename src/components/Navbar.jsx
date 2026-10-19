import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";

const Navbar = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false);
  const { status, claims, logout } = useAuth();
  // The brand comes from the signed-in user's content; signed-out visitors
  // see the site default, exactly as before.
  const { content } = usePortfolio();

  const handleLogout = async () => {
    await logout();
  };

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
          <li>
            {status === "authenticated" ? (
              <button
                onClick={handleLogout}
                title={claims?.email || "Signed in"}
                className="cursor-pointer px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/login"
                className="cursor-pointer px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors"
              >
                Sign in
              </Link>
            )}
          </li>
        </ul>

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
          {status === "authenticated" ? (
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              title={claims?.email || "Signed in"}
              className="cursor-pointer text-left text-sky-300 hover:text-sky-200 text-lg"
            >
              Sign out
            </button>
          ) : (
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
