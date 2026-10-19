import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";
import { TextField, TextAreaField } from "./fields";
import {
  ensurePaymentSettings,
  getAllPaymentRequests,
  savePaymentSettings,
  updatePaymentRequest,
} from "../../payments/payments-api";

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

// Admin-only tab: verify submitted bKash/Nagad transactions against the real
// bKash/Nagad SMS or app, then approve (grants Pro for DurationDays) or
// reject. Also holds the settings editor — numbers, price and duration live
// as data, so changing the price never needs a redeploy.
export const AdminPaymentsSection = () => {
  const [requests, setRequests] = useState([]);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null); // editable copy of settings
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [copied, setCopied] = useState(null);
  const [settingsNotice, setSettingsNotice] = useState(null); // { kind, text }
  const [savingSettings, setSavingSettings] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, settingsRow] = await Promise.all([
        getAllPaymentRequests(),
        ensurePaymentSettings(),
      ]);
      setRequests(rows);
      setSettings(settingsRow);
      setForm({
        BkashNumber: settingsRow.BkashNumber || "",
        NagadNumber: settingsRow.NagadNumber || "",
        PriceAmount: settingsRow.PriceAmount || "",
        Currency: settingsRow.Currency || "",
        DurationDays: settingsRow.DurationDays || "",
        Instructions: settingsRow.Instructions || "",
      });
    } catch (loadError) {
      setError(loadError?.message || "Could not load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pending = requests
    .filter((r) => r.Status === "pending")
    .sort((a, b) => String(b.CreatedDate || "").localeCompare(String(a.CreatedDate || "")));
  const reviewed = requests
    .filter((r) => r.Status !== "pending")
    .sort((a, b) => String(b.CreatedDate || "").localeCompare(String(a.CreatedDate || "")));

  const review = async (request, decision) => {
    setBusyId(request.ItemId);
    setError(null);
    try {
      const durationDays = Number.parseInt(settings?.DurationDays, 10) || 365;
      const patch =
        decision === "approved"
          ? {
              Status: "approved",
              ApprovedUntil: new Date(Date.now() + durationDays * 86400000).toISOString(),
              ReviewNote: "",
            }
          : { Status: "rejected", ApprovedUntil: "", ReviewNote: "" };
      await updatePaymentRequest(request.ItemId, patch);
      await load();
    } catch (reviewError) {
      setError(reviewError?.message || "Review failed — please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const copyTxn = async (txnId) => {
    try {
      await navigator.clipboard.writeText(txnId);
      setCopied(txnId);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked — the ID is visible anyway.
    }
  };

  const saveSettings = async () => {
    const durationDays = Number.parseInt(form.DurationDays, 10);
    if (!Number.isFinite(durationDays) || durationDays < 1) {
      setSettingsNotice({ kind: "err", text: "Duration (days) must be a whole number of at least 1." });
      return;
    }
    setSavingSettings(true);
    setSettingsNotice(null);
    try {
      await savePaymentSettings(settings.ItemId, {
        BkashNumber: form.BkashNumber.trim(),
        NagadNumber: form.NagadNumber.trim(),
        PriceAmount: form.PriceAmount.trim(),
        Currency: form.Currency.trim() || "BDT",
        DurationDays: String(durationDays),
        Instructions: form.Instructions.trim(),
      });
      setSettingsNotice({ kind: "ok", text: "Payment settings saved." });
      await load();
    } catch (saveError) {
      setSettingsNotice({
        kind: "err",
        text: saveError?.message || "Saving settings failed — please try again.",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading payments…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Pending review queue */}
      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-sky-400">
          Pending reviews {pending.length > 0 && `(${pending.length})`}
        </h3>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {pending.length === 0 ? (
          <p className="text-sm text-gray-500">No pending payment requests.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((request) => (
              <li key={request.ItemId} className="rounded-xl border border-white/10 bg-gray-900/50 p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-100">
                      {request.Method === "nagad" ? "Nagad" : "bKash"} · ৳{request.Amount || "?"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.UserEmail || request.UserId}
                      {request.CreatedDate ? ` · ${formatDate(request.CreatedDate)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyTxn(request.TxnId)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-gray-900 px-3 py-1.5 text-xs font-mono text-gray-300 transition-colors hover:border-sky-400/40 hover:text-sky-300"
                  >
                    {copied === request.TxnId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> {request.TxnId}
                      </>
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => review(request, "approved")}
                    disabled={busyId !== null}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-green-500/10 border border-green-400/30 text-green-400 hover:bg-green-500/20 hover:text-green-300 disabled:opacity-40 disabled:cursor-wait transition-colors"
                  >
                    {busyId === request.ItemId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BadgeCheck className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => review(request, "rejected")}
                    disabled={busyId !== null}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-red-500/10 border border-red-400/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-40 disabled:cursor-wait transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Settings editor */}
      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-sky-400">Payment settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="bKash number"
            value={form.BkashNumber}
            placeholder="01XXXXXXXXX"
            onChange={(value) => setForm({ ...form, BkashNumber: value })}
          />
          <TextField
            label="Nagad number"
            value={form.NagadNumber}
            placeholder="01XXXXXXXXX"
            onChange={(value) => setForm({ ...form, NagadNumber: value })}
          />
          <TextField
            label="Price (amount)"
            value={form.PriceAmount}
            placeholder="299"
            onChange={(value) => setForm({ ...form, PriceAmount: value })}
          />
          <TextField
            label="Currency label"
            value={form.Currency}
            placeholder="BDT"
            onChange={(value) => setForm({ ...form, Currency: value })}
          />
        </div>
        <TextField
          label="Pro duration (days per approval)"
          value={form.DurationDays}
          placeholder="365"
          hint="How long one approved payment keeps a user on Pro."
          onChange={(value) => setForm({ ...form, DurationDays: value })}
        />
        <TextAreaField
          label="Payment instructions"
          value={form.Instructions}
          rows={3}
          placeholder="Shown on the Upgrade tab under the numbers."
          onChange={(value) => setForm({ ...form, Instructions: value })}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveSettings}
            disabled={savingSettings}
            className="self-start inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-sky-500/10 border border-sky-400/30 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 disabled:opacity-40 disabled:cursor-wait transition-colors"
          >
            {savingSettings ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save settings
              </>
            )}
          </button>
          {settingsNotice && (
            <p className={`text-xs ${settingsNotice.kind === "ok" ? "text-green-400" : "text-red-400"}`}>
              {settingsNotice.text}
            </p>
          )}
        </div>
      </section>

      {/* Reviewed history */}
      {reviewed.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-sky-400">Reviewed</h3>
          <ul className="flex flex-col gap-2">
            {reviewed.map((request) => (
              <li
                key={request.ItemId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-gray-900/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-200">
                    {request.Method === "nagad" ? "Nagad" : "bKash"} · {request.TxnId}
                    {request.Amount ? ` · ৳${request.Amount}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {request.UserEmail || request.UserId}
                    {request.Status === "approved" && request.ApprovedUntil
                      ? ` · Pro until ${formatDate(request.ApprovedUntil)}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                    request.Status === "approved"
                      ? "text-green-400 border-green-400/30 bg-green-400/10"
                      : "text-red-400 border-red-400/30 bg-red-400/10"
                  }`}
                >
                  {request.Status === "approved" ? (
                    <BadgeCheck className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  {request.Status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
