import './Card.css'

export default function Card({ title, actions, as: Tag = 'section', className = '', children, ...rest }) {
  return (
    <Tag className={`card${className ? ` ${className}` : ''}`} {...rest}>
      {(title || actions) && (
        <header className="card-header">
          {title && <h2 className="card-title">{title}</h2>}
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  )
}
