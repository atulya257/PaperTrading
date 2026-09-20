import { sampleEvenly } from '../../utils/history.js'
import { formatDateTime } from '../../utils/format.js'
import './ChartTable.css'

const MAX_ROWS = 12

export default function ChartTable({ points, valueKey, valueLabel, format, caption }) {
  const rows = sampleEvenly(points, MAX_ROWS)
  return (
    <details className="chart-table">
      <summary>View as table</summary>
      <table>
        <caption>
          {caption}
          {points.length > rows.length ? ` (${rows.length} of ${points.length} points, evenly spaced)` : ''}
        </caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={`${p.t}-${i}`}>
              <td>{formatDateTime(p.t)}</td>
              <td className="num">{format(p[valueKey])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
