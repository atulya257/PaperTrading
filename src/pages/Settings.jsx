import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Dialog from '../components/ui/Dialog.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useMarket } from '../context/MarketContext.jsx'
import { INITIAL_CAPITAL } from '../config/constants.js'
import { useMarketSnapshot } from '../hooks/useMarketData.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { isPersistent } from '../services/storage.js'
import { formatINR } from '../utils/format.js'
import './Settings.css'

export default function Settings() {
  usePageTitle('Settings')
  const { user, logout } = useAuth()
  const { resetSimulator } = useAccount()
  const market = useMarket()
  const { status } = useMarketSnapshot()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  const speeds = market.getSpeedOptions()
  const activeSpeed = speeds.find((s) => s.value === status.speed)

  async function confirmReset() {
    setResetting(true)
    await resetSimulator()
    setResetting(false)
    setConfirmingReset(false)
  }

  function signOut() {
    logout()
  }

  return (
    <div className="settings">
      <header className="page-head">
        <h1>Settings</h1>
      </header>

      <Card title="Simulated market">
        {speeds.length > 0 && (
          <div className="setting">
            <div className="setting-text">
              <h3>Speed</h3>
              <p>{activeSpeed?.description}</p>
            </div>
            <SegmentedControl
              label="Simulation speed"
              options={speeds.map((s) => ({ value: s.value, label: s.label }))}
              value={status.speed}
              onChange={(value) => market.setSpeed(value)}
            />
          </div>
        )}
      </Card>

      <Card title="Account">
        <div className="setting">
          <div className="setting-text">
            <h3>{user.isGuest ? 'Guest demo account' : user.name}</h3>
            <p>{user.isGuest ? 'Not tied to an email.' : user.email}</p>
          </div>
          <Button variant="secondary" onClick={signOut}>
            Sign out
          </Button>
        </div>
        {!isPersistent() && (
          <p className="setting-warning" role="alert">
            <AlertTriangle size={16} aria-hidden="true" /> Your browser is blocking local storage, so progress will be lost when you close this tab.
          </p>
        )}
      </Card>

      <Card title="Reset" className="danger-zone">
        <div className="setting">
          <div className="setting-text">
            <h3>Reset the simulator</h3>
            <p>
              Start over with {formatINR(INITIAL_CAPITAL)} of virtual cash and a brand-new market. Your orders, holdings, watchlist and value
              history are cleared. You stay signed in.
            </p>
          </div>
          <Button variant="danger" onClick={() => setConfirmingReset(true)}>
            Reset…
          </Button>
        </div>
      </Card>

      <Dialog open={confirmingReset} onClose={() => !resetting && setConfirmingReset(false)} title="Reset the simulator?">
        <div className="confirm">
          <p>This cannot be undone. Resetting will:</p>
          <ul>
            <li>restore your cash to {formatINR(INITIAL_CAPITAL)}</li>
            <li>remove all holdings, orders and your watchlist</li>
            <li>start a fresh simulated market with new prices</li>
          </ul>
          <div className="confirm-actions">
            <Button variant="secondary" onClick={() => setConfirmingReset(false)} disabled={resetting} data-autofocus>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReset} loading={resetting}>
              Reset everything
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
