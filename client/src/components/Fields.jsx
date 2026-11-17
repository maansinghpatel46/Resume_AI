export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
  required,
  full,
  error,
}) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>
        {label}
        {required && <i aria-hidden="true"> *</i>}
      </span>
      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  maxLength,
  placeholder,
  hint,
}) {
  return (
    <label className="field full">
      <span>{label}</span>
      <textarea
        rows={rows}
        value={value || ""}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {(hint || maxLength) && (
        <small className="field-hint">
          {hint}
          {maxLength ? ` ${(value || "").length}/${maxLength}` : ""}
        </small>
      )}
    </label>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
