import { ArrowDown, ArrowUp } from 'lucide-react'
import './SortHeader.css'

export default function SortHeader({ label, sortKey, sort, onSort, className = '' }) {
  const active = sort.key === sortKey
  const Icon = sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th scope="col" className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={`sort-btn${active ? ' active' : ''}`} onClick={() => onSort(sortKey)}>
        {label}
        {active && <Icon size={14} aria-hidden="true" />}
      </button>
    </th>
  )
}
