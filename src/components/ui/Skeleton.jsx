import './Skeleton.css'

export default function Skeleton({ height = 16, width = '100%', radius, className = '' }) {
  return (
    <span
      className={`skeleton${className ? ` ${className}` : ''}`}
      style={{ height, width, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}
