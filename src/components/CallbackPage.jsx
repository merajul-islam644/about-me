import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { completeLogin } from "../lib/blocks/auth";

const CallbackPage = () => {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const ran = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // One-shot: Strict Mode double-invokes effects, and the callback must
    // only ever be completed once.
    if (ran.current) return;
    ran.current = true;

    const finish = async () => {
      const result = await completeLogin(window.location.href);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      // Confirms the session cookie actually landed and populates claims
      // before the app leaves the callback screen.
      await refresh();
      navigate(result.returnTo || "/", { replace: true });
    };

    finish();
  }, [refresh, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-6">
      {error ? (
        <div className="w-full max-w-sm bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h1 className="text-xl font-bold text-red-400 mb-2">Sign-in failed</h1>
          <p className="text-gray-400 mb-6 break-words">{error}</p>
          <Link
            to="/login"
            className="inline-block w-full py-2.5 rounded bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <p className="text-gray-400 animate-pulse">Completing sign-in…</p>
      )}
    </div>
  );
};

export default CallbackPage;
