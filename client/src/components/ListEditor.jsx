// Generic editor for repeatable entries (education, experience, projects, certifications, languages).
export default function ListEditor({
  title,
  items,
  onChange,
  blank,
  addLabel,
  max = 15,
  emptyText,
  renderFields,
}) {
  const update = (i, patch) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { ...blank }]);

  return (
    <div className="list-editor">
      {items.length === 0 && <p className="empty-note">{emptyText}</p>}
      {items.map((item, i) => (
        <div className="entry-card" key={`${i}-${items.length}`}>
          <div className="entry-head">
            <strong>
              {title} {i + 1}
            </strong>
            <button
              type="button"
              className="btn btn-danger-ghost btn-sm"
              onClick={() => remove(i)}
              aria-label={`Delete ${title} ${i + 1}`}
            >
              Delete
            </button>
          </div>
          <div className="grid-2">
            {renderFields(item, (patch) => update(i, patch), i)}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline"
        onClick={add}
        disabled={items.length >= max}
      >
        + {addLabel}
      </button>
      {items.length >= max && (
        <small className="field-hint"> Maximum of {max} entries reached.</small>
      )}
    </div>
  );
}
