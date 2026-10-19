import visitorAvatar from "../assets/visitor-avatar.jpg";
import { motion } from "framer-motion";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";
import { useProfilePicture } from "../portfolio/useProfilePicture";
import { AccentText } from "../content/AccentText";
import { ModeTabs } from "./ModeTabs";

const About = () => {
  const { content } = usePortfolio();
  const { profile } = useAuth();
  const { url } = useProfilePicture(profile?.userId);

  // Everyone starts on the cartoon avatar — signed-in or visitor — until
  // this user uploads their own picture.
  const picture = url ?? visitorAvatar;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-900 flex flex-col">
      {/* Landing mode switch — Portfolio | CV, right under the navbar. */}
      <div className="flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-10 gap-8 md:gap-12">
        <motion.img
          src={picture}
          alt={content?.brand || "Profile"}
          className="w-48 h-48 md:w-64 md:h-64 rounded-xl object-cover border-4 border-sky-500 shadow-lg"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        />

        <motion.div
          className="max-w-xl text-center md:text-left flex flex-col gap-4"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h2 className="text-4xl font-bold mb-4 text-sky-400">About Me</h2>

          {content?.about.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? "text-gray-300 text-lg leading-relaxed"
                  : "text-gray-400 text-base"
              }
            >
              <AccentText text={paragraph.text} accentClass={paragraph.accentClass} />
            </p>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default About;
