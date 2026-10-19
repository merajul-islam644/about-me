import { Outlet } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { usePortfolio } from "../portfolio/portfolio-context";
import { LoadingScreen } from "../auth/guards";

// Holds every signed-in route until the user's portfolio content exists, so
// no view ever renders blank or flashes someone else's data. The loading
// screen is the same one the auth gate uses — identical design. Only the
// failure state adds new markup: one small message with a retry.
export const PortfolioGate = () => {
  const { status, error, refresh } = usePortfolio();

  if (status === "ready") {
    return <Outlet />;
  }

  return (
    <>
      <LoadingScreen />
      {status === "error" && (
        <div className="fixed bottom-6 inset-x-0 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-xl bg-gray-800 border border-red-500/30 px-4 py-3 shadow-xl">
            <p className="text-sm text-red-300 max-w-md">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      )}
    </>
  );
};
