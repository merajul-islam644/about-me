import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Loader2, Palette } from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { isLoginConfigured } from "../lib/blocks/config";
import { startSignup } from "../lib/blocks/auth";
import { ModeTabs } from "./ModeTabs";

const highlights = [
  {
    icon: Palette,
    title: "Everything, unlocked",
    text: "Projects, skills and the story behind them — all behind one door.",
  },
];

const LoginPage = () => {
  const { login } = useAuth();
  const [pending, setPending] = useState(false);
  const configured = isLoginConfigured();
  const [searchParams] = useSearchParams();
  // "Edit portfolio" clicks from signed-out visitors arrive as
  // ?returnTo=%2Fedit — keep that destination through the hosted round-trip.
  const returnTo = searchParams.get("returnTo") || "/";

  const handleLogin = async () => {
    setPending(true);
    try {
      await login(returnTo);
      // Browser navigates away to the Blocks-hosted login; pending only
      // matters if redirectToProvider threw before navigating.
    } finally {
      setPending(false);
    }
  };

  const handleSignup = async () => {
    setPending(true);
    try {
      // Navigates to SELISE's hosted signup page; nothing is owned here.
      await startSignup(returnTo);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] relative overflow-hidden bg-gray-800 flex flex-col">
      {/* The mode strip — a visitor bounced here from "My CV" is wearing the
          CV mode and needs the way back to the portfolio showcase. */}
      <div className="relative z-10 flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>

      <div className="relative flex flex-1 items-center justify-center p-6">
      {/* Floating ambient orbs */}
      <motion.div
        aria-hidden="true"
        className="absolute -top-32 -left-32 w-112 h-112 rounded-full bg-sky-500/20 blur-3xl"
        animate={{ y: [0, 40, 0], x: [0, 25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -bottom-40 -right-24 w-120 h-120 rounded-full bg-indigo-500/20 blur-3xl"
        animate={{ y: [0, -35, 0], x: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-fuchsia-500/10 blur-3xl"
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center">
        {/* Brand panel — desktop only */}
        <motion.section
          className="hidden md:block"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-sky-400 font-semibold tracking-widest uppercase text-sm mb-4">
            Jon Doe's corner of the internet
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
            A portfolio that's{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
              yours to unlock
            </span>
          </h1>
          <p className="text-gray-300 mt-4 text-lg">
            The full picture — work, craft and code — lives behind one secure
            sign-in.
          </p>

          <ul className="mt-10 space-y-6">
            {highlights.map((item, index) => (
              <motion.li
                key={item.title}
                className="flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
              >
                <span className="shrink-0 w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-400/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-sky-400" />
                </span>
                <span>
                  <span className="block text-white font-semibold">
                    {item.title}
                  </span>
                  <span className="block text-gray-400 text-sm mt-0.5">
                    {item.text}
                  </span>
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* Sign-in card */}
        <motion.div
          className="w-full max-w-md mx-auto bg-gray-900/70 backdrop-blur border border-white/10 rounded-2xl shadow-2xl p-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/25 mb-6">
            <Lock className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-gray-400 mt-1">
            Sign in to continue to Jon Doe's space.
          </p>

          {!configured && (
            <div className="mt-6 text-left text-sm text-yellow-300 bg-yellow-900/40 border border-yellow-700/50 rounded-lg p-3">
              Login is not configured. Register{" "}
              <code className="text-yellow-200">
                {window.location.origin}/login/callback
              </code>{" "}
              as a redirect URI on the OIDC client, and set{" "}
              <code className="text-yellow-200">VITE_BLOCKS_OIDC_CLIENT_ID</code>{" "}
              in <code className="text-yellow-200">.env.local</code>.
            </div>
          )}

          <motion.button
            onClick={handleLogin}
            disabled={!configured || pending}
            className="mt-8 w-full py-3 rounded-xl bg-linear-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: configured && !pending ? 1.02 : 1 }}
            whileTap={{ scale: configured && !pending ? 0.98 : 1 }}
          >
            {pending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting…
              </>
            ) : (
              <>
                Sign in securely
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          <p className="text-xs text-gray-500 mt-5 text-center leading-relaxed">
            You'll sign in on SELISE Blocks' secure hosted page and be brought
            straight back here.
          </p>

          <p className="text-sm text-gray-400 mt-3 text-center">
            New here?{" "}
            <button
              type="button"
              onClick={handleSignup}
              disabled={!configured || pending}
              className="text-sky-400 hover:underline font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create an account
            </button>
          </p>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;
