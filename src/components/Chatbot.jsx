import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";
import { usePortfolio } from "../portfolio/portfolio-context";

// The robot face from the product shot, drawn as SVG: dark navy head, thick
// white outline, teal eyes and smile. Scales to any size — the launcher
// button and the chat header share the one drawing.
const RobotFace = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <line x1="32" y1="9" x2="32" y2="15" stroke="#f9fafb" strokeWidth="3" strokeLinecap="round" />
    <circle cx="32" cy="6.5" r="4" fill="#f9fafb" />
    <rect x="4" y="29" width="7" height="13" rx="3.5" fill="#f9fafb" />
    <rect x="53" y="29" width="7" height="13" rx="3.5" fill="#f9fafb" />
    <rect x="9" y="15" width="46" height="41" rx="13" fill="#0f172a" stroke="#f9fafb" strokeWidth="4.5" />
    <circle cx="25.5" cy="32.5" r="3.4" fill="#2dd4bf" />
    <circle cx="38.5" cy="32.5" r="3.4" fill="#2dd4bf" />
    <path d="M25.5 39.5 Q32 44.5 38.5 39.5" stroke="#2dd4bf" strokeWidth="2.6" strokeLinecap="round" fill="none" />
  </svg>
);

// Rich text in stored content uses **accent** markers; chat bubbles are plain
// text, so strip them.
const plain = (text) => String(text ?? "").replace(/\*\*/g, "");

// The reply engine: keyword intents answered from the LIVE portfolio content
// — whoever is viewing (visitor or owner), the bot speaks their data. Purely
// local, so it costs nothing and works without any external service.
const answerFor = (raw, content) => {
  const q = raw.toLowerCase();
  // `s?` makes plurals match ("skills" hits the "skill" intent) while the
  // leading \b still keeps "hi" out of words like "this".
  const has = (...words) =>
    words.some((word) => new RegExp(`\\b${word}s?\\b`).test(q));

  const brand = content?.brand || "this portfolio";
  const heroSkills = (content?.hero?.skills ?? [])
    .map((skill) => skill.name)
    .filter(Boolean);
  const toolkit = [...new Set([...heroSkills, ...(content?.skills ?? [])])];

  if (has("hi", "hello", "hey", "salam")) {
    return {
      text: `Hey! I'm Robi, the little robot of ${brand}'s site. Ask me about skills, projects, how to get in touch — or tap a chip below.`,
    };
  }

  if (has("cv", "resume")) {
    return {
      text: "The full CV lives on the CV tab — every section, recruiter-ready. You can open it right here:",
      links: [{ label: "Open the CV tab", to: "/cv" }],
    };
  }

  if (has("contact", "email", "hire", "reach", "talk", "message")) {
    const contact = content?.contact;
    return {
      text: plain(contact?.intro) || "Reach out any time — the contact page has every channel.",
      links: contact?.mail
        ? [
            { label: contact.mail.label, href: contact.mail.href, external: true },
            { label: "Go to the contact page", to: "/contact" },
          ]
        : [{ label: "Go to the contact page", to: "/contact" }],
    };
  }

  if (has("project", "work", "built", "portfolio")) {
    const projects = content?.projects ?? [];
    if (projects.length === 0) {
      return {
        text: "No projects are pinned right now — but there is plenty to see. Ask me about skills meanwhile!",
      };
    }
    const titles = projects
      .slice(0, 3)
      .map((project) => `“${project.title}”`)
      .join(", ");
    return {
      text: `${brand} has shipped ${projects.length === 1 ? "a project" : `${projects.length} projects`} — ${titles}. Each one has its own card on the projects page:`,
      links: [{ label: "See all projects", to: "/projects" }],
    };
  }

  if (has("skill", "tech", "stack", "tools", "know")) {
    return {
      text: toolkit.length
        ? `The toolkit: ${toolkit.slice(0, 10).join(", ")}. The skills page arranges the whole picture:`
        : "Skills are still being written — check back soon!",
      links: [{ label: "Open the skills page", to: "/skills" }],
    };
  }

  if (has("about", "who", "introduce", "yourself")) {
    const first = content?.about?.paragraphs?.[0]?.text;
    return {
      text: first
        ? plain(first)
        : `${brand} — a developer who enjoys building clean, modern web apps.`,
      links: [{ label: "Read the full story", to: "/about" }],
    };
  }

  if (has("help", "where", "navigate", "menu", "page")) {
    return {
      text: "Happy to guide you! The site has an intro, About, Skills, Projects and Contact — plus a full CV tab. What would you like to see?",
      links: [
        { label: "About", to: "/about" },
        { label: "Projects", to: "/projects" },
        { label: "CV", to: "/cv" },
      ],
    };
  }

  return {
    text: "Hmm, that one is beyond my little robot brain 🤖 I'm best at skills, projects, the CV and contact details — try one of the chips below!",
  };
};

// The first thing the bot says when a chat is opened.
const greetingFor = (content) => ({
  from: "bot",
  text: `Hi there! 👋 I'm Robi — ask me anything about ${content?.brand || "this portfolio"}: skills, projects, the CV, or how to get in touch.`,
});

const CHIPS = ["Skills", "Projects", "About", "Contact", "CV"];

const Chatbot = () => {
  const { content } = usePortfolio();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const listRef = useRef(null);
  const timerRef = useRef(null);

  // The editors pin a sticky save bar across the bottom — the launcher lifts
  // above it there instead of covering the Save button.
  const raised = pathname === "/edit" || pathname === "/cv/edit";

  // Opening the very first chat greets the visitor once per session.
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([greetingFor(content)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const send = (raw) => {
    const text = raw.trim();
    if (!text || typing) return;
    setInput("");
    setMessages((current) => [...current, { from: "user", text }]);
    setTyping(true);
    // A short pause makes the reply feel considered, not instant-magical.
    timerRef.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        { from: "bot", ...answerFor(text, content) },
      ]);
      setTyping(false);
    }, 650);
  };

  const bubbleClass =
    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed";
  const linkClass =
    "inline-flex cursor-pointer items-center rounded-full border border-sky-400/40 px-2.5 py-1 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/10";

  return (
    <>
      {/* Chat panel — pops from the launcher corner. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            role="dialog"
            aria-label="Chat with Robi, the portfolio assistant"
            className={`fixed right-4 z-50 flex h-[min(85vh,740px)] w-[min(94vw,440px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl md:right-6 ${
              raised
                ? "bottom-44 max-h-[calc(100dvh-12rem)]"
                : "bottom-24 max-h-[calc(100dvh-8rem)]"
            }`}
          >
            {/* Header */}
            <header className="flex items-center gap-3 border-b border-white/10 bg-gray-800 px-4 py-3">
              <RobotFace size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  Robi
                </p>
                <p className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  online — answers instantly
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Messages */}
            <div
              ref={listRef}
              aria-live="polite"
              className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
            >
              {messages.map((message, index) =>
                message.from === "user" ? (
                  <div
                    key={index}
                    className={`${bubbleClass} self-end rounded-br-sm bg-sky-500 font-medium text-white`}
                  >
                    {message.text}
                  </div>
                ) : (
                  <div
                    key={index}
                    className={`${bubbleClass} flex flex-col items-start gap-2 self-start rounded-bl-sm border border-white/5 bg-gray-800 text-gray-200`}
                  >
                    <span>{message.text}</span>
                    {message.links?.length > 0 && (
                      <span className="flex flex-wrap gap-1.5">
                        {message.links.map((link) =>
                          link.external ? (
                            <a
                              key={link.label}
                              href={link.href}
                              target="_blank"
                              rel="noreferrer"
                              className={linkClass}
                            >
                              {link.label}
                            </a>
                          ) : (
                            <Link
                              key={link.label}
                              to={link.to}
                              onClick={() => setOpen(false)}
                              className={linkClass}
                            >
                              {link.label}
                            </Link>
                          )
                        )}
                      </span>
                    )}
                  </div>
                )
              )}
              {typing && (
                <div className="flex items-center gap-1.5 self-start rounded-2xl rounded-bl-sm border border-white/5 bg-gray-800 px-3.5 py-3">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      style={{ animationDelay: `${delay}ms` }}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-400"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick questions */}
            <div className="flex gap-1.5 overflow-x-auto border-t border-white/10 px-3 py-2">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => send(chip)}
                  className="shrink-0 cursor-pointer rounded-full border border-white/10 bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300 transition-colors hover:border-teal-400/50 hover:text-teal-300"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Composer */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-white/10 bg-gray-800 px-3 py-2.5"
            >
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
                placeholder="Ask about skills, projects…"
                aria-label="Your message"
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-gray-900/70 px-3.5 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-teal-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                aria-label="Send message"
                className="shrink-0 cursor-pointer rounded-full bg-teal-500 p-2 text-gray-900 shadow-lg shadow-teal-500/25 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher — the robot itself, bottom-right on every page. */}
      <motion.button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close chat" : "Open chat with Robi"}
        animate={open ? { rotate: 8, scale: 0.94 } : { rotate: 0, scale: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={`fixed right-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-gray-900 shadow-2xl shadow-black/40 md:right-6 ${
          raised ? "bottom-24" : "bottom-5"
        }`}
      >
        <RobotFace size={38} />
        {/* Attention dot — disappears once the visitor has opened the chat. */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-400" />
          </span>
        )}
      </motion.button>
    </>
  );
};

export default Chatbot;
