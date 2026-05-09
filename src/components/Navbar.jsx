import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Home", to: "/" },
    { name: "About", to: "/about" },
    { name: "Skills", to: "/skills" },
    { name: "Projects", to: "/projects" },
    { name: "Contact", to: "/contact" },
  ];

  return (
    <nav className="bg-gray-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
        <h2 className="text-2xl font-bold text-sky-400">Merajul</h2>

        <ul className="hidden md:flex gap-6">
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
        </div>
      )}
    </nav>
  );
};

export default Navbar;
