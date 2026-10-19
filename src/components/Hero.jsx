import { useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";
import visitorAvatar from "../assets/visitor-avatar.jpg";
import { useAuth } from "../auth/auth-context";
import { usePortfolio } from "../portfolio/portfolio-context";
import { useProfilePicture } from "../portfolio/useProfilePicture";
import { AccentText } from "../content/AccentText";

const Hero = () => {
  const { content } = usePortfolio();
  const { status, profile } = useAuth();
  const { url, uploading, error, upload } = useProfilePicture(profile?.userId);

  // Everyone starts on the cartoon avatar — signed-in or visitor — until
  // this user uploads their own picture.
  const picture = url ?? visitorAvatar;
  const fileInputRef = useRef(null);

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be picked again
    if (!file) return;
    await upload(file);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col md:flex-row items-center justify-center p-6 md:p-10 bg-gray-800 gap-8">

      <div className="flex flex-col items-center gap-3">
        <motion.div
          className="relative w-36 h-36 md:w-48 md:h-48 group"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={picture}
            alt={content?.brand || "Profile"}
            className={`w-full h-full rounded-full object-cover border-4 border-sky-400 shadow-lg transition ${uploading ? "opacity-50" : ""}`}
          />
          {/* Mobile: a camera badge pinned to the avatar. Desktop: a full
              hover overlay. One button, two presentations. Shown only when
              signed in — visitors browse the public showcase read-only. */}
          {status === "authenticated" && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Change profile picture"
              aria-label="Change profile picture"
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-sky-500 border-4 border-gray-800 flex items-center justify-center text-white shadow-lg transition hover:bg-sky-400 md:w-full md:h-full md:border-0 md:rounded-full md:bg-gray-900/70 md:hover:bg-gray-900/60 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 disabled:cursor-wait"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 md:w-7 md:h-7 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 md:w-7 md:h-7" />
              )}
              <span className="hidden md:block text-xs font-medium mt-1">
                {uploading ? "Uploading…" : "Change photo"}
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleChange}
          />
        </motion.div>
        {error && (
          <p className="text-sm text-red-400 text-center max-w-48" role="alert">
            {error}
          </p>
        )}
      </div>

      <motion.div
        className="text-center md:text-left max-w-md flex flex-col gap-4"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {content?.hero.greeting}
        </motion.h1>

        <motion.h2
          className="text-xl sm:text-2xl md:text-2xl text-sky-300 font-semibold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {content?.hero.title}
        </motion.h2>

        <motion.p
          className="text-base sm:text-lg text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <AccentText
            text={content?.hero.bio.text}
            accentClass={content?.hero.bio.accentClass}
          />
        </motion.p>

        <motion.div
          className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1, delayChildren: 1 }}
        >
          {content?.hero.skills.map((skill, index) => (
            <motion.span
              key={index}
              className={`${skill.color} text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
            >
              {skill.name}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Hero;
