// Shared controlled inputs for the edit forms — dark theme consistent with
// the app's glass-card look (bg-gray-900 surfaces, sky-400 focus accents).

const inputClass =
  "mt-1 w-full rounded-lg bg-gray-900/70 border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-sky-400 focus:outline-none transition-colors";

export const TextField = ({ label, value, onChange, placeholder, hint }) => (
  <label className="block">
    <span className="text-sm font-medium text-gray-300">{label}</span>
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
    />
    {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
  </label>
);

export const TextAreaField = ({ label, value, onChange, placeholder, hint, rows = 4 }) => (
  <label className="block">
    <span className="text-sm font-medium text-gray-300">{label}</span>
    <textarea
      value={value}
      placeholder={placeholder}
      rows={rows}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputClass} resize-y`}
    />
    {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
  </label>
);

export const SelectField = ({ label, value, onChange, options, hint }) => (
  <label className="block">
    <span className="text-sm font-medium text-gray-300">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputClass} bg-gray-900`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
  </label>
);
