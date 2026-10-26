import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  BellRing,
  FileText,
  FolderKanban,
  Loader2,
  Mail,
  Plus,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";
import {
  ensureJobPreference,
  getJobPreference,
  saveJobPreference,
} from "../jobs/jobs-api";
import {
  ACCENT_CLASS_OPTIONS,
  SKILL_COLOR_OPTIONS,
  newId,
  normalizeContent,
} from "../content/portfolioShape";

// First-visit onboarding: the moment a brand-new builder lands on their
// starter content, a step-by-step wizard collects their Intro, About,
// Skills, Projects, Contact and Job Alerts keywords. Skippable — and every
// answer stays editable afterwards through the same editors as always.
// "Has run" lives on the content itself (`onboarded: true`), so the wizard
// greets a device the account has never used before exactly once.

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 transition-colors focus:border-sky-400/60 focus:outline-none";
const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-gray-400";

const STEPS = [
  {
    key: "intro",
    icon: UserRound,
    chip: "from-sky-500 to-indigo-500",
    title: "Your intro",
    blurb: "The name and headline every visitor sees first.",
  },
  {
    key: "about",
    icon: FileText,
    chip: "from-indigo-500 to-purple-500",
    title: "Your story",
    blurb: "A couple of short paragraphs about you — blank lines split them.",
  },
  {
    key: "skills",
    icon: Wrench,
    chip: "from-amber-400 to-orange-500",
    title: "Your skills",
    blurb: "The chips on your intro page. Type one and press Add.",
  },
  {
    key: "projects",
    icon: FolderKanban,
    chip: "from-green-500 to-teal-500",
    title: "Your projects",
    blurb: "Things you have built — links are optional.",
  },
  {
    key: "contact",
    icon: Mail,
    chip: "from-pink-500 to-rose-500",
    title: "How to reach you",
    blurb:
      "Email and profiles — plus any other link you keep. Blank stays as is.",
  },
  {
    key: "alerts",
    icon: BellRing,
    chip: "from-orange-500 to-pink-500",
    title: "Job alerts",
    blurb: "Keywords to watch for — matching jobs land in your alerts.",
  },
];

// A brand-new row still carrying the starter placeholder copy — the
// onboarding door. Both markers exist ONLY in starterPortfolio, so any real
// edit (even one line) means this account is already past onboarding.
const isStarterContent = (content) => {
  const bio = String(content?.hero?.bio?.text ?? "");
  const about = (content?.about?.paragraphs ?? [])
    .map((p) => p.text)
    .join(" ");
  return (
    bio.includes("Edit portfolio is where you make this yours") ||
    about.includes("this is where my story goes")
  );
};

const emptyProject = () => ({ title: "", desc: "", github: "", live: "" });

const OnboardingGate = () => {
  const { status, profile, canEdit } = useAuth();
  const { status: portfolioStatus, content, save } = usePortfolio();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(null);
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // The finish celebration — a short success card before the wizard closes.
  const [done, setDone] = useState(false);

  // Builders only — viewers, guests and signed-out visitors never see it.
  const doorOpen =
    status === "authenticated" &&
    canEdit &&
    portfolioStatus === "ready" &&
    content &&
    !content.onboarded &&
    isStarterContent(content);
  // While the success card plays, the door is already shut (the flag is
  // saved) — `done` keeps the wizard mounted anyway.
  const open = doorOpen && !done;

  // Seed every field from the live content the moment the door opens (and
  // pull any keywords the account already saved for alerts).
  useEffect(() => {
    if (!open || !content) return undefined;
    setStep(0);
    setError("");
    setForm({
      brand: content.brand ?? "",
      greeting: content.hero?.greeting ?? "",
      title: content.hero?.title ?? "",
      bio: content.hero?.bio?.text ?? "",
      about: (content.about?.paragraphs ?? [])
        .map((p) => p.text)
        .join("\n\n"),
      skills: (content.hero?.skills ?? []).map((s) => s.name),
      skillInput: "",
      projects: (content.projects ?? []).map((p) => ({
        title: p.title ?? "",
        desc: p.desc ?? "",
        github: p.github && p.github !== "#" ? p.github : "",
        live: p.live && p.live !== "#" ? p.live : "",
      })),
      email:
        content.contact?.mail?.href?.startsWith("mailto:")
          ? content.contact.mail.href.slice(7)
          : "",
      github:
        content.contact?.github?.href &&
        content.contact.github.href !== "#"
          ? content.contact.github.href
          : "",
      linkedin:
        content.contact?.linkedin?.href &&
        content.contact.linkedin.href !== "#"
          ? content.contact.linkedin.href
          : "",
      intro: content.contact?.intro ?? "",
      extras: (content.contact?.extras ?? [])
        .filter((e) => e.href && e.href !== "#")
        .map((e) => ({ id: e.id, label: e.label ?? "", href: e.href })),
    });
    getJobPreference(profile?.userId)
      .then((row) => setKeywords(row?.Keywords ?? ""))
      .catch(() => setKeywords(""));
    return undefined;
    // Deliberately keyed on the door itself — a mid-wizard content refresh
    // must not wipe what the user is typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The confetti celebration — brand colors from three cannons, then the
  // wizard closes itself.
  useEffect(() => {
    if (!done) return undefined;
    const colors = ["#38bdf8", "#6366f1", "#ec4899", "#ffffff"];
    for (const x of [0.2, 0.5, 0.8]) {
      confetti({
        particleCount: 80,
        spread: 75,
        startVelocity: 42,
        origin: { x, y: 0.6 },
        colors,
      });
    }
    const timer = setTimeout(() => setDone(false), 2600);
    return () => clearTimeout(timer);
  }, [done]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const addSkills = () => {
    const parts = form.skillInput
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setForm((f) => {
      const skills = [...f.skills];
      for (const part of parts) {
        if (!skills.some((s) => s.toLowerCase() === part.toLowerCase())) {
          skills.push(part);
        }
      }
      return { ...f, skills, skillInput: "" };
    });
  };

  const setProject = (index, patch) =>
    setForm((f) => ({
      ...f,
      projects: f.projects.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));

  const setExtra = (index, patch) =>
    setForm((f) => ({
      ...f,
      extras: f.extras.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }));

  // Persist everything: keywords to their own row first (an independent
  // save), then the portfolio content with the onboarding flag set — the
  // flag flipping is what closes the wizard.
  const finish = async () => {
    setBusy(true);
    setError("");
    try {
      const kw = keywords
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");
      if (kw) {
        const row = await ensureJobPreference(profile.userId);
        await saveJobPreference(row.ItemId, { Keywords: kw });
      }
      const pid = content.activePortfolioId;
      const skillChips = form.skills.map((name, i) => ({
        name,
        color: SKILL_COLOR_OPTIONS[i % SKILL_COLOR_OPTIONS.length],
      }));
      const aboutParas = form.about.trim()
        ? form.about
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((text) => ({
              text,
              accentClass: ACCENT_CLASS_OPTIONS[0],
            }))
        : content.about.paragraphs;
      const portfolios = content.portfolios.map((p) =>
        p.id === pid
          ? {
              ...p,
              hero: {
                greeting: form.greeting.trim() || p.hero.greeting,
                title: form.title.trim() || p.hero.title,
                bio: {
                  text: form.bio.trim() || p.hero.bio.text,
                  accentClass: ACCENT_CLASS_OPTIONS[0],
                },
                skills: skillChips,
              },
              about: { paragraphs: aboutParas },
              skills: form.skills,
              projects: form.projects
                .filter((pr) => pr.title.trim() !== "")
                .map((pr) => ({
                  title: pr.title.trim(),
                  desc: pr.desc.trim(),
                  github: pr.github.trim() || "#",
                  live: pr.live.trim() || "#",
                })),
              contact: {
                ...p.contact,
                intro: form.intro.trim() || p.contact.intro,
                mail: form.email.trim()
                  ? {
                      href: `mailto:${form.email.trim()}`,
                      label: form.email.trim(),
                    }
                  : p.contact.mail,
                github: form.github.trim()
                  ? { href: form.github.trim(), label: form.github.trim() }
                  : p.contact.github,
                linkedin: form.linkedin.trim()
                  ? { href: form.linkedin.trim(), label: form.linkedin.trim() }
                  : p.contact.linkedin,
                extras: form.extras
                  .filter((e) => e.label.trim() && e.href.trim())
                  .map((e) => ({
                    id: typeof e.id === "string" && e.id ? e.id : newId("contact"),
                    label: e.label.trim(),
                    href: e.href.trim(),
                  })),
              },
            }
          : p
      );
      await save(
        normalizeContent({
          ...content,
          brand: form.brand.trim() || content.brand,
          portfolios,
          onboarded: true,
        })
      );
      setDone(true);
    } catch (saveError) {
      setError(saveError.message || "Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  };

  // Skipping keeps every answer exactly as it is — the flag is the only
  // thing that lands, so the wizard never nags the same account again.
  const skip = async () => {
    setBusy(true);
    setError("");
    try {
      await save(normalizeContent({ ...content, onboarded: true }));
    } catch (saveError) {
      setError(saveError.message || "Could not skip — try again.");
      setBusy(false);
    }
  };

  const firstName =
    profile?.firstName?.trim() || profile?.email?.split("@")[0] || "there";

  if ((!doorOpen && !done) || !form) return null;

  // The finish celebration: the check draws itself inside a blooming
  // gradient circle, the card lingers, then the wizard closes on its own.
  // ---- Finish celebration: the check draws itself inside a blooming
  // gradient circle while brand-colored confetti rains, the card lingers,
  // then the wizard closes on its own.
  if (done) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/80 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-800 p-8 text-center shadow-2xl"
        >
          <div className="relative mx-auto h-24 w-24">
            <motion.span
              className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            />
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-sky-400/60"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
            />
            <svg
              viewBox="0 0 52 52"
              className="absolute inset-0 m-auto h-14 w-14"
              aria-hidden="true"
            >
              <motion.path
                d="M14 27 L23 36 L38 19"
                fill="none"
                stroke="#ffffff"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.35, duration: 0.45, ease: "easeOut" }}
              />
            </svg>
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            Onboarding complete
          </p>
          <h3 className="mt-2 bg-gradient-to-r from-sky-300 via-indigo-300 to-pink-300 bg-clip-text text-2xl font-extrabold text-transparent">
            You&apos;re all set, {firstName}!
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            Your portfolio is live — polish any section whenever you like.
          </p>
          <button
            type="button"
            onClick={() => setDone(false)}
            className="mt-5 cursor-pointer rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-indigo-400"
          >
            Take me in
          </button>
        </motion.div>
      </div>
    );
  }

  const meta = STEPS[step];
  const StepIcon = meta.icon;
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-800 shadow-2xl">
        <div
          className="h-1.5 w-full shrink-0 bg-gradient-to-r from-sky-400 via-indigo-400 to-pink-400"
          aria-hidden="true"
        />
        {/* Head: step one gets the big colorful greeting; the rest get the
            step icon and title — the wizard's road sign. */}
        {step === 0 ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-indigo-500 to-pink-500 px-6 pb-5 pt-6">
            <span
              className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-white/15"
              aria-hidden="true"
            />
            <span
              className="absolute -bottom-14 right-16 h-28 w-28 rounded-full bg-pink-300/20"
              aria-hidden="true"
            />
            <Sparkles
              className="absolute right-6 top-6 h-7 w-7 text-white/70"
              aria-hidden="true"
            />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
              Welcome aboard
            </p>
            <h3 className="mt-1.5 text-2xl font-extrabold text-white drop-shadow-sm">
              Welcome, {firstName}!
            </h3>
            <p className="mt-1 max-w-sm text-sm text-white/90">
              Your corner of the internet is six quick steps away — skip any
              of them, polish everything later.
            </p>
            <span className="absolute bottom-4 right-6 text-xs font-semibold text-white/70">
              {step + 1} / {STEPS.length}
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-4 border-b border-white/5 px-6 py-5">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.chip} text-white shadow-lg`}
            >
              <StepIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-white">
                {meta.title}
              </h3>
              <p className="mt-0.5 text-sm text-gray-400">{meta.blurb}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-gray-500">
              {step + 1} / {STEPS.length}
            </span>
          </div>
        )}
        <div className="flex gap-1.5 px-6 pt-4">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step
                  ? "bg-sky-500/70"
                  : i === step
                    ? "bg-gradient-to-r from-sky-400 to-indigo-400"
                    : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* One step at a time, sliding — motion keeps it light. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={meta.key}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              {step === 0 && (
                <>
                  <div>
                    <label className={labelClass} htmlFor="onb-brand">
                      Name on your site
                    </label>
                    <input
                      id="onb-brand"
                      className={`${fieldClass} mt-1.5`}
                      value={form.brand}
                      onChange={(e) => set({ brand: e.target.value })}
                      placeholder="Merajul"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="onb-greeting">
                      Greeting
                    </label>
                    <input
                      id="onb-greeting"
                      className={`${fieldClass} mt-1.5`}
                      value={form.greeting}
                      onChange={(e) => set({ greeting: e.target.value })}
                      placeholder="Hi, I'm Meraj"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="onb-title">
                      What you do
                    </label>
                    <input
                      id="onb-title"
                      className={`${fieldClass} mt-1.5`}
                      value={form.title}
                      onChange={(e) => set({ title: e.target.value })}
                      placeholder="Frontend Developer"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="onb-bio">
                      One line about you
                    </label>
                    <textarea
                      id="onb-bio"
                      rows={2}
                      className={`${fieldClass} mt-1.5 resize-none`}
                      value={form.bio}
                      onChange={(e) => set({ bio: e.target.value })}
                      placeholder="I build fast, friendly web apps people love to use."
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      Wrap words in **double stars** to paint them sky-blue.
                    </p>
                  </div>
                </>
              )}

              {step === 1 && (
                <div>
                  <label className={labelClass} htmlFor="onb-about">
                    About you
                  </label>
                  <textarea
                    id="onb-about"
                    rows={7}
                    className={`${fieldClass} mt-1.5`}
                    value={form.about}
                    onChange={(e) => set({ about: e.target.value })}
                    placeholder="I'm a developer from Dhaka…"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    A blank line starts a new paragraph · **double stars** for
                    the blue accent.
                  </p>
                </div>
              )}

              {step === 2 && (
                <div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      addSkills();
                    }}
                  >
                    <input
                      className={fieldClass}
                      value={form.skillInput}
                      onChange={(e) => set({ skillInput: e.target.value })}
                      placeholder="React, Tailwind CSS, Node.js"
                    />
                    <button
                      type="submit"
                      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
                    >
                      <Plus className="h-4 w-4" /> Add
                    </button>
                  </form>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {form.skills.map((skill, i) => (
                      <span
                        key={skill}
                        className={`group inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white ${SKILL_COLOR_OPTIONS[i % SKILL_COLOR_OPTIONS.length]}`}
                      >
                        {skill}
                        <button
                          type="button"
                          aria-label={`Remove ${skill}`}
                          onClick={() =>
                            set({
                              skills: form.skills.filter((s) => s !== skill),
                            })
                          }
                          className="cursor-pointer opacity-60 transition-opacity hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                    {form.skills.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No skills yet — add your first above.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-4">
                  {form.projects.map((project, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl border border-white/10 bg-gray-900/60 p-4"
                    >
                      <button
                        type="button"
                        aria-label="Remove this project"
                        onClick={() =>
                          set({
                            projects: form.projects.filter(
                              (_, j) => j !== i
                            ),
                          })
                        }
                        className="absolute right-3 top-3 cursor-pointer text-gray-500 transition-colors hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <input
                        className={fieldClass}
                        value={project.title}
                        onChange={(e) =>
                          setProject(i, { title: e.target.value })
                        }
                        placeholder="Project name"
                      />
                      <textarea
                        rows={2}
                        className={`${fieldClass} mt-2 resize-none`}
                        value={project.desc}
                        onChange={(e) => setProject(i, { desc: e.target.value })}
                        placeholder="What it does and what you learned"
                      />
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input
                          className={fieldClass}
                          value={project.github}
                          onChange={(e) =>
                            setProject(i, { github: e.target.value })
                          }
                          placeholder="GitHub link (optional)"
                        />
                        <input
                          className={fieldClass}
                          value={project.live}
                          onChange={(e) => setProject(i, { live: e.target.value })}
                          placeholder="Live link (optional)"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      set({ projects: [...form.projects, emptyProject()] })
                    }
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2.5 text-sm font-semibold text-gray-400 transition-colors hover:border-sky-400/40 hover:text-sky-300"
                  >
                    <Plus className="h-4 w-4" /> Add another project
                  </button>
                </div>
              )}

              {step === 4 && (
                <>
                  <div>
                    <label className={labelClass} htmlFor="onb-email">
                      Email
                    </label>
                    <input
                      id="onb-email"
                      type="email"
                      className={`${fieldClass} mt-1.5`}
                      value={form.email}
                      onChange={(e) => set({ email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="onb-github">
                      GitHub
                    </label>
                    <input
                      id="onb-github"
                      className={`${fieldClass} mt-1.5`}
                      value={form.github}
                      onChange={(e) => set({ github: e.target.value })}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="onb-linkedin">
                      LinkedIn
                    </label>
                    <input
                      id="onb-linkedin"
                      className={`${fieldClass} mt-1.5`}
                      value={form.linkedin}
                      onChange={(e) => set({ linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="onb-intro">
                      Contact page opener
                    </label>
                    <input
                      id="onb-intro"
                      className={`${fieldClass} mt-1.5`}
                      value={form.intro}
                      onChange={(e) => set({ intro: e.target.value })}
                      placeholder="Let's create something amazing together!"
                    />
                  </div>
                  <div>
                    <span className={labelClass}>Other links</span>
                    <div className="mt-1.5 flex flex-col gap-2">
                      {form.extras.map((extra, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            className={`${fieldClass} w-32 shrink-0 sm:w-36`}
                            value={extra.label}
                            onChange={(e) => setExtra(i, { label: e.target.value })}
                            placeholder="Dribbble, X, blog…"
                            aria-label="Link label"
                          />
                          <input
                            className={fieldClass}
                            value={extra.href}
                            onChange={(e) => setExtra(i, { href: e.target.value })}
                            placeholder="https://…"
                            aria-label="Link URL"
                          />
                          <button
                            type="button"
                            aria-label="Remove this link"
                            onClick={() =>
                              set({
                                extras: form.extras.filter((_, j) => j !== i),
                              })
                            }
                            className="shrink-0 cursor-pointer text-gray-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          set({ extras: [...form.extras, { id: null, label: "", href: "" }] })
                        }
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2 text-sm font-semibold text-gray-400 transition-colors hover:border-sky-400/40 hover:text-sky-300"
                      >
                        <Plus className="h-4 w-4" /> Add a link
                      </button>
                    </div>
                  </div>
                </>
              )}

              {step === 5 && (
                <div>
                  <label className={labelClass} htmlFor="onb-keywords">
                    Keywords to watch
                  </label>
                  <textarea
                    id="onb-keywords"
                    rows={4}
                    className={`${fieldClass} mt-1.5`}
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="frontend, react, remote, dhaka"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Comma-separated — a job matching any of these lands in
                    your alerts. Editable any time on the Job Alerts page.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && (
          <p className="px-6 pb-1 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-white/5 px-6 py-4">
          <button
            type="button"
            onClick={skip}
            disabled={busy}
            className="cursor-pointer text-sm font-semibold text-gray-400 transition-colors hover:text-gray-200 disabled:cursor-wait"
          >
            Skip for now
          </button>
          <div className="ml-auto flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={busy}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:text-sky-300 disabled:cursor-wait"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? finish() : setStep((s) => s + 1))}
              disabled={busy}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-wait"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {last ? "Finish" : "Next"}
              {step === 0 && <Sparkles className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGate;
