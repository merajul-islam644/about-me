import React from "react";
import { motion } from "framer-motion";
import { Mail, Github, Linkedin } from "lucide-react";

const Contact = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, when: "beforeChildren" },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 120 } },
  };

  const iconHover = { scale: 1.1, rotate: 5 };

  return (
    <motion.div
      className="h-[calc(100vh-64px)] flex justify-center items-center bg-linear-to-br from-sky-900 to-pink-900 px-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="max-w-lg w-full bg-gray-800 rounded-3xl shadow-2xl p-10"
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
      >
        <motion.h2
          className="text-4xl font-bold text-sky-400 mb-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Get in Touch
        </motion.h2>

        <motion.p
          className="text-gray-300 text-lg mb-8 text-center"
          variants={itemVariants}
        >
          I’m open to discussing new projects, freelance opportunities, or collaborations. 
          Let’s create something amazing together!
        </motion.p>

        <motion.div className="flex flex-col gap-4 items-center mb-6">
          <motion.a
            href="mailto:meraj@example.com"
            className="flex items-center gap-2 text-gray-200 font-medium bg-gray-700 px-6 py-3 rounded-full shadow-md hover:bg-sky-500 transition-colors duration-300"
            whileHover={iconHover}
          >
            <Mail size={20} className="text-white"/>
            meraj@example.com
          </motion.a>

          <motion.a
            href="#"
            className="flex items-center gap-2 text-gray-200 font-medium bg-gray-700 px-6 py-3 rounded-full shadow-md hover:bg-indigo-500 transition-colors duration-300"
            whileHover={iconHover}
          >
            <Github size={20} className="text-white"/>
            github.com/yourusername
          </motion.a>

          <motion.a
            href="#"
            className="flex items-center gap-2 text-gray-200 font-medium bg-gray-700 px-6 py-3 rounded-full shadow-md hover:bg-blue-500 transition-colors duration-300"
            whileHover={iconHover}
          >
            <Linkedin size={20} className="text-white"/>
            linkedin.com/in/yourprofile
          </motion.a>
        </motion.div>

        <motion.div className="text-center">
          <motion.a
            href="mailto:meraj@example.com"
            className="inline-block bg-linear-to-r from-sky-500 to-pink-500 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
            whileTap={{ scale: 0.95 }}
          >
            Send Email
          </motion.a>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Contact;
