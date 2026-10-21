import { useState } from "react";
import { Loader2, X } from "lucide-react";

// The New CV modal — one fresh, blank document and a name for it. The
// title is required and may not duplicate an existing CV on the shelf
// shelf (checked case-insensitively); problems show inline under the field.
// Enter submits, Escape closes.
export const NewCvModal = ({
  open,
  busy,
  error,
  titleValue = "",
  onTitleChange = () => {},
  existingTitles = [],
  onCreate = () => {},
  onClose,
}) => {
  // The title's own validation problem — set on submit, cleared on typing
  // and on every close path (X, Cancel, backdrop, Escape), so a reopened
  // modal never greets with the last attempt's complaint.
  const [titleError, setTitleError] = useState(null);

  if (!open) return null;

  const close = () => {
    setTitleError(null);
    onClose();
  };

  const validateTitle = () => {
    const trimmed = titleValue.trim();
    if (!trimmed) return "Give the CV a title — it cannot be empty.";
    const clash = existingTitles.some(
      (name) => (name ?? "").trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (clash)
      return `You already have a CV named “${trimmed}” — pick another title.`;
    return null;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const problem = validateTitle();
    if (problem) {
      setTitleError(problem);
      return;
    }
    onCreate();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={close}
      onKeyDown={(event) => event.key === "Escape" && close()}
      role="dialog"
      aria-modal="true"
      aria-label="New CV"
    >
      <div
        className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">New CV</h3>
            <p className="mt-0.5 text-sm text-gray-400">
              A fresh, blank document — the headline carries your
              portfolio&apos;s personal details, and you grow it section by
              section.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            title="Close"
            aria-label="Close"
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* The new CV's title — what the shelf card and rename flow show. */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-400">CV Title</span>
            <input
              type="text"
              value={titleValue}
              onChange={(event) => {
                setTitleError(null);
                onTitleChange(event.target.value);
              }}
              autoFocus
              disabled={busy}
              maxLength={60}
              placeholder="e.g. Frontend Developer CV"
              aria-invalid={Boolean(titleError)}
              className={`w-full rounded-lg border bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none ${
                titleError
                  ? "border-red-400/60 focus:border-red-400"
                  : "border-white/10 focus:border-sky-400"
              }`}
            />
            {titleError && (
              <span className="text-xs text-red-400" role="alert">
                {titleError}
              </span>
            )}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Create CV
            </button>
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="cursor-pointer rounded-full border border-white/10 px-4 py-1.5 text-sm font-semibold text-gray-300 transition-colors hover:border-sky-400/40 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>
            {error && (
              <span className="text-xs text-red-400" role="alert">
                {error}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCvModal;
