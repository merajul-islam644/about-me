import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import { usePortfolio } from "../portfolio/portfolio-context";
import { useAuth } from "../auth/auth-context";

const Projects = () => {
  const { content } = usePortfolio();
  const { status } = useAuth();
  const projects = content?.projects ?? [];

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
  };

  return (
    <div className="overflow-auto h-[calc(100vh-64px)]">
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-64px)] bg-gray-800 px-6 py-10">

        <motion.h2
          className="text-4xl font-bold mb-10 text-sky-400 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Projects
        </motion.h2>

        {projects.length === 0 ? (
          <motion.div
            className="flex flex-col items-center gap-3 text-center bg-gray-700/40 border border-dashed border-white/15 rounded-2xl px-10 py-12 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <FolderOpen className="w-10 h-10 text-sky-400/70" />
            <p className="text-lg font-semibold text-gray-200">No projects yet</p>
            <p className="text-sm text-gray-400">
              {status === "authenticated"
                ? "Add your first project from Edit portfolio → Projects."
                : "Projects will appear here once the owner adds them."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-wrap justify-center gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {projects.map(({ id, title, desc, github, live }) => (
              <motion.div
                key={id}
                className="bg-gray-700 rounded-xl shadow-lg p-6 w-72 flex flex-col justify-between cursor-pointer"
                variants={cardVariants}
                whileHover={{ scale: 1.05, boxShadow: "0 15px 25px rgba(0,0,0,0.3)" }}
              >
                <div>
                  <h3 className="text-2xl font-semibold mb-2 text-white">{title}</h3>
                  <p className="text-gray-300 mb-4">{desc}</p>
                </div>
                <div className="flex gap-4 justify-center mt-4">
                  <a
                    href={github}
                    className="text-sky-400 font-semibold hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                  <a
                    href={live}
                    className="text-sky-400 font-semibold hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Live Demo
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Projects;
