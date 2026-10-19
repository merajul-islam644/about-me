import { ACCENT_CLASS_OPTIONS, CONTENT_VERSION, SKILL_COLOR_OPTIONS } from "./portfolioShape";

// The starter portfolio a brand-new user is auto-provisioned with: same
// structure as Meraj's seeded content, but placeholder copy personalized with
// the user's own name and email, so their first view is fully designed and
// every section is obviously theirs to edit.
export const starterPortfolio = (profile) => {
  const email = typeof profile?.email === "string" ? profile.email : "";
  const firstName =
    typeof profile?.firstName === "string" && profile.firstName.trim() !== ""
      ? profile.firstName
      : email.split("@")[0] || "there";
  const accent = ACCENT_CLASS_OPTIONS[0];

  return {
    version: CONTENT_VERSION,
    brand: firstName,
    hero: {
      greeting: `Hi, I'm ${firstName}`,
      title: "Frontend Developer",
      bio: {
        text: `Welcome to my corner of the internet. **Edit portfolio** is where you make this yours — your story, your stack, your work.`,
        accentClass: accent,
      },
      skills: [
        { name: "React", color: SKILL_COLOR_OPTIONS[3] },
        { name: "JavaScript", color: SKILL_COLOR_OPTIONS[2] },
        { name: "Tailwind CSS", color: SKILL_COLOR_OPTIONS[1] },
      ],
    },
    about: {
      paragraphs: [
        {
          text: `I'm **${firstName}** — this is where my story goes. Tell visitors what you build, what you love, and what you're learning.`,
          accentClass: accent,
        },
        {
          text: "Replace this paragraph too — **two short paragraphs** are plenty for a great about page.",
          accentClass: accent,
        },
      ],
    },
    skills: ["HTML", "CSS", "JavaScript"],
    projects: [
      {
        id: typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `p-${Math.random().toString(16).slice(2)}`,
        title: "My First Project",
        desc: "A short description of something you built — what it does and what you learned.",
        github: "#",
        live: "#",
      },
    ],
    contact: {
      intro: "Let's create something amazing together!",
      mail: { href: email ? `mailto:${email}` : "#", label: email || "you@example.com" },
      github: { href: "#", label: "github.com/yourusername" },
      linkedin: { href: "#", label: "linkedin.com/in/yourprofile" },
    },
  };
};
