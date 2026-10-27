import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Github, Linkedin, Link2, Loader2 } from "lucide-react";
import { usePortfolio } from "../portfolio/portfolio-context";
import { sendContactEmail } from "../lib/blocks/mail";
import { metaText, usePageMeta } from "../lib/usePageMeta";
import { ModeTabs } from "./ModeTabs";

const Contact = () => {
  const { content } = usePortfolio();
  const contact = content?.contact;

  // The tab pair restates the invitation — the intro line already says it.
  usePageMeta({
    title: `Contact — ${content?.brand ?? "Portfolio"}`,
    description: metaText(contact?.intro),
  });

  // The contact form delivers to the owner's email link address.
  const ownerEmail = contact?.mail?.href?.replace(/^mailto:/i, "").trim() ?? "";

  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot: invisible to people, irresistible to form-filling bots. Any
  // value here silently fails the send on the webhook side.
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState(null);

  const inputClass =
    "w-full rounded-lg bg-gray-900/70 border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-sky-400 focus:outline-none transition-colors";

  const handleSend = async (event) => {
    event.preventDefault();
    if (sending) return;
    setFormError(null);
    if (!fromName.trim() || !message.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail.trim())) {
      setFormError("Please add your name, a valid email and a message.");
      return;
    }
    setSending(true);
    try {
      await sendContactEmail({
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim(),
        message: message.trim(),
        website,
      });
      setSent(true);
      setFromName("");
      setFromEmail("");
      setMessage("");
      setTimeout(() => setSent(false), 4000);
    } catch (error) {
      setFormError(error?.message || "Sending failed — please try again.");
    } finally {
      setSending(false);
    }
  };

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

  // Icons and per-type hover colors are design, not content — only the
  // href/label values below are editable per user.
  const linkClass = {
    mail: "hover:bg-sky-500",
    github: "hover:bg-indigo-500",
    linkedin: "hover:bg-blue-500",
    extra: "hover:bg-emerald-500",
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-linear-to-br from-sky-900 to-pink-900 flex flex-col">
      {/* Landing mode switch — Portfolio | CV, right under the navbar. */}
      <div className="flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>
      <motion.div
        className="flex-1 flex justify-center items-center px-6 pb-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div
          className="max-w-lg w-full bg-gray-800 rounded-3xl shadow-2xl p-10"
          variants={cardVariants}
          whileHover={{ scale: 1.02 }}
        >
          <motion.h1
            className="text-4xl font-bold text-sky-400 mb-6 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Get in Touch
          </motion.h1>

          <motion.p
            className="text-gray-300 text-lg mb-8 text-center"
            variants={itemVariants}
          >
            {contact?.intro}
          </motion.p>

          <motion.div className="flex flex-col gap-4 items-center mb-6">
            <motion.a
              href={contact?.mail.href}
              className={`flex items-center gap-2 text-gray-200 font-medium bg-gray-700 px-6 py-3 rounded-full shadow-md ${linkClass.mail} transition-colors duration-300`}
              whileHover={iconHover}
            >
              <Mail size={20} className="text-white"/>
              {contact?.mail.label}
            </motion.a>

            <motion.a
              href={contact?.github.href}
              className={`flex items-center gap-2 text-gray-200 font-medium bg-gray-700 px-6 py-3 rounded-full shadow-md ${linkClass.github} transition-colors duration-300`}
              whileHover={iconHover}
            >
              <Github size={20} className="text-white"/>
              {contact?.github.label}
            </motion.a>

            <motion.a
              href={contact?.linkedin.href}
              className={`flex items-center gap-2 text-gray-200 font-medium bg-gray-700 px-6 py-3 rounded-full shadow-md ${linkClass.linkedin} transition-colors duration-300`}
              whileHover={iconHover}
            >
              <Linkedin size={20} className="text-white"/>
              {contact?.linkedin.label}
            </motion.a>

            {/* Extra contacts added from the edit page — generic link icon. */}
            {(contact?.extras ?? []).map((extra) => (
              <motion.a
                key={extra.id}
                href={extra.href}
                className={`flex items-center gap-2 text-gray-200 font-medium bg-gray-700 px-6 py-3 rounded-full shadow-md ${linkClass.extra} transition-colors duration-300`}
                whileHover={iconHover}
              >
                <Link2 size={20} className="text-white" />
                {extra.label}
              </motion.a>
            ))}
          </motion.div>

          {/* Contact form: delivers a real email to the owner's inbox. The
              gradient pill keeps the old Send Email button's styling. */}
          {ownerEmail ? (
            <form
              onSubmit={handleSend}
              className="rounded-xl bg-gray-900/50 border border-white/10 p-4 flex flex-col gap-3"
            >
              <p className="text-sm font-medium text-gray-300">Send a message</p>
              <input
                type="text"
                name="website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              <input
                type="text"
                value={fromName}
                onChange={(event) => setFromName(event.target.value)}
                placeholder="Your name"
                className={inputClass}
              />
              <input
                type="email"
                value={fromEmail}
                onChange={(event) => setFromEmail(event.target.value)}
                placeholder="Your email"
                className={inputClass}
              />
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Your message"
                rows={4}
                className={`${inputClass} resize-none`}
              />
              <motion.button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 self-center bg-linear-to-r from-sky-500 to-pink-500 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-wait disabled:hover:scale-100 transition-transform duration-300"
                whileTap={{ scale: 0.95 }}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send Email"
                )}
              </motion.button>
              {sent && (
                <p className="text-sm text-green-400 text-center" role="status">
                  Email sent — thanks for reaching out!
                </p>
              )}
              {formError && (
                <p className="text-sm text-red-400 text-center" role="alert">
                  {formError}
                </p>
              )}
            </form>
          ) : (
            <motion.div className="text-center">
              <motion.a
                href={contact?.mail.href}
                className="inline-block bg-linear-to-r from-sky-500 to-pink-500 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
                whileTap={{ scale: 0.95 }}
              >
                Send Email
              </motion.a>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Contact;
