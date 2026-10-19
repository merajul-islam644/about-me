import { motion } from "framer-motion";
import { usePortfolio } from "../portfolio/portfolio-context";

const Skills = () => {
  const { content } = usePortfolio();

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
  };

  return (
    <div className="overflow-auto h-[calc(100vh-64px)]">
      <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center bg-gray-900 px-6">
        <motion.h2
          className="text-4xl font-bold mb-10 text-sky-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Skills
        </motion.h2>

        <motion.div
          className="flex flex-wrap justify-center items-center gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {content?.skills.map((skill) => (
            <motion.span
              key={skill}
              className="bg-gray-700 px-6 py-3 rounded-full shadow cursor-default hover:bg-sky-500 transition-all duration-300 text-white font-medium"
              variants={badgeVariants}
              whileHover={{ scale: 1.1 }}
            >
              {skill}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Skills;
