import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import './TextField.css'

const TextField = forwardRef(function TextField({ label, error, hint, className = '', type, ...inputProps }, ref) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
  const isPassword = type === 'password'
  const [showPassword, setShowPassword] = useState(false)

  const input = (
    <input
      id={id}
      ref={ref}
      className="field-input"
      type={isPassword && showPassword ? 'text' : type}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      {...inputProps}
    />
  )

  return (
    <div className={`field${error ? ' field-invalid' : ''}${className ? ` ${className}` : ''}`}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {isPassword ? (
        <div className="field-control">
          {input}
          <button
            type="button"
            className="field-reveal"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            aria-controls={id}
          >
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      ) : (
        input
      )}
      {hint && !error && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})

export default TextField
