// Meraj's real portfolio content, transcribed verbatim from the original
// hardcoded component consts (Hero, About, Skills, Projects, Contact).
// On first load this seeds HIS Portfolio row, so his site looks unchanged
// after the multi-user cutover. `**…**` marks accent spans — see AccentText.

// Meraj's IAM account email — the PortfolioProvider seeds this content only
// when the signed-in email matches (verified from his session at cutover).
export const MERAJ_EMAIL = "merajzoarder6@gmail.com";

// Meraj's IAM record id — invited viewers load HIS Portfolio row read-only
// instead of seeing their own starter content (resolved via `iam users list`
// at the viewer-mode cutover).
export const MERAJ_USER_ID = "87e107b5-7be2-4964-a461-0a46348d3ef2";

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
// The CV block demos the section model so the public /cv view looks like a
// real document, not an empty shell.
import { CONTENT_VERSION } from "./portfolioShape";

export const visitorPortfolio = {
  ...merajPortfolio,
  // v1 content gets its project list dropped on purpose (the old site's
  // filler rows) — the visitor showcase presents as v2, so the sample
  // projects below survive normalization.
  version: CONTENT_VERSION,
  brand: "Jon Doe",
  hero: { ...merajPortfolio.hero, greeting: "Hi, I'm Jon Doe" },
  // The Projects page needs something to show — three sample works (the
  // same ones the sample CV lists, so the site agrees with itself) under
  // the Jon Doe persona. Meraj's own seed above keeps its real list.
  projects: [
    {
      id: "vp-1",
      title: "Portfolio & CV Builder",
      desc: "A platform where anyone can build their own portfolio and a profession-tailored CV, then publish both.",
      github: "https://github.com/johndoe/portfolio-builder",
      live: "https://johndoe.dev",
    },
    {
      id: "vp-2",
      title: "Task Manager",
      desc: "A drag-and-drop task board with deadlines, labels and offline persistence.",
      github: "https://github.com/johndoe/task-manager",
      live: "https://task-manager.johndoe.dev",
    },
    {
      id: "vp-3",
      title: "Weather Dashboard",
      desc: "Searchable 5-day forecast with geolocation — caches the last result for offline viewing.",
      github: "https://github.com/johndoe/weather-dashboard",
      live: "https://weather.johndoe.dev",
    },
  ],
  cv: {
    // Every CV page carries sample data — the public showcase is browsable
    // without login, so no CV page may render empty for visitors. Written as
    // a complete, recruiter-standard document: personal information in the
    // header strip, summary → experience → education on Intro; profile +
    // strengths on About; skills, tools and languages on Skills; three
    // shipped projects; a references line.
    contact: {
      location: "Dhaka, Bangladesh",
      phone: "+880 1712 345 678",
      email: "jon.doe@example.com",
      link: "linkedin.com/in/jondoe",
    },
    sections: [
      // ---- Intro: summary, experience, education ----
      {
        type: "text",
        page: "intro",
        title: "Professional Summary",
        items: [
          {
            text: "Frontend developer with 2+ years of hands-on experience building fast, accessible web applications with React and modern tooling. Comfortable owning a feature from design hand-off to production, and happiest when the codebase stays clean and the UI feels effortless.",
          },
        ],
      },
      {
        type: "entry",
        page: "intro",
        title: "Work Experience",
        items: [
          {
            heading: "Software Engineering Intern",
            sub: "SELISE Group — Dhaka, Bangladesh",
            period: "Feb 2025 — Present",
            details:
              "• Build and maintain production React features for an enterprise platform\n• Collaborate with senior engineers on code review, testing and CI\n• Delivered shared design-system components now used by three teams",
          },
          {
            heading: "Freelance Web Developer",
            sub: "Self-employed — Remote",
            period: "2023 — 2025",
            details:
              "• Shipped 6+ client websites with React, Next.js and Tailwind CSS\n• Raised average Lighthouse performance scores from 62 to 94\n• Handled everything client-facing: scoping, estimates and demos",
          },
        ],
      },
      {
        type: "entry",
        page: "intro",
        title: "Education",
        items: [
          {
            heading: "BSc in Computer Science & Engineering",
            sub: "University of Dhaka",
            period: "2019 — 2023",
            details:
              "CGPA 3.74 / 4.00 · Final-year project: a real-time collaborative markdown editor",
          },
        ],
      },
      // ---- About: profile narrative + strengths ----
      {
        type: "text",
        page: "about",
        title: "Profile",
        items: [
          {
            text: "I am a frontend developer who enjoys turning complex problems into simple, beautiful interfaces. My focus is clean, maintainable code and interfaces that feel fast and effortless.",
          },
          {
            text: "I learn best by building — most of what I know comes from shipping real projects, breaking them, and fixing them again.",
          },
        ],
      },
      {
        type: "list",
        page: "about",
        title: "Strengths",
        items: [
          { text: "Problem solving under real deadlines" },
          { text: "Clean, maintainable, well-documented code" },
          { text: "Clear communication with designers and clients" },
          { text: "Fast, self-driven learning" },
        ],
      },
      // ---- Skills: core stack, tooling, languages ----
      {
        type: "list",
        page: "skills",
        title: "Core Skills",
        items: [
          { text: "React.js" },
          { text: "JavaScript (ES6+)" },
          { text: "TypeScript" },
          { text: "Tailwind CSS" },
          { text: "Next.js" },
          { text: "Git & GitHub" },
        ],
      },
      {
        type: "list",
        page: "skills",
        title: "Tools & Technologies",
        items: [
          { text: "Vite · Redux Toolkit" },
          { text: "REST APIs · Fetch / Axios" },
          { text: "Figma → pixel-accurate UI" },
          { text: "Chrome DevTools · Lighthouse" },
          { text: "npm · Vercel · Netlify" },
        ],
      },
      {
        type: "list",
        page: "skills",
        title: "Languages",
        items: [{ text: "Bengali — Native" }, { text: "English — Fluent" }],
      },
      // ---- Projects: three shipped works ----
      {
        type: "entry",
        page: "projects",
        title: "Projects",
        items: [
          {
            heading: "Portfolio & CV Builder",
            sub: "React · Vite · Tailwind CSS",
            period: "2026",
            details:
              "A platform where anyone can build their own portfolio and a profession-tailored CV, then publish both.",
          },
          {
            heading: "Task Manager",
            sub: "React · Local Storage",
            period: "2025",
            details:
              "A drag-and-drop task board with deadlines, labels and offline persistence.",
          },
          {
            heading: "Weather Dashboard",
            sub: "JavaScript · OpenWeather API",
            period: "2024",
            details:
              "• Searchable 5-day forecast with geolocation\n• Caches the last result for offline viewing",
          },
        ],
      },
      // ---- Contact page: the references line (personal information now
      // lives in the header strip) ----
      {
        type: "text",
        page: "contact",
        title: "References",
        items: [{ text: "Available on request." }],
      },
    ],
  },
};
