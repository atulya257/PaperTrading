import './SegmentedControl.css'

export default function SegmentedControl({ label, options, value, onChange, size = 'md', className = '' }) {
  return (
    <div className={`segmented segmented-${size} ${className}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`segment${o.tone ? ` tone-${o.tone}` : ''}`}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
