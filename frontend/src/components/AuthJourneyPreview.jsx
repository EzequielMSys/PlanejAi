import ConnectedPages from './ConnectedPages'
import CatReadingIcon from './CatReadingIcon'

/** Ilustração editorial compartilhada pelo login e pelo cadastro. */
export default function AuthJourneyPreview() {
  return <div className="auth-first-page" aria-hidden="true">
    <div className="auth-first-page-art">
      <span className="auth-first-page-star">✦</span>
      <CatReadingIcon />
      <ConnectedPages className="auth-first-page-pages" />
      <span className="auth-first-page-line" />
    </div>
    <div className="auth-first-page-copy">
      <span>UMA PÁGINA DE CADA VEZ</span>
      <p>O que você aprende também conta sua história.</p>
      <small>Um espaço para aprender no seu tempo.</small>
    </div>
  </div>
}
