import { Component } from 'react'
import { clearAllAppData } from '../../services/storage.js'
import './ErrorBoundary.css'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('TradeLab caught a rendering error:', error, info?.componentStack)
  }

  componentDidUpdate(previous) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  reset = () => this.setState({ error: null })

  resetSavedData = () => {
    const ok = window.confirm(
      'This deletes all TradeLab demo data saved in this browser (accounts, orders, watchlist and settings) and reloads. Continue?',
    )
    if (!ok) return
    clearAllAppData()
    window.location.assign('/')
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const page = this.props.variant !== 'inline'
    const Wrapper = page ? 'main' : 'div'
    return (
      <Wrapper className={`crash crash-${page ? 'page' : 'inline'}`} id={page ? 'main' : undefined}>
        <div className="crash-card" role="alert">
          <h1 className="crash-title">Something went wrong</h1>
          <p>
            TradeLab hit an unexpected problem{page ? '' : ' on this page'}. Your demo data is saved in this browser and has not been
            changed.
          </p>
          <div className="crash-actions">
            <button type="button" className="crash-btn primary" onClick={this.reset}>
              Try again
            </button>
            <button type="button" className="crash-btn" onClick={() => window.location.reload()}>
              Reload the app
            </button>
            <a className="crash-btn" href="/">
              Go to the home page
            </a>
          </div>
          <details className="crash-details">
            <summary>Technical details</summary>
            <pre>{String(error?.message ?? error)}</pre>
            <p>
              If reloading does not help, the saved data may be damaged.{' '}
              <button type="button" className="crash-link" onClick={this.resetSavedData}>
                Reset saved data
              </button>
            </p>
          </details>
        </div>
      </Wrapper>
    )
  }
}
