import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ClipboardCopy,
  Compass,
  Copy,
  FileDown,
  FileText,
  History,
  Library,
  Loader2,
  MoreVertical,
  PenLine,
  Pencil,
  Plus,
  Puzzle,
  Send,
  Settings,
  Share2,
  Sparkles,
  Target,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { usePortfolio } from "../portfolio/portfolio-context";
import { useAuth } from "../auth/auth-context";
import { useProfilePicture } from "../portfolio/useProfilePicture";
import { toDataUrl } from "../portfolio/portfolio-export";
import { createFreshCv, getActiveCv, newId, normalizeContent } from "../content/portfolioShape";
import {
  BUILT_IN_BRAIN,
  PROVIDERS,
  SKILL_REGISTRY,
  callBuiltInBrain,
  callGateway,
  loadPuter,
  providerMeta,
  toolProgress,
} from "./chat/gateway";

// The robot face from the product shot, drawn as SVG: dark navy head, thick
// white outline, teal eyes and smile. Scales to any size — the launcher
// button and the chat header share the one drawing.
const RobotFace = ({ size = 44 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
  >
    <line
      x1="32"
      y1="9"
      x2="32"
      y2="15"
      stroke="#f9fafb"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="32" cy="6.5" r="4" fill="#f9fafb" />
    <rect x="4" y="29" width="7" height="13" rx="3.5" fill="#f9fafb" />
    <rect x="53" y="29" width="7" height="13" rx="3.5" fill="#f9fafb" />
    <rect
      x="9"
      y="15"
      width="46"
      height="41"
      rx="13"
      fill="#0f172a"
      stroke="#f9fafb"
      strokeWidth="4.5"
    />
    <circle cx="25.5" cy="32.5" r="3.4" fill="#2dd4bf" />
    <circle cx="38.5" cy="32.5" r="3.4" fill="#2dd4bf" />
    <path
      d="M25.5 39.5 Q32 44.5 38.5 39.5"
      stroke="#2dd4bf"
      strokeWidth="2.6"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// Model output may carry markdown accents; chat bubbles are plain text, so
// strip the emphasis markers.
const plain = (text) => String(text ?? "").replace(/\*\*/g, "");

// Chat sessions, preferences and the gateway config are a per-viewer
// convenience on this device only — localStorage is right for that, and
// every touch is guarded because storage can be blocked or cleared at any
// time.
const STORAGE = {
  sessions: "robi.chat.sessions",
  settings: "robi.chat.settings",
  gateway: "robi.chat.gateway",
  skills: "robi.chat.skills",
  free: "robi.chat.freeUse",
};
const MAX_SESSIONS = 20;
const MAX_MESSAGES = 100;

// The built-in free brain is free but not infinite: a per-device daily
// allowance keeps casual chatting covered while making heavy funnels
// someone else's gateway problem. Only the built-in brain counts — a
// configured AI Gateway rides the owner's own quota and stays unlimited.
// Per device (localStorage), so it soft-caps honest visitors rather than
// defending against a cleared store.
const FREE_DAILY_LIMIT = 20;
const todayKey = () => new Date().toISOString().slice(0, 10);

// Today's count, or a fresh one the moment the stored date goes stale.
const readFreeUse = () => {
  const stored = loadStored(STORAGE.free, null);
  return stored?.date === todayKey() ? stored : { date: todayKey(), count: 0 };
};

// Every skill Robi can be given, straight from the gateway's registry, and
// the icon each card wears in the Skills panel.
const ALL_SKILL_NAMES = SKILL_REGISTRY.map((skill) => skill.name);
const SKILL_ICONS = {
  download_cv: FileDown,
  copy_email: ClipboardCopy,
  jump_to_page: Compass,
  count_library: Library,
  share_page_link: Share2,
  write_cv: PenLine,
  ask_cv: BookOpen,
  summarize_cv: FileText,
  analyze_fit: Target,
};

// The pages Page Jumper may open — the public showcase routes from App.jsx,
// named exactly as the navbar labels them (src/modes.js), so the bot's words
// match the menus the visitor actually sees. `keys` are the loose names the
// model might send instead of a path.
const CHAT_PAGES = [
  { path: "/", name: "Intro", keys: ["intro", "home"] },
  { path: "/about", name: "About", keys: ["about"] },
  { path: "/skills", name: "Skills", keys: ["skills"] },
  { path: "/projects", name: "Projects", keys: ["projects"] },
  { path: "/contact", name: "Contact", keys: ["contact"] },
  { path: "/cv", name: "CV", keys: ["cv", "cv intro", "cv home"] },
];

// A compact plain-text rendering of the active CV — the grounding the
// reading skills (ask_cv, summarize_cv, analyze_fit) hand the model. Facts
// only, tightly capped; the model composes its own prose around them.
const cvDigest = (content) => {
  const cv = getActiveCv(content);
  if (!cv) return "";
  const lines = [`CV: ${cv.name || cv.title || "Untitled"}`];
  for (const [field, label] of [
    ["greeting", "Greeting"],
    ["title", "Headline"],
    ["bioText", "Bio"],
  ]) {
    if (cv[field]) lines.push(`${label}: ${String(cv[field]).slice(0, 300)}`);
  }
  const skills = (cv.skills ?? [])
    .map((skill) => skill?.name ?? skill)
    .filter(Boolean);
  if (skills.length) lines.push(`Skills: ${skills.join(", ")}`);
  for (const section of cv.sections ?? []) {
    lines.push(`\n[${section.title || "Section"}]`);
    for (const item of section.items ?? []) {
      const bits = [
        item?.heading,
        item?.sub,
        item?.period,
        item?.details ?? item?.text,
      ]
        .filter(Boolean)
        .map((bit) => String(bit));
      if (bits.length) lines.push(`- ${bits.join(" | ").slice(0, 400)}`);
    }
  }
  return lines.join("\n").slice(0, 4000);
};

const loadStored = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode, quota, cleared site data — the chat works without it */
  }
};

const whenLabel = (at) => {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return new Date(at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const sessionTitle = (session) =>
  session.messages.find((message) => message.from === "user")?.text ||
  "Quick chat";

// Small labeled switch used by the settings view.
const Toggle = ({ label, hint, on, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={() => onChange(!on)}
    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
  >
    <span className="min-w-0">
      <span className="block text-sm font-medium text-gray-200">{label}</span>
      <span className="block text-xs text-gray-500">{hint}</span>
    </span>
    <span
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        on ? "bg-teal-500" : "bg-gray-600"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          on ? "translate-x-4" : ""
        }`}
      />
    </span>
  </button>
);

// Past conversations, newest first — tapping one brings it back as the
// current chat.
const HistoryView = ({ sessions, onRestore, onClear, onBack }) => (
  <div className="flex flex-1 flex-col overflow-hidden">
    <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to chat
      </button>
      {sessions.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear all
        </button>
      )}
    </div>
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
      {sessions.length === 0 && (
        <p className="px-1 py-6 text-center text-sm text-gray-500">
          No past sessions yet — chat a little, then press{" "}
          <span className="text-gray-300">+</span> and the conversation will be
          kept here.
        </p>
      )}
      {sessions.map((session) => (
        <button
          key={session.id}
          type="button"
          onClick={() => onRestore(session)}
          className="w-full cursor-pointer rounded-xl border border-white/5 bg-gray-800 px-3.5 py-2.5 text-left transition-colors hover:border-teal-400/40"
        >
          <p className="truncate text-sm font-medium text-gray-200">
            {sessionTitle(session)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {whenLabel(session.at)} ·{" "}
            {
              session.messages.filter((message) => message.from === "user")
                .length
            }{" "}
            messages
          </p>
        </button>
      ))}
    </div>
  </div>
);

// One labelled field of the gateway form.
const GatewayField = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold text-gray-300">
      {label}
    </span>
    {children}
    {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
  </label>
);

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-gray-900/70 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-teal-400 focus:outline-none";

// The AI Gateway form: point Robi at any Anthropic- or OpenAI-compatible
// gateway and he answers through that model instead of his built-in free
// brain. The draft lives here (Save/Test work on it); the saved copy lives
// in the chatbot above and persists per device.
const GatewaySection = ({ saved, onSave, freeLeft }) => {
  const [draft, setDraft] = useState(
    saved
      ? { ...saved }
      : { provider: "anthropic", url: "", model: "", key: "" },
  );
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null); // { ok, text }

  const empty = { provider: "anthropic", url: "", model: "", key: "" };
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved || empty);
  const ready = draft.url.trim() !== "" && draft.key.trim() !== "";
  const set = (patch) => setDraft((current) => ({ ...current, ...patch }));

  const handleSave = () => {
    onSave({ ...draft, url: draft.url.trim(), key: draft.key.trim() });
    setResult({
      ok: true,
      text: "Saved — Robi now answers through the gateway.",
    });
  };

  const handleClear = () => {
    onSave(null);
    setDraft({ ...empty });
    setResult(null);
  };

  const handleTest = async () => {
    if (testing || !ready) return;
    setTesting(true);
    setResult(null);
    try {
      const { text: reply } = await callGateway(
        { ...draft, url: draft.url.trim(), key: draft.key.trim() },
        [{ from: "user", text: "Say OK." }],
        {},
      );
      setResult({
        ok: true,
        text: reply
          ? `Connected — the model replied: “${reply.slice(0, 60)}”`
          : "Connected.",
      });
    } catch (error) {
      setResult({
        ok: false,
        text:
          error?.message || "Connection failed — check the URL, key and CORS.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-gray-900/40 p-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-100">
        <Sparkles className="h-4 w-4 text-teal-400" /> AI Gateway
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        Gateway URL, model and token. When set, Robi answers through the model
        — no daily limit; otherwise he falls back to his built-in free brain.
        Everything stays on this device — never sent anywhere but the gateway
        itself.
      </p>

      {saved ? (
        <p className="mt-3 rounded-lg border border-teal-400/30 bg-teal-500/10 px-3 py-2 text-xs font-medium text-teal-300">
          Override active — {providerMeta(saved.provider).label} →{" "}
          {saved.model || providerMeta(saved.provider).defaultModel}
        </p>
      ) : (
        <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300">
          Free brain active — {BUILT_IN_BRAIN.model} with no setup, no key.{" "}
          {freeLeft} of {FREE_DAILY_LIMIT} messages left today (resets daily).
        </p>
      )}

      <div className="mt-3 flex flex-col gap-3">
        <GatewayField
          label="Provider"
          hint="Which API the gateway speaks. Switches the wire format Robi uses."
        >
          <select
            value={draft.provider}
            onChange={(event) => set({ provider: event.target.value })}
            className={fieldClass}
          >
            {PROVIDERS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </GatewayField>
        <GatewayField
          label="Gateway URL"
          hint="Base URL of the gateway (any /v1/messages or /v1/chat/completions endpoint works)."
        >
          <input
            type="url"
            value={draft.url}
            onChange={(event) => set({ url: event.target.value })}
            placeholder="https://aigateway.example.com"
            autoComplete="off"
            className={fieldClass}
          />
        </GatewayField>
        <GatewayField
          label="Model"
          hint="Model id this provider expects. Leave blank for the provider default."
        >
          <input
            type="text"
            value={draft.model}
            onChange={(event) => set({ model: event.target.value })}
            placeholder={providerMeta(draft.provider).defaultModel}
            autoComplete="off"
            className={fieldClass}
          />
        </GatewayField>
        <GatewayField
          label="API Key"
          hint="API key / bearer for the selected provider. Stored only on this device."
        >
          <input
            type="password"
            value={draft.key}
            onChange={(event) => set({ key: event.target.value })}
            placeholder="••••••••••••••••"
            autoComplete="off"
            className={fieldClass}
          />
        </GatewayField>
      </div>

      {result && (
        <p
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            result.ok
              ? "border border-teal-400/30 bg-teal-500/10 text-teal-300"
              : "border border-red-400/30 bg-red-500/10 text-red-300"
          }`}
        >
          {result.text}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={!ready || testing}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:border-teal-400/50 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {testing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {testing ? "Testing…" : "Test connection"}
        </button>
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={!saved && !dirty}
            className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-red-400/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear overrides
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!ready || !dirty}
            className="cursor-pointer rounded-full bg-teal-500 px-3.5 py-1.5 text-xs font-bold text-gray-900 shadow transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
        </span>
      </div>
    </section>
  );
};

// Real preferences: how the bot behaves, what it keeps on this device, and
// which AI gateway it thinks with.
const SettingsView = ({
  settings,
  onSettingsChange,
  gateway,
  onGatewayChange,
  freeLeft,
  onBack,
}) => (
  <div className="flex flex-1 flex-col overflow-hidden">
    <div className="border-b border-white/10 px-3 py-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to chat
      </button>
    </div>
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
      <section>
        <h3 className="px-1 text-sm font-bold text-gray-100">Preferences</h3>
        <div className="mt-1 flex flex-col gap-1">
          <Toggle
            label="Typing delay"
            hint="Show the thinking dots before each reply"
            on={settings.typingDelay}
            onChange={(typingDelay) =>
              onSettingsChange({ ...settings, typingDelay })
            }
          />
          <Toggle
            label="Save history"
            hint="Keep past sessions on this device only"
            on={settings.saveHistory}
            onChange={(saveHistory) =>
              onSettingsChange({ ...settings, saveHistory })
            }
          />
        </div>
      </section>
      <GatewaySection saved={gateway} onSave={onGatewayChange} freeLeft={freeLeft} />
    </div>
  </div>
);

// The skills store: one card per capability Robi can be given. Installing
// hands the skill's tool to the model; uninstalling takes it away, and the
// choice survives reloads on this device. A skill that can't run right now
// (the library counter needs a signed-in owner, the email needs an
// address) says why.
const SkillsView = ({ installed, audience, email, onToggle, onBack }) => (
  <div className="flex flex-1 flex-col overflow-hidden">
    <div className="border-b border-white/10 px-3 py-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to chat
      </button>
    </div>
    <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3">
      <p className="px-1 text-xs leading-relaxed text-gray-500">
        The skills Robi can use in conversation. Uninstall one and the model
        can no longer call it — install it back anytime.
      </p>
      {SKILL_REGISTRY.map((skill) => {
        const isInstalled = installed.includes(skill.name);
        const Icon = SKILL_ICONS[skill.name];
        // The registry's `audience` (default "all") decides who can run the
        // skill — the panel says why an installed-but-unusable skill sits
        // idle instead of leaving it a silent dud.
        const needed = skill.audience ?? "all";
        const blocked =
          needed === "editor" && audience !== "editor"
            ? "Needs the owner's account — it changes the library."
            : needed === "member" && audience === "visitor"
              ? "Sign in to use this skill."
              : skill.name === "copy_email" && !email
                ? "No contact email configured yet."
                : null;
        return (
          <div
            key={skill.name}
            className="rounded-xl border border-white/10 bg-gray-800 p-3.5"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-gray-100">
                    {skill.title}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isInstalled
                        ? "bg-teal-500/15 text-teal-300"
                        : "bg-white/5 text-gray-500"
                    }`}
                  >
                    {isInstalled ? "Installed" : "Not installed"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-400">
                  {skill.summary}
                </p>
                {isInstalled && blocked && (
                  <p className="mt-1.5 text-[11px] font-medium text-amber-400">
                    {blocked}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onToggle(skill.name)}
                className={
                  isInstalled
                    ? "shrink-0 cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-red-400/50 hover:text-red-300"
                    : "shrink-0 cursor-pointer rounded-full bg-teal-500 px-3 py-1.5 text-xs font-bold text-gray-900 shadow transition-colors hover:bg-teal-400"
                }
              >
                {isInstalled ? "Uninstall" : "Install"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// The first thing the bot says when a chat is opened.
const greetingFor = (content) => ({
  from: "bot",
  text: `Hi there! 👋 I'm Robi — ${content?.brand || "this portfolio"}'s site robot. Ask me anything about the site, the work, the skills — or let me hand you the CV as a PDF. The chips below are a quick start!`,
});

const CHIPS = ["Skills", "Projects", "About", "Contact", "CV", "PDF"];

// The little status row while Robi works. Tools carry their own progress
// line in the gateway's tool registry — a new tool shows up here without
// touching this file. The seconds tick live, Claude-style.
const statusLabel = (botStatus, elapsedSeconds) => {
  if (!botStatus) return "";
  const clock = ` · ${elapsedSeconds.toFixed(1)}s`;
  if (botStatus.kind === "tool") return toolProgress(botStatus.name) + clock;
  if (botStatus.kind === "retry") {
    return `Model busy (${botStatus.status}) — retry ${botStatus.attempt}/2${clock}`;
  }
  // Reasoning models stream their thoughts — show the latest fragment live.
  const thought = botStatus.thought
    ? ` ${botStatus.thought.replace(/\s+/g, " ").trim().slice(-80)}`
    : "";
  return `Thinking…${thought}${clock}`;
};

// One tap under a bubble puts its text on the clipboard — a short check
// confirms the copy, and blocked clipboards stay silent.
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — nothing to confirm */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy message"
      title="Copy"
      className="flex w-fit cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
    >
      {copied ? (
        <Check className="h-3 w-3 text-teal-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied && <span className="text-teal-400">Copied</span>}
    </button>
  );
};

// Sibling icon action next to Copy — edit, react and delete share one shape.
const MessageAction = ({ icon: Icon, label, onClick, active, danger }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`flex w-fit cursor-pointer items-center rounded-md p-1 transition-colors hover:bg-white/5 ${
      active
        ? "text-teal-400"
        : danger
          ? "text-gray-500 hover:text-red-300"
          : "text-gray-500 hover:text-gray-300"
    }`}
  >
    <Icon className="h-3 w-3" />
  </button>
);

const Chatbot = () => {
  const { content, save, guest } = usePortfolio();
  const { status, profile, canEdit } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  // What Robi is doing right now ({kind:"thinking"} or {kind:"tool",name})
  // — surfaced as a live status row, like the big AI chatbots do.
  const [botStatus, setBotStatus] = useState(null);
  // Seconds since the current busy phase started, ticking in the status row.
  const [elapsed, setElapsed] = useState(0);
  const busyStartRef = useRef(null);
  const [input, setInput] = useState("");
  // Which surface fills the panel: the chat itself, the 3-dot menu, or one
  // of the menu's destinations.
  const [panel, setPanel] = useState(null); // null | "menu" | "history" | "settings"
  const [sessions, setSessions] = useState(() =>
    loadStored(STORAGE.sessions, []),
  );
  const [settings, setSettings] = useState(() =>
    loadStored(STORAGE.settings, { typingDelay: true, saveHistory: true }),
  );
  const [gateway, setGateway] = useState(() =>
    loadStored(STORAGE.gateway, null),
  );
  // Today's free-brain spend, mirrored in state so the header badge and the
  // settings panel update live as messages go out.
  const [freeUse, setFreeUse] = useState(() => readFreeUse());
  const freeLeft = Math.max(0, FREE_DAILY_LIMIT - freeUse.count);
  const chargeFree = () => {
    const next = { date: todayKey(), count: readFreeUse().count + 1 };
    saveStored(STORAGE.free, next);
    setFreeUse(next);
  };
  // Which skills are installed. Storage keeps the REMOVALS, not the full
  // list — so a skill added to the registry later shows up installed, while
  // deliberate uninstalls still survive reloads. (The earlier shape stored
  // the whole list, which froze later skills out; an old array has no
  // `.removed`, so it migrates to "everything installed" on its own.)
  const [installedSkills, setInstalledSkills] = useState(() => {
    const stored = loadStored(STORAGE.skills, null);
    const removed = Array.isArray(stored?.removed) ? stored.removed : [];
    return ALL_SKILL_NAMES.filter((name) => !removed.includes(name));
  });
  const [currentId, setCurrentId] = useState(null);
  // The message being edited inline — { index, draft } while active.
  const [editing, setEditing] = useState(null);
  const listRef = useRef(null);
  const timerRef = useRef(null);

  const authed = status === "authenticated";
  // Who is chatting, as the skills registry sees it: visitors browse, viewers
  // read everything but write nothing, editors own the content.
  const audience = !authed ? "visitor" : canEdit ? "editor" : "viewer";
  const { url: pictureUrl } = useProfilePicture(profile?.userId);
  const email =
    content?.contact?.mail?.href?.replace(/^mailto:/, "").split("?")[0] || "";

  // The editors pin a sticky save bar across the bottom — the launcher lifts
  // above it there instead of covering the Save button.
  const raised = pathname === "/edit";

  // The robot's hands, offered to the model as tools it may call. A tool
  // exists only when it can: the library counter needs a signed-in owner,
  // the email needs a configured address. The CV PDF builds for everyone —
  // visitors get the same document the /cv page shows (the same lazy jsPDF
  // module the print preview uses).
  const toolHandlers = useMemo(() => {
    const handlers = {};
    if (installedSkills.includes("download_cv")) {
      handlers.download_cv = async () => {
        const [{ buildCvPdf, cvPdfFileName }, picture] = await Promise.all([
          import("../portfolio/cv-pdf"),
          pictureUrl ? toDataUrl(pictureUrl) : Promise.resolve(null),
        ]);
        const doc = buildCvPdf(content, picture);
        const file = cvPdfFileName(content);
        doc.save(file);
        return `The CV was built and saved as “${file}” — it is in the visitor's downloads now.`;
      };
    }
    // The reading skills — pure readers over the active CV, no writes. ask_cv
    // serves everyone; the composers need a signed-in account.
    if (installedSkills.includes("ask_cv")) {
      handlers.ask_cv = ({ question } = {}) => {
        const digest = cvDigest(content);
        if (!digest) {
          return "There is no active CV to read right now — the portfolio's other pages still have content.";
        }
        return `Here is the live CV content${question ? ` (their question: "${String(question).slice(0, 200)}")` : ""}. Answer only from these facts:\n${digest}`;
      };
    }
    if (authed && installedSkills.includes("summarize_cv")) {
      handlers.summarize_cv = ({ style } = {}) => {
        const digest = cvDigest(content);
        if (!digest) return "There is no active CV to summarize right now.";
        const wanted = String(style ?? "").toLowerCase();
        const shape = wanted.includes("link")
          ? "a first-person LinkedIn 'About' section, under 120 words"
          : wanted.includes("mail") || wanted.includes("email")
            ? "a short professional intro email — subject line plus under 100 words"
            : "a single punchy one-liner";
        return `Compose ${shape} from ONLY these CV facts. Plain text, ready to paste:\n${digest}`;
      };
    }
    if (authed && installedSkills.includes("analyze_fit")) {
      handlers.analyze_fit = ({ jobDescription } = {}) => {
        const jd = String(jobDescription ?? "").trim();
        if (!jd) {
          return "No job description arrived — ask them to paste it and try again.";
        }
        const digest = cvDigest(content);
        if (!digest) return "There is no active CV to compare against.";
        return `Compare this CV against the job description. Report: overall fit (high/medium/low), strengths that match, the specific gaps, and one honest advice line. Ground EVERY claim in these facts.\n\nJOB DESCRIPTION:\n${jd.slice(0, 2500)}\n\nCV:\n${digest}`;
      };
    }
    if (canEdit && installedSkills.includes("write_cv")) {
      // The model does the thinking — profession analysis and the writing —
      // and calls this once with the finished CV. This side only sanitizes
      // shapes, stamps fresh ids and saves it as a NEW CV through the
      // shelf's own flow, so nothing the owner built is ever overwritten.
      handlers.write_cv = async ({ title, profession, sections } = {}) => {
        const clean = (value, max) => String(value ?? "").trim().slice(0, max);
        const safeSections = (Array.isArray(sections) ? sections : [])
          .slice(0, 12)
          .map((section) => {
            const type = ["entry", "list", "text"].includes(section?.type)
              ? section.type
              : "text";
            const incoming = Array.isArray(section?.items)
              ? section.items.slice(0, 20)
              : [];
            const items =
              type === "entry"
                ? incoming
                    .filter((item) =>
                      [item?.heading, item?.sub, item?.details].some((field) =>
                        String(field ?? "").trim(),
                      ),
                    )
                    .map((item) => ({
                      id: newId("cvi"),
                      heading: clean(item?.heading, 120),
                      sub: clean(item?.sub, 120),
                      period: clean(item?.period, 60),
                      details: clean(item?.details, 600),
                    }))
                : incoming
                    .filter((item) => String(item?.text ?? "").trim())
                    .map((item) => ({
                      id: newId("cvi"),
                      text: clean(item?.text, 1000),
                    }));
            return {
              id: newId("cvs"),
              type,
              title: clean(section?.title, 60) || "Untitled section",
              page: "intro",
              items,
            };
          })
          .filter((section) => section.items.length > 0);
        if (safeSections.length === 0) {
          return "No usable sections arrived — the CV was not saved. Ask the member to try again.";
        }
        const headline = clean(title, 80);
        const list = content?.cvs ?? [];
        const fresh = createFreshCv(content, headline);
        if (headline) fresh.title = headline;
        fresh.sections = safeSections;
        await save(
          normalizeContent(
            { ...content, cvs: [...list, fresh], activeCvId: fresh.id },
            content,
          ),
        );
        navigate("/cv");
        return `Saved the new CV "${fresh.name}" (${profession || "profession"} track, ${safeSections.length} sections) to the library, made it the active CV and opened it at /cv.`;
      };
    }
    if (email && installedSkills.includes("copy_email")) {
      handlers.copy_email = async () => {
        try {
          await navigator.clipboard.writeText(email);
          return `${email} was copied to the visitor's clipboard.`;
        } catch {
          return `Clipboard access was blocked; tell the visitor the email directly: ${email}`;
        }
      };
    }
    if (canEdit && installedSkills.includes("count_library")) {
      // The saved lists ride inside the portfolio content the shelf reads —
      // no extra data call, the tool just counts what's already here.
      handlers.count_library = () => {
        const named = (list, activeId) =>
          list.length === 0
            ? "none yet"
            : list
                .map(
                  (item) =>
                    `${item.name || "Untitled"}${item.id === activeId ? " [active]" : ""}`,
                )
                .join(", ");
        const cvs = content?.cvs ?? [];
        const portfolios = content?.portfolios ?? [];
        return `The library holds ${cvs.length} saved CV${cvs.length === 1 ? "" : "s"} (${named(cvs, content?.activeCvId)}) and ${portfolios.length} saved portfolio${portfolios.length === 1 ? "" : "s"} (${named(portfolios, content?.activePortfolioId)}).`;
      };
    }
    if (installedSkills.includes("jump_to_page")) {
      handlers.jump_to_page = ({ page } = {}) => {
        // Accept "/projects", "projects" or a page name; anything else is an
        // honest refusal that tells the model which pages actually exist.
        const wanted = String(page ?? "")
          .trim()
          .toLowerCase()
          .replace(/^\/+|\/+$/g, "");
        const target = CHAT_PAGES.find(
          (entry) =>
            entry.keys.includes(wanted) ||
            entry.path.replace(/\//g, "") === wanted,
        );
        if (!target) {
          return `I can't jump there — the pages I can open are: ${CHAT_PAGES.map((entry) => entry.path).join(", ")}.`;
        }
        navigate(target.path);
        return `Took the visitor to ${target.name} (${target.path}).`;
      };
    }
    if (installedSkills.includes("share_page_link")) {
      handlers.share_page_link = async () => {
        const url = window.location.href;
        try {
          await navigator.clipboard.writeText(url);
          return `The current page's link (${url}) was copied to the visitor's clipboard.`;
        } catch {
          return `Clipboard access was blocked, so the link wasn't copied. The current page's link is: ${url}`;
        }
      };
    }
    return handlers;
  }, [authed, canEdit, content, pictureUrl, email, installedSkills, navigate, save]);

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
  }, [messages, typing, botStatus]);

  // While Robi is busy (thinking or running a tool) a small clock ticks in
  // the status row, so the wait feels accounted for.
  useEffect(() => {
    if (!botStatus) {
      busyStartRef.current = null;
      setElapsed(0);
      return undefined;
    }
    if (busyStartRef.current == null) busyStartRef.current = Date.now();
    const tick = () => setElapsed((Date.now() - busyStartRef.current) / 1000);
    const timer = setInterval(tick, 200);
    tick();
    return () => clearInterval(timer);
  }, [botStatus]);

  // Persist preferences and history — history only while saving is on. The
  // gateway is stored as-is, so Clear overrides survives reloads too.
  useEffect(() => {
    if (settings.saveHistory) saveStored(STORAGE.sessions, sessions);
    else {
      try {
        localStorage.removeItem(STORAGE.sessions);
      } catch {
        /* nothing to clean up if storage is blocked */
      }
    }
  }, [sessions, settings.saveHistory]);

  useEffect(() => {
    saveStored(STORAGE.settings, settings);
  }, [settings]);

  useEffect(() => {
    saveStored(STORAGE.skills, {
      removed: ALL_SKILL_NAMES.filter(
        (name) => !installedSkills.includes(name),
      ),
    });
  }, [installedSkills]);

  useEffect(() => {
    if (gateway) saveStored(STORAGE.gateway, gateway);
    else {
      try {
        localStorage.removeItem(STORAGE.gateway);
      } catch {
        /* nothing to clean up if storage is blocked */
      }
    }
  }, [gateway]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Ending the current conversation (New session, or jumping to an old one)
  // files it away — unless it never got past the greeting.
  const archiveCurrent = () => {
    if (messages.length <= 1) return;
    const entry = {
      id: currentId || `s-${Date.now()}`,
      at: Date.now(),
      messages: messages.slice(-MAX_MESSAGES),
    };
    setSessions((all) =>
      [entry, ...all.filter((session) => session.id !== entry.id)].slice(
        0,
        MAX_SESSIONS,
      ),
    );
  };

  const startNewSession = () => {
    archiveCurrent();
    setMessages([greetingFor(content)]);
    setCurrentId(null);
    setPanel(null);
  };

  const restoreSession = (session) => {
    archiveCurrent();
    setMessages(session.messages);
    setCurrentId(session.id);
    setPanel(null);
  };

  const clearHistory = () => {
    setSessions([]);
    setCurrentId(null);
  };

  const toggleSkill = (name) =>
    setInstalledSkills((current) =>
      current.includes(name)
        ? current.filter((skill) => skill !== name)
        : [...current, name],
    );

  // Per-message actions: react toggles a thumbs-up, delete removes the
  // bubble, edit rewrites a sent message in place.
  const deleteMessage = (index) =>
    setMessages((current) => current.filter((_, i) => i !== index));

  const toggleReact = (index) =>
    setMessages((current) =>
      current.map((message, i) =>
        i === index
          ? { ...message, react: message.react === "up" ? undefined : "up" }
          : message,
      ),
    );

  const startEdit = (index) =>
    setEditing({ index, draft: messages[index]?.text || "" });

  const saveEdit = () => {
    if (!editing) return;
    const text = editing.draft.trim();
    if (!text) return;
    setMessages((current) =>
      current.map((message, i) =>
        i === editing.index ? { ...message, text } : message,
      ),
    );
    setEditing(null);
  };

  const send = (raw) => {
    const text = raw.trim();
    if (!text || typing) return;
    setInput("");
    // Snapshot the conversation now — the gateway round trip happens later.
    const history = [...messages, { from: "user", text }];
    setMessages(history);
    setTyping(true);
    // The clock starts right away — even the pre-send pause counts as
    // "thinking" in the status row.
    setBotStatus({ kind: "thinking" });
    // A short pause makes the reply feel considered — unless the visitor
    // turned the delay off in settings.
    timerRef.current = setTimeout(
      () => finishReply(history),
      settings.typingDelay ? 650 : 0,
    );
  };

  // Every reply comes from a model: the configured gateway when there is
  // one, Robi's built-in free brain (Puter.js — no key, no setup) when
  // there isn't. A sent message charges the free allowance even if the
  // model later errors — the same rule every chat product uses — and a
  // spent day answers with the reset nudge instead of silence. The reply
  // bubble is created empty and fills in live as tokens stream in.
  const finishReply = async (history) => {
    if (!gateway) {
      if (freeLeft <= 0) {
        setMessages((current) => [
          ...current,
          {
            from: "bot",
            text: `That's today's free quota used up — ${FREE_DAILY_LIMIT} messages 🤖 The free brain resets tomorrow. Until then, bring your own model via ⋮ menu → Settings → AI Gateway for unlimited chat.`,
          },
        ]);
        setTyping(false);
        setBotStatus(null);
        return;
      }
      chargeFree();
    }
    const streamId = `m-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id: streamId, from: "bot", text: "" },
    ]);
    const onText = (text) => {
      // First token retires the status row; from then on it's live text.
      setTyping(false);
      setBotStatus(null);
      setMessages((current) =>
        current.map((message) =>
          message.id === streamId ? { ...message, text: plain(text) } : message
        )
      );
    };
    try {
      const here = CHAT_PAGES.find((entry) => entry.path === pathname)?.name;
      // The verified identity of whoever is chatting — not just what they
      // claim. Null for signed-out visitors; the prompt rules then forbid
      // account talk entirely.
      const viewer =
        authed && profile
          ? {
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
            }
          : null;
      const result = gateway
        ? await callGateway(gateway, history, content, {
            handlers: toolHandlers,
            onText,
            onStatus: setBotStatus,
            currentPage: `${here || pathname} (${pathname})`,
            viewer,
            audience,
          })
        : await callBuiltInBrain(await loadPuter(), history, content, {
            handlers: toolHandlers,
            onText,
            onStatus: setBotStatus,
            currentPage: `${here || pathname} (${pathname})`,
            viewer,
            audience,
          });
      setMessages((current) =>
        current.map((message) =>
          message.id === streamId
            ? {
                ...message,
                text: plain(result.text) || "…",
                meta: {
                  seconds:
                    result.thinkMs != null
                      ? +(result.thinkMs / 1000).toFixed(1)
                      : null,
                  tokens: result.usage
                    ? result.usage.input + result.usage.output
                    : null,
                },
              }
            : message,
        ),
      );
    } catch (error) {
      const detail =
        error?.message || "The gateway didn't answer — please try again.";
      // Peak-hour overloads (MiniMax-style 529s, rate limits) get advice,
      // not a raw stack of gateway noise.
      const busy = /\b(?:429|529)\b|overloaded|surge/i.test(detail);
      setMessages((current) =>
        current.map((message) =>
          message.id === streamId
            ? {
                ...message,
                text: busy
                  ? "⚠️ The model behind your gateway is overloaded right now — a peak-hour surge. It usually recovers in 1–5 minutes; try again shortly, or switch models in ⋮ → Settings → AI Gateway."
                  : `⚠️ ${detail}${gateway ? "" : " — you can also connect your own model in ⋮ → Settings → AI Gateway."}`,
              }
            : message
        )
      );
    }
    setTyping(false);
    setBotStatus(null);
  };

  const bubbleClass = "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed";
  const headerButtonClass =
    "cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300";

  // Guests get no Robi even though the free brain could now answer them —
  // the invite link is a lean read-only content tour, and a third-party
  // chat surface on it is chrome guest links shouldn't carry. The launcher
  // stays hidden like the bell and Sign in.
  if (guest) return null;

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
            <header className="relative flex items-center gap-3 border-b border-white/10 bg-gray-800 px-4 py-3">
              <RobotFace size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">Robi</p>
                <p className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      gateway || freeLeft > 0 ? "bg-green-400" : "bg-amber-400"
                    }`}
                  />
                  {gateway
                    ? `online — ${gateway.model || providerMeta(gateway.provider).defaultModel}`
                    : `online — free brain · ${freeLeft} of ${FREE_DAILY_LIMIT} left today`}
                </p>
              </div>
              {/* Session menu — history and settings live here. */}
              <button
                type="button"
                onClick={() => setPanel(panel === "menu" ? null : "menu")}
                aria-label="Chat menu"
                aria-haspopup="menu"
                aria-expanded={panel === "menu"}
                className={headerButtonClass}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={startNewSession}
                aria-label="New session"
                title="New session"
                className={headerButtonClass}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className={headerButtonClass}
              >
                <X className="h-4 w-4" />
              </button>

              {/* The 3-dot dropdown. A click-away layer closes it. */}
              {panel === "menu" && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setPanel(null)}
                    className="fixed inset-0 z-10 cursor-default"
                    tabIndex={-1}
                  />
                  <div
                    role="menu"
                    className="absolute top-full right-2 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-white/10 bg-gray-800 py-1 shadow-2xl"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setPanel("history")}
                      className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-200 transition-colors hover:bg-white/5"
                    >
                      <History className="h-4 w-4 text-teal-400" /> History
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setPanel("skills")}
                      className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-200 transition-colors hover:bg-white/5"
                    >
                      <Puzzle className="h-4 w-4 text-teal-400" /> Skills
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setPanel("settings")}
                      className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-200 transition-colors hover:bg-white/5"
                    >
                      <Settings className="h-4 w-4 text-teal-400" /> Settings
                    </button>
                  </div>
                </>
              )}
            </header>

            {/* Body — the chat, or one of the menu destinations. */}
            {panel === "history" ? (
              <HistoryView
                sessions={sessions}
                onRestore={restoreSession}
                onClear={clearHistory}
                onBack={() => setPanel(null)}
              />
            ) : panel === "skills" ? (
              <SkillsView
                installed={installedSkills}
                audience={audience}
                email={email}
                onToggle={toggleSkill}
                onBack={() => setPanel(null)}
              />
            ) : panel === "settings" ? (
              <SettingsView
                settings={settings}
                onSettingsChange={setSettings}
                gateway={gateway}
                onGatewayChange={setGateway}
                freeLeft={freeLeft}
                onBack={() => setPanel(null)}
              />
            ) : (
              <>
                {/* Messages */}
                <div
                  ref={listRef}
                  aria-live="polite"
                  className="scrollbar-hidden flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
                >
                  {messages.map((message, index) =>
                    message.from === "user" ? (
                      <div
                        key={index}
                        className="flex max-w-[85%] flex-col items-end gap-1 self-end"
                      >
                        {editing?.index === index ? (
                          <div className="flex w-72 max-w-full flex-col gap-1.5 rounded-xl border border-sky-400/40 bg-gray-800 p-2">
                            <textarea
                              value={editing.draft}
                              onChange={(event) =>
                                setEditing({ index, draft: event.target.value })
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) {
                                  event.preventDefault();
                                  saveEdit();
                                }
                                if (event.key === "Escape") setEditing(null);
                              }}
                              rows={2}
                              autoFocus
                              className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-100 outline-none"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="cursor-pointer rounded-full px-2 py-1 text-[11px] font-semibold text-gray-400 transition-colors hover:text-gray-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={saveEdit}
                                disabled={!editing.draft.trim()}
                                className="cursor-pointer rounded-full bg-teal-500 px-2.5 py-1 text-[11px] font-bold text-gray-900 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className={`${bubbleClass} rounded-br-sm bg-sky-500 font-medium text-white`}
                            >
                              {message.text}
                            </div>
                            <div className="flex items-center gap-0.5">
                              <CopyButton text={message.text} />
                              <MessageAction
                                icon={Pencil}
                                label="Edit message"
                                onClick={() => startEdit(index)}
                              />
                              <MessageAction
                                icon={Trash2}
                                label="Delete message"
                                danger
                                onClick={() => deleteMessage(index)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ) : !message.text ? null : (
                      <div
                        key={index}
                        className="flex max-w-[85%] flex-col gap-1 self-start"
                      >
                        <div
                          className={`${bubbleClass} flex flex-col gap-1.5 rounded-bl-sm border border-white/5 bg-gray-800 text-gray-200`}
                        >
                          <span>{message.text}</span>
                          {message.meta &&
                           (message.meta.seconds != null ||
                            message.meta.tokens != null) && (
                            <span className="text-[11px] tabular-nums text-gray-500">
                              {message.meta.seconds != null &&
                                `Thought for ${message.meta.seconds}s`}
                              {message.meta.seconds != null &&
                                message.meta.tokens != null &&
                                " · "}
                              {message.meta.tokens != null &&
                                `${message.meta.tokens} tokens`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <CopyButton text={message.text} />
                          <MessageAction
                            icon={ThumbsUp}
                            label="React"
                            active={message.react === "up"}
                            onClick={() => toggleReact(index)}
                          />
                          <MessageAction
                            icon={Trash2}
                            label="Delete message"
                            danger
                            onClick={() => deleteMessage(index)}
                          />
                        </div>
                      </div>
                    ),
                  )}
                  {(typing || botStatus) && (
                    <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-sm border border-white/5 bg-gray-800 px-3.5 py-2.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />
                      <span className="text-xs font-medium tabular-nums text-gray-400">
                        {statusLabel(botStatus, elapsed) || "Thinking…"}
                      </span>
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
                    onKeyDown={(event) =>
                      event.key === "Escape" && setOpen(false)
                    }
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
              </>
            )}
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
