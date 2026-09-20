import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import './Button.css'

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  to,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  const classes = `btn btn-${variant} btn-${size}${block ? ' btn-block' : ''}${className ? ` ${className}` : ''}`

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Loader2 size={18} className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}
