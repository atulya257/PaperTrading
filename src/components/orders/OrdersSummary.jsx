import StatTile from '../ui/StatTile.jsx'
import PnlText from '../stock/PnlText.jsx'
import { formatINR } from '../../utils/format.js'
import './OrdersSummary.css'

export default function OrdersSummary({ summary: s }) {
  return (
    <section className="orders-summary" aria-label="Order totals">
      <StatTile label="Orders" sub={`${s.buys} buys · ${s.sells} sells`}>
        {s.count}
      </StatTile>
      <StatTile label="Bought">{formatINR(s.buyValue)}</StatTile>
      <StatTile label="Sold">{formatINR(s.sellValue)}</StatTile>
      <StatTile label="Realized P&L" sub={s.sells ? `${s.wins} profitable · ${s.losses} at a loss` : 'No sells yet'}>
        <PnlText paise={s.realizedPnl} />
      </StatTile>
    </section>
  )
}
