import mypic from "../assets/original-profile-picture.png";
import { motion } from "framer-motion";

const About = () => {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row items-center justify-center p-6 md:p-10 bg-gray-900 gap-8 md:gap-12">
      <motion.img
        src={mypic}
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

        <p className="text-gray-300 text-lg leading-relaxed">
          I am a{" "}
          <span className="font-semibold text-white">
            Software Engineering Intern at SELISE Group
          </span>
          , building scalable and modern web applications. I enjoy solving
          challenging problems, learning new technologies, and creating
          user-friendly solutions that make a real impact.
        </p>

        <p className="text-gray-400 text-base">
          Currently focusing on improving my skills in
          <span className="text-sky-400 font-medium"> React.js</span>,
          <span className="text-sky-400 font-medium"> Next.js</span>, and modern
          frontend workflows while contributing to real-world projects.
        </p>
      </motion.div>
    </div>
  );
};

export default About;
