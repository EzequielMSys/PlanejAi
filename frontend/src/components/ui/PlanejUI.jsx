import './PlanejUI.css'

export function PageHeader({ eyebrow, title, description, actions, icon, className = '' }) {
  return (
    <header className={`ui-page-header ${className}`.trim()}>
      <div className="ui-page-header-copy">
        {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {icon && <div className="ui-page-header-icon" aria-hidden="true">{icon}</div>}
      {actions && <div className="ui-page-header-actions">{actions}</div>}
    </header>
  )
}

export function Surface({ as: Element = 'section', className = '', children, ...props }) {
  return <Element className={`ui-surface ${className}`.trim()} {...props}>{children}</Element>
}

export function Button({ variant = 'primary', className = '', children, type = 'button', ...props }) {
  return <button type={type} className={`ui-button ui-button--${variant} ${className}`.trim()} {...props}>{children}</button>
}

export function EmptyState({ eyebrow = 'Tudo pronto', title, description, action, actionLabel, icon = '✦' }) {
  return (
    <Surface className="ui-empty-state">
      <span className="ui-empty-state-icon" aria-hidden="true">{icon}</span>
      <div><span className="ui-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>
      {action && <Button onClick={action}>{actionLabel}</Button>}
    </Surface>
  )
}

export function StatCard({ label, value, detail, tone = 'default' }) {
  return <Surface className="ui-stat" data-tone={tone}><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</Surface>
}

export function Field({ label, hint, children }) {
  return <label className="ui-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}
