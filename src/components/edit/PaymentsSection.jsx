import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../auth/auth-context";
import { FREE_PROJECT_LIMIT, isAdminProfile, useEntitlement } from "../../payments/useEntitlement";
import { createPaymentRequest, ensurePaymentSettings } from "../../payments/payments-api";

// Brand accents drive the selected tile, its radio and the confirm button —
// dynamic colors go through inline style, not Tailwind classes.
const METHOD_META = {
  bkash: { name: "bKash", accent: "#E2136E", sub: "Send Money" },
  nagad: { name: "Nagad", accent: "#F6941E", sub: "Send Money" },
};

const STATUS_STYLES = {
  pending: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  approved: "text-green-400 border-green-400/30 bg-green-400/10",
  rejected: "text-red-400 border-red-400/30 bg-red-400/10",
};

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const Radio = ({ selected, accent }) => (
  <span
    className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors"
    style={{
      borderColor: selected ? accent : "#4b5563",
      backgroundColor: selected ? accent : "#374151",
    }}
  >
    {selected && <span className="h-2 w-2 rounded-full bg-white" />}
  </span>
);

// The Upgrade tab, styled as a checkout: price card on top, payment-method
// tiles, then the transaction-ID form with a full-width confirm button. The
// admin verifies submissions in the Approvals tab; an approval flips this
// user to Pro until ApprovedUntil.
export const PaymentsSection = () => {
  const { profile } = useAuth();
  const {
    loading: entitlementLoading,
    error: entitlementError,
    requests,
    plan,
    proUntil,
    reload,
  } = useEntitlement();

  const [settings, setSettings] = useState(null);
  const [settingsError, setSettingsError] = useState(null);
  const [method, setMethod] = useState("bkash");
  const [txnId, setTxnId] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(null); // "bkash" | "nagad"
  const [notice, setNotice] = useState(null); // { kind: "ok" | "err", text }

  useEffect(() => {
    let cancelled = false;
    ensurePaymentSettings()
      .then((row) => {
        if (!cancelled) setSettings(row);
      })
      .catch((error) => {
        if (!cancelled) setSettingsError(error?.message || "Could not load payment details.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const price = settings?.PriceAmount || "299";
  const durationDays = Number.parseInt(settings?.DurationDays, 10) || 365;
  const instructions = settings?.Instructions || "";
  const numbers = {
    bkash: settings?.BkashNumber || "",
    nagad: settings?.NagadNumber || "",
  };
  const methodsAvailable = ["bkash", "nagad"].filter((key) => numbers[key]);
  const paymentsReady = methodsAvailable.length > 0;
  const activeMethod = numbers[method] ? method : methodsAvailable[0];
  const accent = METHOD_META[activeMethod]?.accent || "#E2136E";

  const copyNumber = async (key) => {
    try {
      await navigator.clipboard.writeText(numbers[key]);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked (private mode) — the number is visible anyway.
    }
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    const txn = txnId.trim();
    if (!/^[A-Za-z0-9-]{4,}$/.test(txn)) {
      setNotice({
        kind: "err",
        text: "Enter the Transaction ID from the SMS (letters/digits, at least 4 characters).",
      });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await createPaymentRequest({
        userId: profile?.userId,
        userEmail: profile?.email || "",
        method: activeMethod,
        txnId: txn,
        amount: price,
      });
      setTxnId("");
      setNotice({
        kind: "ok",
        text: "Request submitted — it shows as Pending below until your payment is verified.",
      });
      await reload();
    } catch (error) {
      const duplicate = /duplicate|unique|409|conflict/i.test(error?.message || "");
      setNotice({
        kind: "err",
        text: duplicate
          ? "This Transaction ID was already submitted."
          : error?.message || "Submitting failed — please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const history = [...requests].reverse();

  return (
    <div className="flex flex-col gap-5">
      {/* Price card — mirrors a checkout header: big price left, art right. */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gray-900/60 p-5">
        <div className="min-w-0">
          <p className="text-3xl font-bold text-white">৳{price}</p>
          <p className="mt-1 text-sm text-gray-400">Pro pass — {durationDays} days</p>
          <p className="mt-2 text-xs">
            {entitlementLoading ? (
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking your plan…
              </span>
            ) : plan === "pro" ? (
              <span className="inline-flex items-center gap-1 text-green-400">
                <BadgeCheck className="w-3.5 h-3.5" />
                Pro active{proUntil ? ` until ${formatDate(proUntil)}` : ""}
              </span>
            ) : (
              <span className="text-gray-500">
                Free plan · {FREE_PROJECT_LIMIT} projects · PDF locked
              </span>
            )}
          </p>
          {entitlementError && <p className="mt-2 text-xs text-red-400">{entitlementError}</p>}
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-linear-to-br from-pink-500/30 to-indigo-500/30">
          <Sparkles className="w-6 h-6 text-pink-400" />
        </div>
      </div>

      {settingsError && <p className="text-sm text-red-400">{settingsError}</p>}
      {settings && !paymentsReady && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-400">
          {isAdminProfile(profile)
            ? "Your payment numbers aren't set yet — open the Approvals tab (next to Upgrade) to add your bKash/Nagad numbers."
            : "Payment numbers are being set up — please check back soon."}
        </p>
      )}

      {paymentsReady && (
        <form onSubmit={submitRequest} className="flex flex-col gap-4">
          {/* Method picker */}
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-100">Choose a Payment Method</h3>
              <div className="mt-2.5 h-px bg-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
              {["bkash", "nagad"].map((key) => {
                const meta = METHOD_META[key];
                const available = Boolean(numbers[key]);
                const selected = activeMethod === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => available && setMethod(key)}
                    disabled={!available}
                    className="flex flex-col items-center gap-3 rounded-xl border bg-gray-900/60 px-3 py-4 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: selected ? meta.accent : "rgba(255,255,255,0.1)" }}
                  >
                    <Radio selected={selected} accent={meta.accent} />
                    <span
                      className="text-lg font-extrabold italic leading-none"
                      style={{ color: meta.accent }}
                    >
                      {meta.name}
                    </span>
                    <span className="text-xs text-gray-500">{meta.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Where to send the money */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-gray-900/60 p-4">
            <div className="min-w-0">
              <p
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: accent }}
              >
                {METHOD_META[activeMethod].name} · Send ৳{price} to
              </p>
              <p className="mt-0.5 truncate text-lg font-semibold tracking-wide text-gray-100">
                {numbers[activeMethod] || "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyNumber(activeMethod)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-white/25 hover:text-white"
            >
              {copied === activeMethod ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>
          {instructions && <p className="text-sm text-gray-400">{instructions}</p>}

          {/* Transaction ID */}
          <label className="block">
            <span className="text-sm font-medium text-gray-300">Transaction ID</span>
            <input
              type="text"
              value={txnId}
              placeholder="From the confirmation SMS"
              onChange={(event) => setTxnId(event.target.value)}
              className="mt-1 w-full rounded-lg bg-gray-900 border border-white/10 px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-white/25 focus:outline-none transition-colors"
            />
          </label>

          {/* Full-width confirm, colored by the selected method */}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-40"
            style={{ backgroundColor: accent }}
          >
            {busy ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
              </span>
            ) : (
              `Confirm & Submit ৳${price}`
            )}
          </button>

          {notice && (
            <p className={`text-xs ${notice.kind === "ok" ? "text-green-400" : "text-red-400"}`}>
              {notice.text}
            </p>
          )}

          <p className="text-xs leading-relaxed text-gray-500">
            Pro stays active for {durationDays} days from approval. No automatic renewal — submit
            a new payment to extend.
          </p>
          <p className="-mt-3 text-xs text-gray-500">
            By submitting, you confirm this Transaction ID is from your own{" "}
            {METHOD_META[activeMethod].name} payment of ৳{price}.
          </p>
        </form>
      )}

      {/* My requests */}
      {history.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-medium text-gray-300">Your payment requests</h4>
          <ul className="flex flex-col gap-2">
            {history.map((request) => (
              <li
                key={request.ItemId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-gray-900/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-200">
                    {METHOD_META[request.Method]?.name || request.Method} · {request.TxnId}
                    {request.Amount ? ` · ৳${request.Amount}` : ""}
                  </p>
                  {request.CreatedDate && (
                    <p className="text-xs text-gray-500">{formatDate(request.CreatedDate)}</p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[request.Status] || STATUS_STYLES.pending}`}
                >
                  {request.Status === "approved" && <BadgeCheck className="w-3.5 h-3.5" />}
                  {request.Status === "rejected" && <XCircle className="w-3.5 h-3.5" />}
                  {request.Status === "pending" && <Loader2 className="w-3.5 h-3.5" />}
                  {request.Status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
