import mypic from "../assets/original-profile-picture.png";
import visitorAvatar from "../assets/visitor-avatar.jpg";
import { motion } from "framer-motion";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";
import { useProfilePicture } from "../portfolio/useProfilePicture";
import { AccentText } from "../content/AccentText";

const About = () => {
  const { content } = usePortfolio();
  const { status, profile } = useAuth();
  const { url } = useProfilePicture(profile?.userId);

  // Signed-in: this user's uploaded picture, the bundled one until storage
  // answers. Visitors: the cartoon avatar — the public showcase stays photo-free.
  const picture = url ?? (status === "unauthenticated" ? visitorAvatar : mypic);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row items-center justify-center p-6 md:p-10 bg-gray-900 gap-8 md:gap-12">
      <motion.img
        src={picture}
        alt="Merajul"
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
  );
};

export default About;
