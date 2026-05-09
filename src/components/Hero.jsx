import { motion } from "framer-motion";
import mypic from "../assets/original-profile-picture.png"; 

const Hero = () => {
  const skills = [
    { name: "HTML & CSS", color: "bg-yellow-400 text-gray-800" },
    { name: "Tailwind CSS", color: "bg-indigo-500" },
    { name: "JavaScript", color: "bg-green-500" },
    { name: "React", color: "bg-sky-500" },
    { name: "Next.js", color: "bg-pink-500" },
  ]
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col md:flex-row items-center justify-center p-6 md:p-10 bg-gray-800 gap-8">
      
      <motion.img
        src={mypic}
        alt="Merajul"
        className="w-36 h-36 md:w-48 md:h-48 rounded-full object-cover border-4 border-sky-400 shadow-lg"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      />

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
          Hi, I'm Merajul
        </motion.h1>

        <motion.h2
          className="text-xl sm:text-2xl md:text-2xl text-sky-300 font-semibold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Frontend Developer | React Enthusiast
        </motion.h2>

        <motion.p
          className="text-base sm:text-lg text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          I build modern, scalable, and user-friendly web applications using{" "}
          <span className="text-sky-400 font-medium">React, Next.js, and Tailwind CSS</span>. 
          Passionate about clean code, responsive design, and creating seamless digital experiences. 
          Always eager to learn new technologies and deliver impactful solutions.
        </motion.p>

        <motion.div
          className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1, delayChildren: 1 }}
        >
          {skills.map((skill, index) => (
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
