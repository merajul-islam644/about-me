// Meraj's real portfolio content, transcribed verbatim from the original
// hardcoded component consts (Hero, About, Skills, Projects, Contact).
// On first load this seeds HIS Portfolio row, so his site looks unchanged
// after the multi-user cutover. `**…**` marks accent spans — see AccentText.

// Meraj's IAM account email — the PortfolioProvider seeds this content only
// when the signed-in email matches (verified from his session at cutover).
export const MERAJ_EMAIL = "merajzoarder6@gmail.com";

export const merajPortfolio = {
  version: 1,
  brand: "Merajul",
  hero: {
    greeting: "Hi, I'm Merajul",
    title: "Frontend Developer | React Enthusiast",
    bio: {
      text: "I build modern, scalable, and user-friendly web applications using **React, Next.js, and Tailwind CSS**. Passionate about clean code, responsive design, and creating seamless digital experiences. Always eager to learn new technologies and deliver impactful solutions.",
      accentClass: "text-sky-400 font-medium",
    },
    skills: [
      { name: "HTML & CSS", color: "bg-yellow-400 text-gray-800" },
      { name: "Tailwind CSS", color: "bg-indigo-500" },
      { name: "JavaScript", color: "bg-green-500" },
      { name: "React", color: "bg-sky-500" },
      { name: "Next.js", color: "bg-pink-500" },
    ],
  },
  about: {
    paragraphs: [
      {
        text: "I am a **Software Engineering Intern at SELISE Group**, building scalable and modern web applications. I enjoy solving challenging problems, learning new technologies, and creating user-friendly solutions that make a real impact.",
        accentClass: "font-semibold text-white",
      },
      // The space sits INSIDE the markers on purpose: today's DOM renders
      // "in" + <span>" React.js"</span> + "," + <span>" Next.js"</span> + ", and …",
      // and these markers reproduce those exact text nodes.
      {
        text: "Currently focusing on improving my skills in** React.js**,** Next.js**, and modern frontend workflows while contributing to real-world projects.",
        accentClass: "text-sky-400 font-medium",
      },
    ],
  },
  skills: [
    "HTML",
    "CSS",
    "Tailwind CSS",
    "JavaScript",
    "Typescript",
    "React.js",
    "Next.js",
    "Redux",
    "Git & GitHub",
  ],
  projects: [],
  contact: {
    intro:
      "I’m open to discussing new projects, freelance opportunities, or collaborations. Let’s create something amazing together!",
    mail: { href: "mailto:meraj@example.com", label: "meraj@example.com" },
    github: { href: "#", label: "github.com/yourusername" },
    linkedin: { href: "#", label: "linkedin.com/in/yourprofile" },
  },
};

// The public showcase persona: signed-out visitors browse this instead of
// Meraj's own content — same design and data, placeholder name. Read-only
// (visitors have no row to save into), so sharing nested objects is fine.
export const visitorPortfolio = {
  ...merajPortfolio,
  brand: "Jon Doe",
  hero: { ...merajPortfolio.hero, greeting: "Hi, I'm Jon Doe" },
};
