import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import './App.css'

const STORAGE_KEY = 'dental_clinic_opening_project_v3'
const UNLOCK_SESSION_KEY = 'dental_app_unlock_ok'
const APP_PASSWORD = 'limmy'
const tabs = ['summary', 'timelines', 'budget']
/** Default task categories when none are stored yet. */
const DEFAULT_TASK_CATEGORIES = [
  'Lease',
  'Operations',
  'Legal & Entity',
  'Hiring & Launch',
  'Finance',
  'Equipment',
  'Design & Permits',
  'Construction',
]

/** Prior names -> current labels (migration). */
const LEGACY_TASK_CATEGORY_MAP = {
  Site: 'Lease',
  Permits: 'Design & Permits',
  Legal: 'Legal & Entity',
  Insurance: 'Operations',
  Staffing: 'Hiring & Launch',
  Marketing: 'Operations',
}

const normalizeCategory = (raw, taskCategories) => {
  const list = taskCategories?.length ? taskCategories : DEFAULT_TASK_CATEGORIES
  const c = raw ?? ''
  if (list.includes(c)) return c
  const mapped = LEGACY_TASK_CATEGORY_MAP[c]
  if (mapped && list.includes(mapped)) return mapped
  return list[0]
}

const statusOptions = ['Not Started', 'In Progress', 'Completed']
const priorityOptions = ['Low', 'Medium', 'High']
const ownerOptions = ['💎LINZI', '🦷JIMMY', '💞L&J']

const uid = () => crypto.randomUUID()

const providedTimelineDataset = [
  { estimatedStart: '2026-02-01', actualStart: '2026-02-01', actualEnd: '2026-02-28', category: 'Lease', task: 'Market & competitor analysis', owner: 'LINZI', status: 'Completed', notes: '' },
  { estimatedStart: '2026-02-01', actualStart: '2026-02-26', actualEnd: '2026-03-23', category: 'Lease', task: 'Shortlist 2-3 locations with LOI', owner: 'LINZI', status: 'Completed', notes: '' },
  { estimatedStart: '2026-02-01', actualStart: '2026-02-27', actualEnd: '2026-03-23', category: 'Finance', task: 'Initial loan discussion to loan signed', owner: 'JIMMY', status: 'Completed', notes: '' },
  { estimatedStart: '2026-03-01', actualStart: '', actualEnd: '', category: 'Lease', task: 'Sign lease (TI + abatement)', owner: 'L/J', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-03-01', actualStart: '2026-03-01', actualEnd: '2026-03-10', category: 'Legal & Entity', task: 'Form PC / LLC', owner: 'JIMMY', status: 'Completed', notes: 'pllc formed' },
  { estimatedStart: '2026-03-01', actualStart: '2026-03-10', actualEnd: '2026-03-11', category: 'Legal & Entity', task: 'Obtain EIN', owner: 'JIMMY', status: 'Completed', notes: '' },
  { estimatedStart: '2026-03-01', actualStart: '2026-02-26', actualEnd: '2026-03-31', category: 'Hiring & Launch', task: 'Hire designer & GC (dental)', owner: 'LINZI', status: 'In Progress', notes: '' },
  { estimatedStart: '2026-04-01', actualStart: '2026-04-01', actualEnd: '2026-05-11', category: 'Design & Permits', task: 'Finalize floor plan', owner: '', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-05-11', actualStart: '2026-05-11', actualEnd: '2026-06-15', category: 'Design & Permits', task: 'Submit city permits', owner: '', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-04-15', actualStart: '2026-04-01', actualEnd: '2026-04-30', category: 'Operations', task: 'Start PPO credentialing', owner: '', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-05-01', actualStart: '2026-05-01', actualEnd: '', category: 'Construction', task: 'Build-out & inspections', owner: '', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-05-01', actualStart: '2026-05-01', actualEnd: '', category: 'Operations', task: 'Logo, color, brand assets', owner: '', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-07-01', actualStart: '2026-07-01', actualEnd: '', category: 'Equipment', task: 'Order US dental equipment', owner: '', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-07-01', actualStart: '2026-07-01', actualEnd: '', category: 'Equipment', task: 'Order non-medical items from China', owner: '', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-08-01', actualStart: '2026-08-01', actualEnd: '', category: 'Operations', task: 'Sign PPO contracts', owner: '', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-08-01', actualStart: '2026-08-01', actualEnd: '', category: 'Operations', task: 'Setup PMS & fee schedules', owner: '', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-09-01', actualStart: '2026-09-01', actualEnd: '', category: 'Operations', task: 'Website live + Google Ads', owner: '', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-10-01', actualStart: '2026-10-01', actualEnd: '', category: 'Hiring & Launch', task: 'Hire & train staff', owner: '', status: 'Not Started', notes: '' },
  { estimatedStart: '2026-11-01', actualStart: '2026-11-01', actualEnd: '', category: 'Hiring & Launch', task: 'Soft opening -> full opening', owner: '', status: 'Not Started', notes: '' },
]

const initialData = {
  taskCategories: [...DEFAULT_TASK_CATEGORIES],
  tasks: [
    { id: uid(), estimatedStart: '2026-02-01', estimatedEnd: '2026-02-28', actualStart: '2026-02-01', actualEnd: '2026-02-28', category: 'Lease', task: 'Market & competitor analysis', owner: 'LINZI', status: 'Completed', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-02-01', estimatedEnd: '2026-03-23', actualStart: '2026-02-26', actualEnd: '2026-03-23', category: 'Lease', task: 'Shortlist 2-3 locations with LOI', owner: 'LINZI', status: 'Completed', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-02-01', estimatedEnd: '2026-03-23', actualStart: '2026-02-27', actualEnd: '2026-03-23', category: 'Finance', task: 'Initial loan discussion to loan signed', owner: 'JIMMY', status: 'Completed', notes: '', isMilestone: true },
    { id: uid(), estimatedStart: '2026-03-01', estimatedEnd: '2026-03-31', actualStart: '', actualEnd: '', category: 'Lease', task: 'Sign lease (TI + abatement)', owner: 'L/J', status: 'Not Started', notes: '', isMilestone: true },
    { id: uid(), estimatedStart: '2026-03-01', estimatedEnd: '2026-03-10', actualStart: '2026-03-01', actualEnd: '2026-03-10', category: 'Legal & Entity', task: 'Form PC / LLC', owner: 'JIMMY', status: 'Completed', notes: 'pllc formed', isMilestone: false },
    { id: uid(), estimatedStart: '2026-03-01', estimatedEnd: '2026-03-11', actualStart: '2026-03-10', actualEnd: '2026-03-11', category: 'Legal & Entity', task: 'Obtain EIN', owner: 'JIMMY', status: 'Completed', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-03-01', estimatedEnd: '2026-03-31', actualStart: '2026-02-26', actualEnd: '2026-03-31', category: 'Hiring & Launch', task: 'Hire designer & GC (dental)', owner: 'LINZI', status: 'In Progress', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-04-01', estimatedEnd: '2026-05-11', actualStart: '2026-04-01', actualEnd: '2026-05-11', category: 'Design & Permits', task: 'Finalize floor plan', owner: '', status: 'Not Started', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-05-11', estimatedEnd: '2026-06-15', actualStart: '2026-05-11', actualEnd: '2026-06-15', category: 'Design & Permits', task: 'Submit city permits', owner: '', status: 'Not Started', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-04-15', estimatedEnd: '2026-04-30', actualStart: '2026-04-01', actualEnd: '2026-04-30', category: 'Operations', task: 'Start PPO credentialing', owner: '', status: 'Not Started', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-05-01', estimatedEnd: '2026-08-15', actualStart: '2026-05-01', actualEnd: '', category: 'Construction', task: 'Build-out & inspections', owner: '', status: 'Not Started', notes: '', isMilestone: true },
    { id: uid(), estimatedStart: '2026-05-01', estimatedEnd: '2026-06-15', actualStart: '2026-05-01', actualEnd: '', category: 'Operations', task: 'Logo, color, brand assets', owner: '', status: 'Not Started', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-07-01', estimatedEnd: '2026-08-15', actualStart: '2026-07-01', actualEnd: '', category: 'Equipment', task: 'Order US dental equipment', owner: '', status: 'Not Started', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-07-01', estimatedEnd: '2026-08-20', actualStart: '2026-07-01', actualEnd: '', category: 'Equipment', task: 'Order non-medical items from China', owner: '', status: 'Not Started', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-08-01', estimatedEnd: '2026-09-10', actualStart: '2026-08-01', actualEnd: '', category: 'Operations', task: 'Sign PPO contracts', owner: '', status: 'Not Started', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-08-01', estimatedEnd: '2026-09-10', actualStart: '2026-08-01', actualEnd: '', category: 'Operations', task: 'Setup PMS & fee schedules', owner: '', status: 'Not Started', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-09-01', estimatedEnd: '2026-10-10', actualStart: '2026-09-01', actualEnd: '', category: 'Operations', task: 'Website live + Google Ads', owner: '', status: 'Not Started', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-10-01', estimatedEnd: '2026-11-01', actualStart: '2026-10-01', actualEnd: '', category: 'Hiring & Launch', task: 'Hire & train staff', owner: '', status: 'Not Started', notes: '', isMilestone: false },
    { id: uid(), estimatedStart: '2026-11-01', estimatedEnd: '2026-12-01', actualStart: '2026-11-01', actualEnd: '', category: 'Hiring & Launch', task: 'Soft opening -> full opening', owner: '', status: 'Not Started', notes: '', isMilestone: true },
  ],
  budget: [
    {
      id: uid(),
      category: 'New Equipment / Cabinetry / Furniture',
      allocation: 200000,
      items: [
        {
          id: uid(),
          name: 'A-dec chair',
          planned: 55000,
          actual: 25000,
          paymentDate: '2026-05-01',
        },
        {
          id: uid(),
          name: 'X-ray machine',
          planned: 40000,
          actual: 0,
          paymentDate: '',
        },
      ],
    },
    {
      id: uid(),
      category: 'Leasehold Improvements',
      allocation: 400000,
      items: [
        { id: uid(), name: 'Contractor fee', planned: 150000, actual: 50000, paymentDate: '2026-04-25' },
        { id: uid(), name: 'Flooring', planned: 35000, actual: 12000, paymentDate: '2026-05-10' },
      ],
    },
    {
      id: uid(),
      category: 'Working Capital',
      allocation: 100000,
      items: [{ id: uid(), name: 'Initial payroll reserve', planned: 50000, actual: 0, paymentDate: '' }],
    },
  ],
}

const toDate = (value) => new Date(`${value}T00:00:00`)
const daysBetween = (a, b) => Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1)

/** Migrate legacy `transactions[]` to `actual` + `paymentDate`; strip transactions on load. */
const normalizeBudgetItem = (item) => {
  const txs = Array.isArray(item.transactions) ? item.transactions : []
  const txSum = txs.reduce((s, tx) => s + Number(tx.amount || 0), 0)
  const hasExplicitActual =
    item.actual !== undefined && item.actual !== null && item.actual !== '' && !Number.isNaN(Number(item.actual))
  const actual = hasExplicitActual ? Number(item.actual) : txSum
  let paymentDate = typeof item.paymentDate === 'string' ? item.paymentDate.trim() : ''
  if (!paymentDate && txs.length) {
    const withDates = txs.filter((tx) => tx.date).sort((a, b) => toDate(b.date) - toDate(a.date))
    paymentDate = withDates[0]?.date || ''
  }
  const { transactions: _tx, ...rest } = item
  return { ...rest, actual: Number(actual) || 0, paymentDate }
}

const normalizeBudget = (budget) =>
  budget.map((cat) => ({
    ...cat,
    items: (cat.items || []).map(normalizeBudgetItem),
  }))

const spanDaysInclusive = (startIso, endIso) => {
  if (!startIso?.trim() || !endIso?.trim()) return null
  const a = toDate(startIso)
  const b = toDate(endIso)
  if (b < a) return null
  return Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1
}
const formatMoney = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0)

/** Thousands separators for any numeric readout (e.g. 1,234 or 1,234.5). */
const formatNumber = (value) => {
  const n = Number(value)
  if (Number.isNaN(n)) return '0'
  return new Intl.NumberFormat('en-US').format(n)
}

const formatDateShort = (value) => {
  if (!value || !String(value).includes('-')) return '-'
  const [, month, day] = String(value).split('-')
  const monthMap = {
    '01': 'Jan',
    '02': 'Feb',
    '03': 'Mar',
    '04': 'Apr',
    '05': 'May',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Aug',
    '09': 'Sep',
    '10': 'Oct',
    '11': 'Nov',
    '12': 'Dec',
  }
  return `${monthMap[month] || month}-${day}`
}

const isoFromDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

const taskProgress = (task) => {
  if (task.status === 'Completed') return 100
  if (task.status === 'Not Started') return 0
  return Number(task.progress || 50)
}

const deriveStatusFromActualDates = (actualStart, actualEnd) => {
  if (actualEnd?.trim()) return 'Completed'
  if (actualStart?.trim()) return 'In Progress'
  return 'Not Started'
}

const isDelayed = (task) => {
  if (task.status === 'Completed') return false
  return Boolean(task.actualEnd && task.estimatedEnd && toDate(task.actualEnd) > toDate(task.estimatedEnd))
}
const ownerEmojiMap = {
  LINZI: '💎LINZI',
  JIMMY: '🦷JIMMY',
  'L/J': '💞L&J',
  'L&J': '💞L&J',
}
const normalizeOwner = (owner) => ownerEmojiMap[owner] || owner || ''

const normalizeTask = (task, taskCategories) => {
  const base = {
    id: task.id || uid(),
    estimatedStart: task.estimatedStart || '',
    estimatedEnd: task.estimatedEnd || '',
    actualStart: task.actualStart || '',
    actualEnd: task.actualEnd || '',
    category: normalizeCategory(task.category, taskCategories),
    task: task.task || task.name || 'New task',
    owner: normalizeOwner(task.owner),
    status: statusOptions.includes(task.status) ? task.status : 'Not Started',
    notes: task.notes || '',
    isMilestone: Boolean(task.isMilestone),
    progress: Number(task.progress || 0),
  }
  const status = deriveStatusFromActualDates(base.actualStart, base.actualEnd)
  const withStatus = { ...base, status }
  return { ...withStatus, progress: taskProgress(withStatus) }
}

const reorderWithInsertBefore = (contextRows, fromIndex, insertBeforeIndex) => {
  const next = [...contextRows]
  const [item] = next.splice(fromIndex, 1)
  let insertAt = insertBeforeIndex
  if (fromIndex < insertBeforeIndex) {
    insertAt -= 1
  }
  next.splice(insertAt, 0, item)
  return next
}

const getInsertBeforeIndexFromY = (clientY, rects) => {
  if (!rects.length) return 0
  for (let i = 0; i < rects.length; i++) {
    const mid = (rects[i].top + rects[i].bottom) / 2
    if (clientY < mid) return i
  }
  return rects.length
}

const collectTaskRowRects = (contextRows) =>
  contextRows.map((t) => {
    const el = document.querySelector(`[data-task-row="${t.id}"]`)
    return el ? el.getBoundingClientRect() : { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }
  })

const getInsertLineViewportY = (insertBeforeIndex, rects) => {
  if (!rects.length) return 0
  if (insertBeforeIndex <= 0) return rects[0].top
  if (insertBeforeIndex >= rects.length) return rects[rects.length - 1].bottom
  return (rects[insertBeforeIndex - 1].bottom + rects[insertBeforeIndex].top) / 2
}

const applyReorderSubset = (prevTasks, reorderedSubset) => {
  const ids = reorderedSubset.map((t) => t.id)
  const indices = ids.map((id) => prevTasks.findIndex((t) => t.id === id)).sort((a, b) => a - b)
  const next = [...prevTasks]
  for (let i = 0; i < reorderedSubset.length; i++) {
    next[indices[i]] = reorderedSubset[i]
  }
  return next
}

const filterTasks = (tasks, cat, q) =>
  tasks
    .filter((t) => (cat === 'All' ? true : t.category === cat))
    .filter((t) => t.task.toLowerCase().includes(q.toLowerCase()))

const TASK_EXPORT_HEADERS = [
  'Planned start',
  'Planned end',
  'Actual start',
  'Actual end',
  'Category',
  'Task',
  'Milestone',
  'Owner',
  'Status',
  'Notes',
]

function taskToExportRow(t) {
  return {
    'Planned start': t.estimatedStart || '',
    'Planned end': t.estimatedEnd || '',
    'Actual start': t.actualStart || '',
    'Actual end': t.actualEnd || '',
    Category: t.category || '',
    Task: t.task || '',
    Milestone: t.isMilestone ? 'Yes' : 'No',
    Owner: t.owner || '',
    Status: t.status || '',
    Notes: t.notes || '',
  }
}

function escapeCsvCell(value) {
  const s = value == null ? '' : String(value)
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function exportTasksFilenamePart() {
  return new Date().toISOString().slice(0, 10)
}

function exportTasksToCsv(tasks) {
  const rows = tasks.map(taskToExportRow)
  const headerLine = TASK_EXPORT_HEADERS.map(escapeCsvCell).join(',')
  const dataLines = rows.map((row) => TASK_EXPORT_HEADERS.map((h) => escapeCsvCell(row[h])).join(','))
  const csv = [headerLine, ...dataLines].join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(`dental-tasks-${exportTasksFilenamePart()}.csv`, blob)
}

async function exportTasksToXlsx(tasks) {
  const XLSX = await import('xlsx')
  const aoa = [
    TASK_EXPORT_HEADERS,
    ...tasks.map((t) => {
      const r = taskToExportRow(t)
      return TASK_EXPORT_HEADERS.map((h) => r[h])
    }),
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tasks')
  XLSX.writeFile(wb, `dental-tasks-${exportTasksFilenamePart()}.xlsx`)
}

function StatusIconSvg({ variant, compact }) {
  const s = compact ? 14 : 16
  if (variant === 'in-progress') {
    return (
      <svg className="status-svg" width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      </svg>
    )
  }
  return (
    <svg className="status-svg" width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
    </svg>
  )
}

function DateRangePairCell({
  task,
  variant,
  startField,
  endField,
  editingCell,
  inlineValue,
  setInlineValue,
  beginInlineEdit,
  saveInlineEditImmediate,
  formatDateShort,
}) {
  const startVal = task[startField]
  const endVal = task[endField]
  const days = spanDaysInclusive(startVal, endVal)
  const editingStart = editingCell?.taskId === task.id && editingCell?.field === startField
  const editingEnd = editingCell?.taskId === task.id && editingCell?.field === endField

  return (
    <td className={`date-range-cell date-range-cell--${variant}`}>
      <div className="date-range-inner">
        <div className="date-range-line">
          {editingStart ? (
            <input
              type="date"
              className="date-range-input"
              autoFocus
              value={inlineValue}
              onChange={(e) => setInlineValue(e.target.value)}
              onBlur={(e) => saveInlineEditImmediate(task, startField, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  saveInlineEditImmediate(task, startField, e.currentTarget.value)
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              type="button"
              className="date-range-part"
              onClick={(e) => {
                e.stopPropagation()
                beginInlineEdit(task, startField)
              }}
            >
              {formatDateShort(startVal)}
            </button>
          )}
          <span className="date-range-sep" aria-hidden>
            –
          </span>
          {editingEnd ? (
            <input
              type="date"
              className="date-range-input"
              autoFocus
              value={inlineValue}
              onChange={(e) => setInlineValue(e.target.value)}
              onBlur={(e) => saveInlineEditImmediate(task, endField, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  saveInlineEditImmediate(task, endField, e.currentTarget.value)
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              type="button"
              className="date-range-part"
              onClick={(e) => {
                e.stopPropagation()
                beginInlineEdit(task, endField)
              }}
            >
              {formatDateShort(endVal)}
            </button>
          )}
        </div>
        {days != null && (
          <div className="date-range-duration">
            {formatNumber(days)} {days === 1 ? 'day' : 'days'}
          </div>
        )}
      </div>
    </td>
  )
}

function PasswordGate({ onSuccess }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed === APP_PASSWORD) {
      try {
        sessionStorage.setItem(UNLOCK_SESSION_KEY, '1')
      } catch {
        /* ignore quota / private mode */
      }
      setError(false)
      onSuccess()
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="password-gate">
      <form className="password-gate-card card" onSubmit={submit}>
        <h1 className="password-gate-title">Sign in</h1>
        <p className="muted password-gate-lead">Enter the password to open this tracker.</p>
        <label className="password-gate-label" htmlFor="app-password">
          Password
        </label>
        <input
          id="app-password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          className="password-gate-input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(false)
          }}
        />
        {error ? <p className="password-gate-error">That password is not correct.</p> : null}
        <button type="submit" className="password-gate-submit">
          Continue
        </button>
      </form>
    </div>
  )
}

function StatusIconDisplay({ task, compact = false }) {
  const wrapClass = `status-icon-wrap${compact ? ' compact' : ''}`
  if (task.status === 'Completed') {
    return (
      <span className={`${wrapClass} completed`} title="Completed">
        <span className="status-check">✓</span>
      </span>
    )
  }
  if (task.status === 'In Progress') {
    return (
      <span className={`${wrapClass} in-progress`} title="In Progress">
        <StatusIconSvg variant="in-progress" compact={compact} />
      </span>
    )
  }
  return (
    <span className={`${wrapClass} not-started`} title="Not Started">
      <StatusIconSvg variant="not-started" compact={compact} />
    </span>
  )
}

function App() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(UNLOCK_SESSION_KEY) === '1'
    } catch {
      return false
    }
  })
  const [activeTab, setActiveTab] = useState('summary')
  const [deadlineWindow, setDeadlineWindow] = useState(14)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [groupByCategory, setGroupByCategory] = useState(false)
  const [editingCell, setEditingCell] = useState(null)
  const [inlineValue, setInlineValue] = useState('')
  const editingCellRef = useRef(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [taskOptionsOpen, setTaskOptionsOpen] = useState(false)
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false)
  const [categoryDraft, setCategoryDraft] = useState([])
  const [ganttBarTooltip, setGanttBarTooltip] = useState(null)
  const taskOptionsRef = useRef(null)

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { ...initialData, budget: normalizeBudget(initialData.budget) }
    try {
      const parsed = JSON.parse(saved)
      const cats =
        Array.isArray(parsed.taskCategories) && parsed.taskCategories.length > 0
          ? parsed.taskCategories
          : DEFAULT_TASK_CATEGORIES
      return {
        taskCategories: cats,
        tasks: (parsed.tasks || []).map((t) => normalizeTask(t, cats)),
        budget: normalizeBudget(parsed.budget || initialData.budget),
      }
    } catch {
      return { ...initialData, budget: normalizeBudget(initialData.budget) }
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => ({ ...task, owner: normalizeOwner(task.owner) })),
    }))
  }, [])

  useEffect(() => {
    if (categoryFilter !== 'All' && data.taskCategories && !data.taskCategories.includes(categoryFilter)) {
      setCategoryFilter('All')
    }
  }, [data.taskCategories, categoryFilter])

  useEffect(() => {
    if (!taskOptionsOpen) return
    const onDown = (e) => {
      if (taskOptionsRef.current?.contains(e.target)) return
      setTaskOptionsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [taskOptionsOpen])

  useEffect(() => {
    if (activeTab !== 'timelines') setGanttBarTooltip(null)
  }, [activeTab])

  const todayIsoDate = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const updateTask = (taskId, patch) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t
        let next = { ...t, ...patch }
        const userClearedActualEnd =
          Object.prototype.hasOwnProperty.call(patch, 'actualEnd') && !String(patch.actualEnd ?? '').trim()
        if (next.status === 'Completed' && !next.actualEnd?.trim() && !userClearedActualEnd) {
          next = { ...next, actualEnd: todayIsoDate() }
        }
        next = {
          ...next,
          status: deriveStatusFromActualDates(next.actualStart, next.actualEnd),
        }
        return { ...next, progress: taskProgress(next) }
      }),
    }))
  }

  const deleteTask = (taskId) => {
    setData((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) }))
    setPendingDeleteId(null)
  }

  const openCategoryEditor = () => {
    setCategoryDraft([...(data.taskCategories?.length ? data.taskCategories : DEFAULT_TASK_CATEGORIES)])
    setCategoryEditorOpen(true)
  }

  const saveCategoryEditor = () => {
    const next = [...new Set(categoryDraft.map((s) => s.trim()).filter(Boolean))]
    const final = next.length ? next : DEFAULT_TASK_CATEGORIES
    setData((prev) => ({
      ...prev,
      taskCategories: final,
      tasks: prev.tasks.map((t) => ({
        ...t,
        category: normalizeCategory(t.category, final),
      })),
    }))
    setCategoryEditorOpen(false)
  }

  const insertTaskAtGap = (rows, gapIndex) => {
    setData((prev) => {
      let globalIndex
      if (rows.length === 0) {
        globalIndex = prev.tasks.length
      } else if (gapIndex < rows.length) {
        globalIndex = prev.tasks.findIndex((t) => t.id === rows[gapIndex].id)
      } else {
        const last = rows[rows.length - 1]
        globalIndex = prev.tasks.findIndex((t) => t.id === last.id) + 1
      }
      const neighborCat =
        gapIndex < rows.length && rows[gapIndex]
          ? rows[gapIndex].category
          : gapIndex > 0 && rows[gapIndex - 1]
            ? rows[gapIndex - 1].category
            : null
      const cats = prev.taskCategories?.length ? prev.taskCategories : DEFAULT_TASK_CATEGORIES
      const defaultCat =
        (neighborCat && cats.includes(neighborCat) && neighborCat) ||
        (categoryFilter !== 'All' && cats.includes(categoryFilter) && categoryFilter) ||
        cats[0]
      const newTask = normalizeTask(
        {
          id: uid(),
          estimatedStart: todayIsoDate(),
          estimatedEnd: '',
          actualStart: '',
          actualEnd: '',
          category: defaultCat,
          task: 'New task',
          owner: '',
          status: 'Not Started',
          notes: '',
          isMilestone: false,
        },
        cats,
      )
      return {
        ...prev,
        tasks: [...prev.tasks.slice(0, globalIndex), newTask, ...prev.tasks.slice(globalIndex)],
      }
    })
  }

  const reorderContextRowsInsertBefore = (contextRows, fromIndex, insertBeforeIndex) => {
    if (fromIndex < 0) return
    const reordered = reorderWithInsertBefore([...contextRows], fromIndex, insertBeforeIndex)
    if (reordered.every((t, i) => t.id === contextRows[i].id)) return
    setData((prev) => ({
      ...prev,
      tasks: applyReorderSubset(prev.tasks, reordered),
    }))
  }

  const [rowDrag, setRowDrag] = useState(null)
  const pendingRowDragRef = useRef(null)
  const tableWrapRef = useRef(null)

  const ROW_DRAG_THRESHOLD_SQ = 64

  const onTaskRowPointerDown = (e, task, contextRows, fromIndex, groupKey) => {
    if (e.button !== 0) return
    if (pendingRowDragRef.current) return
    if (e.target.closest('button, input, select, textarea, a')) return
    const pending = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      taskId: task.id,
      contextRows,
      fromIndex,
      groupKey,
      rowEl: e.currentTarget,
      active: false,
    }
    pendingRowDragRef.current = pending

    const onMove = (ev) => {
      const p = pendingRowDragRef.current
      if (!p || ev.pointerId !== p.pointerId) return
      const dx = ev.clientX - p.startX
      const dy = ev.clientY - p.startY
      if (!p.active && dx * dx + dy * dy > ROW_DRAG_THRESHOLD_SQ) {
        p.active = true
        try {
          p.rowEl?.setPointerCapture?.(p.pointerId)
        } catch {
          /* ignore */
        }
        document.body.classList.add('is-row-dragging')
        const rects = collectTaskRowRects(p.contextRows)
        if (rects.length === 0) return
        const insertBeforeIndex = getInsertBeforeIndexFromY(ev.clientY, rects)
        setRowDrag({
          taskId: p.taskId,
          contextRows: p.contextRows,
          fromIndex: p.fromIndex,
          groupKey: p.groupKey,
          insertBeforeIndex,
        })
      }
      if (p.active) {
        const rects = collectTaskRowRects(p.contextRows)
        if (rects.length === 0) return
        const insertBeforeIndex = getInsertBeforeIndexFromY(ev.clientY, rects)
        setRowDrag((prev) => (prev ? { ...prev, insertBeforeIndex } : prev))
      }
    }

    const onUp = (ev) => {
      const p = pendingRowDragRef.current
      if (!p || ev.pointerId !== p.pointerId) return
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      document.body.classList.remove('is-row-dragging')
      pendingRowDragRef.current = null
      try {
        p.rowEl?.releasePointerCapture?.(p.pointerId)
      } catch {
        /* ignore */
      }
      if (p.active && p.contextRows) {
        const rects = collectTaskRowRects(p.contextRows)
        const insertBeforeIndex =
          rects.length > 0 ? getInsertBeforeIndexFromY(ev.clientY, rects) : p.fromIndex
        reorderContextRowsInsertBefore(p.contextRows, p.fromIndex, insertBeforeIndex)
      }
      setRowDrag(null)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

  const rowDropLineStyle = useMemo(() => {
    if (!rowDrag || !tableWrapRef.current) return null
    const wrap = tableWrapRef.current.getBoundingClientRect()
    const rects = collectTaskRowRects(rowDrag.contextRows)
    if (!rects.length) return null
    const y = getInsertLineViewportY(rowDrag.insertBeforeIndex, rects)
    const top = y - wrap.top + tableWrapRef.current.scrollTop - 1.5
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top,
      height: 3,
      background: 'var(--color-accent, #2563eb)',
      borderRadius: 2,
      zIndex: 10,
      pointerEvents: 'none',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.9)',
    }
  }, [rowDrag])

  const updateBudgetItem = (categoryId, itemId, field, value) => {
    setData((prev) => ({
      ...prev,
      budget: prev.budget.map((b) => ({
        ...b,
        items: b.id === categoryId ? b.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)) : b.items,
      })),
    }))
  }

  const addBudgetItem = (categoryId) => {
    setData((prev) => ({
      ...prev,
      budget: prev.budget.map((b) =>
        b.id === categoryId
          ? { ...b, items: [...b.items, { id: uid(), name: 'New item', planned: 0, actual: 0, paymentDate: '' }] }
          : b,
      ),
    }))
  }

  const removeBudgetItem = (categoryId, itemId) => {
    setData((prev) => ({
      ...prev,
      budget: prev.budget.map((b) => (b.id === categoryId ? { ...b, items: b.items.filter((i) => i.id !== itemId) } : b)),
    }))
  }

  const endEditingCell = () => {
    editingCellRef.current = null
    setEditingCell(null)
    setInlineValue('')
  }

  const beginInlineEdit = (task, field) => {
    if (editingCellRef.current?.taskId === task.id && editingCellRef.current?.field === field) return
    editingCellRef.current = { taskId: task.id, field }
    setEditingCell({ taskId: task.id, field })
    setInlineValue(field === 'owner' ? normalizeOwner(task[field]) : (task[field] || ''))
  }

  /** Pass `value` from `blur`/`change` when available so saves are not stale vs React state. */
  const saveInlineEdit = (task, field, value) => {
    const next = value !== undefined ? value : inlineValue
    updateTask(task.id, { [field]: next })
    endEditingCell()
  }

  const saveInlineEditImmediate = (task, field, value) => {
    updateTask(task.id, { [field]: value })
    endEditingCell()
  }

  const filteredTasks = useMemo(
    () => filterTasks(data.tasks, categoryFilter, search),
    [data.tasks, categoryFilter, search],
  )

  const taskBounds = useMemo(() => {
    if (!filteredTasks.length) return null
    const safeStart = (t) => (t.estimatedStart ? toDate(t.estimatedStart) : new Date())
    const safeEnd = (t) => (t.estimatedEnd ? toDate(t.estimatedEnd) : new Date())
    return {
      start: new Date(Math.min(...filteredTasks.map(safeStart))),
      end: new Date(Math.max(...filteredTasks.map(safeEnd))),
    }
  }, [filteredTasks])

  const ganttSections = useMemo(() => {
    if (!groupByCategory) return [{ category: null, tasks: filteredTasks }]
    const by = filteredTasks.reduce((acc, task) => {
      const key = task.category || DEFAULT_TASK_CATEGORIES[0]
      if (!acc[key]) acc[key] = []
      acc[key].push(task)
      return acc
    }, {})
    return Object.keys(by)
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({ category, tasks: by[category] }))
  }, [filteredTasks, groupByCategory])

  const ganttAxisTicks = useMemo(() => {
    if (!taskBounds) return []
    const start = taskBounds.start
    const end = taskBounds.end
    const totalMs = end.getTime() - start.getTime()
    if (totalMs <= 0) {
      return [{ key: 'gantt-tick-0', label: formatDateShort(isoFromDate(start)) }]
    }
    const totalDays = daysBetween(start, end)
    const n = Math.min(10, Math.max(4, Math.ceil(totalDays / 45)))
    return Array.from({ length: n }, (_, i) => {
      const t = n === 1 ? 0 : i / (n - 1)
      const ms = start.getTime() + t * totalMs
      const d = new Date(ms)
      const iso = isoFromDate(d)
      return { key: `gantt-tick-${i}-${iso}`, label: formatDateShort(iso) }
    })
  }, [taskBounds])

  const taskMetrics = useMemo(() => {
    const taskCount = data.tasks.length || 1
    const overallProgress = Math.round(data.tasks.reduce((sum, t) => sum + taskProgress(t), 0) / taskCount)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMs = today.getTime()

    const deadlineRows = data.tasks
      .map((t) => {
        if (!t.estimatedEnd) return null
        const end = toDate(t.estimatedEnd)
        end.setHours(0, 0, 0, 0)
        const daysAway = Math.round((end.getTime() - todayMs) / (1000 * 60 * 60 * 24))
        let tone = 'green'
        if (t.status === 'Completed') {
          tone = 'done'
        } else if (isDelayed(t) || daysAway < 0) {
          tone = 'red'
        } else if (daysAway <= deadlineWindow) {
          tone = 'yellow'
        }
        return {
          id: t.id,
          label: t.task,
          date: t.estimatedEnd,
          actualEnd: t.actualEnd || '',
          daysAway,
          tone,
          milestone: t.isMilestone,
          status: t.status,
        }
      })
      .filter(Boolean)

    const upcoming = deadlineRows
      .filter((i) => i.daysAway >= 0 && i.daysAway <= deadlineWindow && i.status !== 'Completed')
      .sort((a, b) => toDate(a.date) - toDate(b.date))

    const pastDeadlines = deadlineRows
      .filter((i) => i.daysAway < 0)
      .sort((a, b) => toDate(a.date) - toDate(b.date))

    const keyMilestones = data.tasks.filter((t) => t.isMilestone)
    return { overallProgress, upcoming, pastDeadlines, keyMilestones }
  }, [data.tasks, deadlineWindow])

  const budgetSummary = useMemo(() => {
    const rows = data.budget.map((category) => {
      const actual = category.items.reduce((sum, item) => sum + Number(item.actual || 0), 0)
      const planned = category.items.reduce((sum, item) => sum + Number(item.planned || 0), 0)
      return { ...category, planned, actual, remaining: category.allocation - actual }
    })
    const totalBudget = rows.reduce((sum, r) => sum + r.allocation, 0)
    const totalPlanned = rows.reduce((sum, r) => sum + r.planned, 0)
    const totalActual = rows.reduce((sum, r) => sum + r.actual, 0)
    return { rows, totalBudget, totalPlanned, totalActual, remaining: totalBudget - totalActual }
  }, [data.budget])

  const categoryProgress = useMemo(() => {
    const cats = [...new Set(data.tasks.map((t) => t.category || DEFAULT_TASK_CATEGORIES[0]))].sort()
    return cats.map((category) => {
      const group = data.tasks.filter((t) => t.category === category)
      const progress = group.length ? Math.round(group.reduce((sum, t) => sum + t.progress, 0) / group.length) : 0
      return { category, progress, count: group.length, tasks: group }
    })
  }, [data.tasks])

  const budgetChartData = budgetSummary.rows.map((row) => ({
    category: row.category,
    Budget: row.allocation,
    Actual: row.actual,
  }))
  const budgetOverviewChartHeight = Math.min(560, Math.max(280, budgetChartData.length * 52 || 280))

  const openGanttBarTooltip = (e, detail) => {
    setGanttBarTooltip({ x: e.clientX, y: e.clientY, ...detail })
  }
  const moveGanttBarTooltip = (e) => {
    setGanttBarTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))
  }
  const closeGanttBarTooltip = () => setGanttBarTooltip(null)

  if (!unlocked) {
    return <PasswordGate onSuccess={() => setUnlocked(true)} />
  }

  return (
    <>
      <main className="app-shell">
      <header className="app-header">
        <p className="app-kicker">Opening project</p>
        <h1>Dental Clinic Opening Project</h1>
        <p className="app-subtitle">
          Single-user internal tracker — summary, timelines, and budget in one place.
        </p>
      </header>
      <nav className="tab-bar">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab)}>
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {activeTab === 'summary' && (
        <>
          <section className="card dashboard-grid">
            <article><p className="label">Overall Project Progress</p><h2>{formatNumber(taskMetrics.overallProgress)}%</h2></article>
            <article><p className="label">Total Budget vs Actual</p><h2>{formatMoney(budgetSummary.totalActual)} / {formatMoney(budgetSummary.totalBudget)}</h2></article>
            <article><p className="label">Remaining Budget</p><h2>{formatMoney(budgetSummary.remaining)}</h2></article>
          </section>
          <section className="card">
            <div className="section-head">
              <h3>Upcoming Deadlines</h3>
              <select className="window-select" value={deadlineWindow} onChange={(e) => setDeadlineWindow(Number(e.target.value))}>
                <option value={7}>Next 7 days</option>
                <option value={14}>Next 14 days</option>
                <option value={30}>Next 30 days</option>
              </select>
            </div>
            <div className="deadline-list">
              {taskMetrics.upcoming.length ? taskMetrics.upcoming.map((item) => {
                const taskRow = data.tasks.find((t) => t.id === item.id)
                return (
                  <div className={`deadline-item ${item.tone}`} key={item.id}>
                    {taskRow && <StatusIconDisplay task={taskRow} compact />}
                    <div className="deadline-item-text">
                      <p>{item.label}</p>
                      <small>{item.milestone ? 'Key Milestone' : 'Task deadline'}</small>
                    </div>
                    <strong>{formatDateShort(item.date)}</strong>
                  </div>
                )
              }) : <p className="muted">No deadlines in this window.</p>}
            </div>
          </section>
          <section className="card">
            <div className="section-head">
              <h3>Past deadlines</h3>
            </div>
            <p className="muted section-sub">
              Estimated end before today: overdue active work (red); completed tasks stay out of “overdue” and show in green/grey.
            </p>
            <div className="deadline-list">
              {taskMetrics.pastDeadlines.length ? taskMetrics.pastDeadlines.map((item) => {
                const taskRow = data.tasks.find((t) => t.id === item.id)
                const overdueDays = Math.abs(item.daysAway)
                const isDone = taskRow?.status === 'Completed'
                return (
                  <div className={`deadline-item ${isDone ? 'past-done' : 'past'}`} key={item.id}>
                    {taskRow && <StatusIconDisplay task={taskRow} compact />}
                    <div className="deadline-item-text">
                      <p>{item.label}</p>
                      <small>
                        {isDone ? (
                          <>
                            {item.milestone ? 'Key Milestone · ' : ''}
                            Planned end {item.date}
                            {taskRow?.actualEnd ? ` · Finished ${formatDateShort(taskRow.actualEnd)}` : ' · Completed'}
                          </>
                        ) : (
                          <>
                            {item.milestone ? 'Key Milestone · ' : ''}
                            Due {item.date} · {formatNumber(overdueDays)} day{overdueDays === 1 ? '' : 's'} overdue
                          </>
                        )}
                      </small>
                    </div>
                    <strong>{formatDateShort(item.date)}</strong>
                  </div>
                )
              }) : <p className="muted">No past estimated ends.</p>}
            </div>
          </section>
          <section className="card">
            <div className="section-head"><h3>Key Milestones</h3></div>
            <div className="table-wrap milestones-summary-wrap">
              <table className="milestones-summary-table">
                <thead>
                  <tr>
                    <th className="milestone-col-head" aria-hidden />
                    <th>Task</th>
                    <th>Category</th>
                    <th>Est. end</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {taskMetrics.keyMilestones.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">No milestones marked yet. Use the Timelines tab → Milestone column (● / ○) on any task.</td>
                    </tr>
                  ) : (
                    taskMetrics.keyMilestones.map((t) => (
                      <tr key={t.id}>
                        <td className="milestone-col-cell">
                          <span className="milestone-dot-mark" title="Milestone" aria-hidden>●</span>
                        </td>
                        <td className="task-name-cell">{t.task}</td>
                        <td>{t.category}</td>
                        <td className="date">{formatDateShort(t.estimatedEnd)}</td>
                        <td className="status-col"><StatusIconDisplay task={t} compact /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activeTab === 'timelines' && (
        <>
          <section className="card">
            <div className="section-head">
              <h3>Task Table</h3>
              <div className="row-actions">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="All">All categories</option>
                  {[...new Set(data.tasks.map((t) => t.category))].sort().map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Quick search task name" value={search} onChange={(e) => setSearch(e.target.value)} />
                <label className="toggle"><input type="checkbox" checked={groupByCategory} onChange={(e) => setGroupByCategory(e.target.checked)} /> Group by category</label>
              </div>
            </div>
            <p className="task-row-legend muted">
              Row accent: green = completed · amber = in progress · gray = not started. Red edge on top = overdue vs planned end.
            </p>
            <div
              ref={tableWrapRef}
              className={`table-wrap task-table-wrap${rowDrag ? ' table-wrap--reorder-active' : ''}`}
            >
              {rowDropLineStyle && <div className="row-insert-line" style={rowDropLineStyle} aria-hidden />}
              <table className="timelines-table">
                <thead>
                  <tr>
                    <th className="drag-head" title="Press and drag a row to reorder">
                      <span className="drag-head-hint">⋮⋮</span>
                    </th>
                    <th>
                      <span className="th-range-title">Planned start – end</span>
                    </th>
                    <th>
                      <span className="th-range-title">Actual start – end</span>
                    </th>
                    <th>Category</th>
                    <th>Task</th>
                    <th>Milestone</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="task-empty-cell">
                        <p className="muted">No tasks match filters.</p>
                        <button type="button" className="task-gap-insert" onClick={() => insertTaskAtGap([], 0)}>+ Add task</button>
                      </td>
                    </tr>
                  ) : (
                    (groupByCategory
                      ? Object.entries(filteredTasks.reduce((acc, task) => {
                          const key = task.category || DEFAULT_TASK_CATEGORIES[0]
                          acc[key] = acc[key] || []
                          acc[key].push(task)
                          return acc
                        }, {}))
                      : [['', filteredTasks]]
                    ).flatMap(([group, rows]) => {
                      const gapKey = groupByCategory ? group : 'all'
                      const block = []
                      if (groupByCategory) {
                        block.push(
                          <tr className="group-row" key={`group-${group}`}>
                            <td colSpan={10}>{group}</td>
                          </tr>,
                        )
                      }
                      for (let gapIndex = 0; gapIndex <= rows.length; gapIndex++) {
                        block.push(
                          <tr key={`gap-${gapKey}-${gapIndex}`} className="task-gap-row">
                            <td colSpan={10} className="task-gap-cell">
                              <button type="button" className="task-gap-insert" onClick={() => insertTaskAtGap(rows, gapIndex)}>
                                + Add task
                              </button>
                            </td>
                          </tr>,
                        )
                        if (gapIndex < rows.length) {
                          const task = rows[gapIndex]
                          const rowIndex = gapIndex
                          block.push(
                            <tr
                              key={task.id}
                              data-task-row={task.id}
                              className={`task-row clean${rowDrag?.taskId === task.id ? ' is-row-dragging-source' : ''} status-${task.status.replaceAll(' ', '-').toLowerCase()}${isDelayed(task) ? ' delayed' : ''}`}
                              onPointerDown={(e) => onTaskRowPointerDown(e, task, rows, rowIndex, gapKey)}
                            >
                              <td className="drag-handle-cell" title="Press and drag anywhere on the row to reorder">
                                <span className="drag-handle" aria-hidden>
                                  <svg className="drag-grip" width="20" height="18" viewBox="0 0 20 18" fill="currentColor" aria-hidden>
                                    <circle cx="6" cy="4" r="1.75" />
                                    <circle cx="14" cy="4" r="1.75" />
                                    <circle cx="6" cy="9" r="1.75" />
                                    <circle cx="14" cy="9" r="1.75" />
                                    <circle cx="6" cy="14" r="1.75" />
                                    <circle cx="14" cy="14" r="1.75" />
                                  </svg>
                                </span>
                              </td>
                              <DateRangePairCell
                                task={task}
                                variant="planned"
                                startField="estimatedStart"
                                endField="estimatedEnd"
                                editingCell={editingCell}
                                inlineValue={inlineValue}
                                setInlineValue={setInlineValue}
                                beginInlineEdit={beginInlineEdit}
                                saveInlineEditImmediate={saveInlineEditImmediate}
                                formatDateShort={formatDateShort}
                              />
                              <DateRangePairCell
                                task={task}
                                variant="actual"
                                startField="actualStart"
                                endField="actualEnd"
                                editingCell={editingCell}
                                inlineValue={inlineValue}
                                setInlineValue={setInlineValue}
                                beginInlineEdit={beginInlineEdit}
                                saveInlineEditImmediate={saveInlineEditImmediate}
                                formatDateShort={formatDateShort}
                              />
                              <td
                                className="editable-cell"
                                title={task.category}
                                onClick={() =>
                                  editingCell?.taskId !== task.id || editingCell?.field !== 'category'
                                    ? beginInlineEdit(task, 'category')
                                    : null
                                }
                              >
                                {editingCell?.taskId === task.id && editingCell?.field === 'category' ? (
                                  <select
                                    className="owner-select category-select"
                                    autoFocus
                                    value={inlineValue}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) => saveInlineEditImmediate(task, 'category', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        saveInlineEditImmediate(task, 'category', e.currentTarget.value)
                                      }
                                    }}
                                    onBlur={endEditingCell}
                                  >
                                    {(data.taskCategories?.length ? data.taskCategories : DEFAULT_TASK_CATEGORIES).map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  task.category
                                )}
                              </td>
                              <td className="task-col editable-cell" title={task.task} onClick={() => beginInlineEdit(task, 'task')}>
                                {editingCell?.taskId === task.id && editingCell?.field === 'task' ? (
                                  <input
                                    autoFocus
                                    value={inlineValue}
                                    onChange={(e) => setInlineValue(e.target.value)}
                                    onBlur={(e) => saveInlineEdit(task, 'task', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        saveInlineEdit(task, 'task', e.currentTarget.value)
                                      }
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : task.task}
                              </td>
                              <td className="milestone-cell">
                                <button
                                  type="button"
                                  className={`milestone-dot-btn${task.isMilestone ? ' is-milestone' : ''}`}
                                  aria-pressed={task.isMilestone}
                                  aria-label={task.isMilestone ? 'Milestone (click to clear)' : 'Mark as milestone'}
                                  title={task.isMilestone ? 'Key milestone — click to clear' : 'Click to mark as milestone'}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateTask(task.id, { isMilestone: !task.isMilestone })
                                  }}
                                >
                                  {task.isMilestone ? '●' : '○'}
                                </button>
                              </td>
                              <td className="editable-cell owner-col" title={task.owner || '-'} onClick={() => editingCell?.taskId !== task.id || editingCell?.field !== 'owner' ? beginInlineEdit(task, 'owner') : null}>
                                {editingCell?.taskId === task.id && editingCell?.field === 'owner' ? (
                                  <select
                                    className="owner-select"
                                    autoFocus
                                    value={inlineValue}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) => saveInlineEditImmediate(task, 'owner', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        saveInlineEditImmediate(task, 'owner', e.currentTarget.value)
                                      }
                                    }}
                                    onBlur={endEditingCell}
                                  >
                                    <option value="">-</option>
                                    {ownerOptions.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
                                  </select>
                                ) : (
                                  <span className="owner-label">{task.owner || '-'}</span>
                                )}
                              </td>
                              <td className="editable-cell status-col" onClick={() => beginInlineEdit(task, 'status')}>
                                {editingCell?.taskId === task.id && editingCell?.field === 'status' ? (
                                  <select
                                    autoFocus
                                    value={inlineValue}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) => saveInlineEditImmediate(task, 'status', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        saveInlineEditImmediate(task, 'status', e.currentTarget.value)
                                      }
                                    }}
                                    onBlur={endEditingCell}
                                  >
                                    {statusOptions.map((s) => <option key={s}>{s}</option>)}
                                  </select>
                                ) : <StatusIconDisplay task={task} />}
                              </td>
                              <td className="truncate editable-cell" title={task.notes || '-'} onClick={() => beginInlineEdit(task, 'notes')}>
                                {editingCell?.taskId === task.id && editingCell?.field === 'notes' ? (
                                  <input
                                    autoFocus
                                    value={inlineValue}
                                    onChange={(e) => setInlineValue(e.target.value)}
                                    onBlur={(e) => saveInlineEdit(task, 'notes', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        saveInlineEdit(task, 'notes', e.currentTarget.value)
                                      }
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (task.notes || '-')}
                              </td>
                              <td className="menu-cell">
                                <button
                                  type="button"
                                  className="icon-btn task-delete-btn"
                                  title="Delete task"
                                  aria-label={`Delete task: ${task.task}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPendingDeleteId(task.id)
                                  }}
                                >
                                  <svg
                                    className="task-delete-icon"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden
                                  >
                                    <path
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </td>
                            </tr>,
                          )
                        }
                      }
                      return block
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="task-table-toolbar" ref={taskOptionsRef}>
              <div className="task-table-options-wrap">
                <button
                  type="button"
                  className="task-table-options-btn"
                  aria-expanded={taskOptionsOpen}
                  aria-haspopup="menu"
                  onClick={() => setTaskOptionsOpen((o) => !o)}
                >
                  Options ▾
                </button>
                {taskOptionsOpen && (
                  <div className="task-table-options-menu" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        exportTasksToCsv(filteredTasks)
                        setTaskOptionsOpen(false)
                      }}
                    >
                      Download CSV
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        void exportTasksToXlsx(filteredTasks)
                        setTaskOptionsOpen(false)
                      }}
                    >
                      Download Excel
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        openCategoryEditor()
                        setTaskOptionsOpen(false)
                      }}
                    >
                      Edit categories…
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
          <section className="card">
            <div className="section-head"><h3>Category Progress</h3></div>
            <div className="category-grid">
              {categoryProgress.filter((r) => r.count > 0).map((row) => {
                const done = row.tasks.filter((t) => t.status === 'Completed').length
                const active = row.tasks.filter((t) => t.status === 'In Progress').length
                const todo = row.tasks.filter((t) => t.status === 'Not Started').length
                return (
                  <div className="category-card" key={row.category}>
                    <p>{row.category}</p>
                    <div className="category-status-strip" aria-label="Tasks by status">
                      <span className="status-count" title="Completed"><span className="status-check sm">✓</span> {formatNumber(done)}</span>
                      <span className="status-count" title="In Progress"><StatusIconSvg variant="in-progress" compact /> {formatNumber(active)}</span>
                      <span className="status-count" title="Not Started"><StatusIconSvg variant="not-started" compact /> {formatNumber(todo)}</span>
                    </div>
                    <div className="mini-track"><div className="mini-bar" style={{ width: `${row.progress}%` }} /></div>
                    <small>{formatNumber(row.progress)}% ({formatNumber(row.count)} tasks)</small>
                  </div>
                )
              })}
            </div>
          </section>
          <section className="card">
            <div className="section-head">
              <h3>Gantt Timeline (Estimated vs Actual)</h3>
              <label className="toggle">
                <input type="checkbox" checked={groupByCategory} onChange={(e) => setGroupByCategory(e.target.checked)} />
                Group by category
              </label>
            </div>
            <div className="gantt-wrap">
              {!taskBounds && <p className="muted">No tasks available.</p>}
              {taskBounds && (
                <>
                  <div className="gantt-axis-row" role="region" aria-label="Timeline date scale">
                    <div className="gantt-axis-corner muted">Timeline</div>
                    <div className="gantt-axis-track">
                      {ganttAxisTicks.map((tick) => (
                        <span key={tick.key} className="gantt-axis-tick">
                          {tick.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="gantt-legend-row">
                    <div className="gantt-legend-spacer" aria-hidden />
                    <div className="gantt-legend" role="list">
                      <span className="gantt-legend-item" role="listitem">
                        <span className="gantt-swatch est" aria-hidden />
                        Estimated
                      </span>
                      <span className="gantt-legend-item" role="listitem">
                        <span className="gantt-swatch act" aria-hidden />
                        Actual
                      </span>
                      <span className="gantt-legend-item gantt-legend-item-hint" role="listitem">
                        <span className="gantt-swatch pending" aria-hidden />
                        No actual dates yet (hatched bar = planned window only)
                      </span>
                    </div>
                  </div>
                  {ganttSections.map((section) => (
                    <div key={section.category ?? 'all-tasks'} className="gantt-category-block">
                      {section.category && <div className="gantt-category-heading">{section.category}</div>}
                      {section.tasks.map((task) => {
                        const totalDays = daysBetween(taskBounds.start, taskBounds.end)
                        const estStart = task.estimatedStart ? toDate(task.estimatedStart) : taskBounds.start
                        const estEnd = task.estimatedEnd ? toDate(task.estimatedEnd) : estStart
                        const estOffset = daysBetween(taskBounds.start, estStart) - 1
                        const estWidth = daysBetween(estStart, estEnd)
                        const estLeftPct = (estOffset / totalDays) * 100
                        const estWidthPct = (estWidth / totalDays) * 100
                        const actStart = task.actualStart ? toDate(task.actualStart) : null
                        const actEnd = task.actualEnd ? toDate(task.actualEnd) : null
                        const hasActualRange = actStart && actEnd
                        const actOffset = hasActualRange ? daysBetween(taskBounds.start, actStart) - 1 : 0
                        const actWidth = hasActualRange ? daysBetween(actStart, actEnd) : 0
                        const actLeftPct = hasActualRange ? (actOffset / totalDays) * 100 : estLeftPct
                        const actWidthPct = hasActualRange ? (actWidth / totalDays) * 100 : estWidthPct
                        return (
                          <div className={`gantt-row${section.category ? ' gantt-row-grouped' : ''}${task.isMilestone ? ' gantt-row-milestone' : ''}`} key={task.id}>
                            <span className="gantt-label">
                              <StatusIconDisplay task={task} compact />
                              <span className="gantt-task-name">{task.task}</span>
                            </span>
                            <div className="timeline-stack">
                              <div className="gantt-row-durations">
                                <span className="gantt-dur-est">{formatNumber(estWidth)}d</span>
                                <span className="gantt-dur-sep" aria-hidden>
                                  ·
                                </span>
                                <span className={hasActualRange ? 'gantt-dur-act' : 'gantt-dur-pending'}>
                                  {hasActualRange ? `${formatNumber(actWidth)}d` : '—'}
                                </span>
                              </div>
                              <div className="track">
                                <div
                                  className="bar est"
                                  style={{ left: `${estLeftPct}%`, width: `${estWidthPct}%` }}
                                  role="presentation"
                                  onMouseEnter={(e) =>
                                    openGanttBarTooltip(e, {
                                      task,
                                      variant: 'est',
                                      primary: {
                                        label: 'Estimated',
                                        start: formatDateShort(isoFromDate(estStart)),
                                        end: formatDateShort(isoFromDate(estEnd)),
                                        days: estWidth,
                                      },
                                      secondary:
                                        hasActualRange && actStart && actEnd
                                          ? {
                                              label: 'Actual',
                                              start: formatDateShort(isoFromDate(actStart)),
                                              end: formatDateShort(isoFromDate(actEnd)),
                                              days: actWidth,
                                            }
                                          : null,
                                      footnote: null,
                                    })
                                  }
                                  onMouseMove={moveGanttBarTooltip}
                                  onMouseLeave={closeGanttBarTooltip}
                                />
                              </div>
                              <div className="track actual">
                                {hasActualRange ? (
                                  <div
                                    className="bar act"
                                    style={{ left: `${actLeftPct}%`, width: `${actWidthPct}%` }}
                                    role="presentation"
                                    onMouseEnter={(e) =>
                                      openGanttBarTooltip(e, {
                                        task,
                                        variant: 'act',
                                        primary: {
                                          label: 'Actual',
                                          start: formatDateShort(isoFromDate(actStart)),
                                          end: formatDateShort(isoFromDate(actEnd)),
                                          days: actWidth,
                                        },
                                        secondary: {
                                          label: 'Estimated',
                                          start: formatDateShort(isoFromDate(estStart)),
                                          end: formatDateShort(isoFromDate(estEnd)),
                                          days: estWidth,
                                        },
                                        footnote: null,
                                      })
                                    }
                                    onMouseMove={moveGanttBarTooltip}
                                    onMouseLeave={closeGanttBarTooltip}
                                  />
                                ) : (
                                  <div
                                    className="bar act-placeholder"
                                    style={{ left: `${estLeftPct}%`, width: `${estWidthPct}%` }}
                                    role="presentation"
                                    onMouseEnter={(e) =>
                                      openGanttBarTooltip(e, {
                                        task,
                                        variant: 'placeholder',
                                        primary: {
                                          label: 'Estimated window (stand-in)',
                                          start: formatDateShort(isoFromDate(estStart)),
                                          end: formatDateShort(isoFromDate(estEnd)),
                                          days: estWidth,
                                        },
                                        secondary: null,
                                        footnote:
                                          'Actual start/end not set yet. The stand-in bar shows your planned window until you add actual dates.',
                                      })
                                    }
                                    onMouseMove={moveGanttBarTooltip}
                                    onMouseLeave={closeGanttBarTooltip}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === 'budget' && (
        <>
          <section className="card dashboard-grid">
            <article><p className="label">Total Budget</p><h2>{formatMoney(budgetSummary.totalBudget)}</h2></article>
            <article><p className="label">Actual Spending</p><h2>{formatMoney(budgetSummary.totalActual)}</h2></article>
            <article><p className="label">Remaining</p><h2>{formatMoney(budgetSummary.remaining)}</h2></article>
          </section>
          <section className="card">
            <div className="section-head"><h3>Budget Overview</h3></div>
            <p className="budget-chart-legend muted">
              Blue = allocated budget per category · Orange = actual spend (easy to compare at a glance).
            </p>
            <div className="budget-overview-chart">
              <ResponsiveContainer width="100%" height={budgetOverviewChartHeight}>
                <BarChart
                  layout="vertical"
                  data={budgetChartData}
                  margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
                  barCategoryGap="12%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => formatMoney(v)} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={220}
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <Tooltip formatter={(v) => formatMoney(v)} labelFormatter={(label) => label} />
                  <Legend wrapperStyle={{ paddingTop: 8 }} />
                  <Bar name="Budget" dataKey="Budget" fill="#bfdbfe" radius={[0, 4, 4, 0]} />
                  <Bar name="Actual" dataKey="Actual" fill="#fb923c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="card">
            <div className="section-head">
              <h3>Budget</h3>
            </div>
            <p className="muted budget-section-lead">
              Line items roll up to subtotals per category; the footer shows project-wide planned and actual totals. Allocated amounts are your category caps (overview chart).
            </p>
            <div className="table-wrap budget-table-wrap">
              <table className="timelines-table budget-table">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col" className="budget-col-planned">
                      Planned <span className="budget-th-hint">(sum of lines)</span>
                    </th>
                    <th scope="col" className="budget-col-actual">
                      Actual <span className="budget-th-hint">(sum of lines)</span>
                    </th>
                    <th scope="col">Payment date</th>
                    <th scope="col" className="budget-col-delete">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {budgetSummary.rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="budget-empty-cell">
                        <p className="muted">No budget categories yet.</p>
                      </td>
                    </tr>
                  ) : (
                    budgetSummary.rows.map((category) => (
                    <Fragment key={category.id}>
                      <tr className="group-row budget-category-row">
                        <td colSpan={5}>
                          <div className="budget-category-banner">
                            <div className="budget-category-banner-text">
                              <strong>{category.category}</strong>
                              <span className="budget-category-stats muted">
                                <span className="budget-category-stat">
                                  <span className="budget-stat-label">Allocated</span> {formatMoney(category.allocation)}
                                </span>
                                <span className="budget-stat-sep" aria-hidden>
                                  ·
                                </span>
                                <span className="budget-category-stat">
                                  <span className="budget-stat-label">Planned</span> {formatMoney(category.planned)}
                                </span>
                                <span className="budget-stat-sep" aria-hidden>
                                  ·
                                </span>
                                <span className="budget-category-stat">
                                  <span className="budget-stat-label">Actual</span> {formatMoney(category.actual)}
                                </span>
                                <span className="budget-stat-sep" aria-hidden>
                                  ·
                                </span>
                                <span className="budget-category-stat">
                                  <span className="budget-stat-label">Left</span> {formatMoney(category.remaining)}
                                </span>
                              </span>
                            </div>
                            <div className="budget-category-track">
                              <div className="mini-track" title="Spend vs allocation">
                                <div
                                  className={category.actual > category.allocation ? 'mini-bar red' : 'mini-bar'}
                                  style={{
                                    width: `${Math.min(100, Math.round((category.actual / (category.allocation || 1)) * 100))}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <button type="button" className="budget-add-item-btn" onClick={() => addBudgetItem(category.id)}>
                              + Add item
                            </button>
                          </div>
                        </td>
                      </tr>
                      {category.items.map((item) => {
                        const overPlanned = Number(item.actual || 0) > Number(item.planned || 0)
                        return (
                          <tr key={item.id} className="budget-item-row">
                            <td className="budget-col-item">
                              <input value={item.name} onChange={(e) => updateBudgetItem(category.id, item.id, 'name', e.target.value)} />
                            </td>
                            <td className="budget-col-planned">
                              <input
                                type="number"
                                value={item.planned}
                                onChange={(e) => updateBudgetItem(category.id, item.id, 'planned', Number(e.target.value))}
                              />
                            </td>
                            <td className="budget-col-actual">
                              <input
                                type="number"
                                className={overPlanned ? 'budget-actual-input over-planned' : 'budget-actual-input'}
                                value={item.actual}
                                onChange={(e) => {
                                  const raw = e.target.value
                                  updateBudgetItem(category.id, item.id, 'actual', raw === '' ? 0 : Number(raw))
                                }}
                              />
                            </td>
                            <td className="budget-col-payment-date">
                              <input
                                type="date"
                                value={item.paymentDate || ''}
                                onChange={(e) => updateBudgetItem(category.id, item.id, 'paymentDate', e.target.value)}
                              />
                            </td>
                            <td className="menu-cell">
                              <button
                                type="button"
                                className="icon-btn task-delete-btn"
                                title="Remove line item"
                                aria-label={`Remove ${item.name || 'item'}`}
                                onClick={() => removeBudgetItem(category.id, item.id)}
                              >
                                <svg
                                  className="task-delete-icon"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  aria-hidden
                                >
                                  <path
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      <tr className="budget-subtotal-row">
                        <th scope="row" className="budget-col-item budget-subtotal-label">
                          Subtotal
                        </th>
                        <td className="budget-col-planned budget-num">{formatMoney(category.planned)}</td>
                        <td className="budget-col-actual budget-num">{formatMoney(category.actual)}</td>
                        <td className="budget-col-payment-date budget-subtotal-muted">—</td>
                        <td className="budget-col-delete" />
                      </tr>
                    </Fragment>
                  ))
                  )}
                </tbody>
                {budgetSummary.rows.length > 0 && (
                  <tfoot>
                    <tr className="budget-grand-total-row">
                      <th scope="row" className="budget-col-item">
                        Total
                      </th>
                      <td className="budget-col-planned budget-num">{formatMoney(budgetSummary.totalPlanned)}</td>
                      <td className="budget-col-actual budget-num">{formatMoney(budgetSummary.totalActual)}</td>
                      <td className="budget-col-payment-date" />
                      <td className="budget-col-delete" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        </>
      )}

      {categoryEditorOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-editor-title"
          onClick={() => setCategoryEditorOpen(false)}
        >
          <div className="modal modal-category-editor" onClick={(e) => e.stopPropagation()}>
            <h3 id="category-editor-title">Task categories</h3>
            <p className="muted">Rename, add, or remove categories. Tasks with a removed category move to the first category in the list.</p>
            <ul className="category-editor-list">
              {categoryDraft.map((label, i) => (
                <li key={i}>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => {
                      const next = [...categoryDraft]
                      next[i] = e.target.value
                      setCategoryDraft(next)
                    }}
                    aria-label={`Category ${i + 1}`}
                  />
                  <button
                    type="button"
                    className="danger"
                    disabled={categoryDraft.length <= 1}
                    title={categoryDraft.length <= 1 ? 'Keep at least one category' : 'Remove category'}
                    onClick={() => {
                      if (categoryDraft.length <= 1) return
                      setCategoryDraft(categoryDraft.filter((_, j) => j !== i))
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="category-editor-add"
              onClick={() => setCategoryDraft([...categoryDraft, 'New category'])}
            >
              + Add category
            </button>
            <div className="modal-actions">
              <button type="button" onClick={() => setCategoryEditorOpen(false)}>
                Cancel
              </button>
              <button type="button" onClick={saveCategoryEditor}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteId && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-task-title" onClick={() => setPendingDeleteId(null)}>
          <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h3 id="delete-task-title">Delete this task?</h3>
            <p className="muted">This cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setPendingDeleteId(null)}>Cancel</button>
              <button type="button" className="danger" onClick={() => deleteTask(pendingDeleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      </main>
      {ganttBarTooltip &&
        createPortal(
          <div
            className="gantt-bar-tooltip"
            style={{
              position: 'fixed',
              left: Math.min(
                ganttBarTooltip.x + 14,
                typeof window !== 'undefined' ? window.innerWidth - 300 : ganttBarTooltip.x + 14,
              ),
              top: Math.min(
                ganttBarTooltip.y + 14,
                typeof window !== 'undefined' ? window.innerHeight - 260 : ganttBarTooltip.y + 14,
              ),
              zIndex: 10000,
              pointerEvents: 'none',
            }}
            role="tooltip"
          >
            <p className="gantt-bar-tooltip-task">{ganttBarTooltip.task.task}</p>
            <p className="gantt-bar-tooltip-category muted">
              {ganttBarTooltip.task.category}
              {ganttBarTooltip.task.owner ? ` · ${ganttBarTooltip.task.owner}` : ''}
            </p>
            <div className="gantt-bar-tooltip-tags">
              {ganttBarTooltip.task.isMilestone ? (
                <span className="gantt-bar-tooltip-tag">Milestone</span>
              ) : null}
              <span className="gantt-bar-tooltip-tag">{ganttBarTooltip.task.status}</span>
            </div>
            <div className="gantt-bar-tooltip-block">
              <span className="gantt-bar-tooltip-label">{ganttBarTooltip.primary.label}</span>
              <span className="gantt-bar-tooltip-dates">
                {ganttBarTooltip.primary.start} → {ganttBarTooltip.primary.end}
              </span>
              <span className="gantt-bar-tooltip-days">{formatNumber(ganttBarTooltip.primary.days)} days</span>
            </div>
            {ganttBarTooltip.secondary ? (
              <div className="gantt-bar-tooltip-block gantt-bar-tooltip-block-compare">
                <span className="gantt-bar-tooltip-label">{ganttBarTooltip.secondary.label}</span>
                <span className="gantt-bar-tooltip-dates">
                  {ganttBarTooltip.secondary.start} → {ganttBarTooltip.secondary.end}
                </span>
                <span className="gantt-bar-tooltip-days muted">{formatNumber(ganttBarTooltip.secondary.days)} days</span>
              </div>
            ) : null}
            {ganttBarTooltip.footnote ? (
              <p className="gantt-bar-tooltip-footnote muted">{ganttBarTooltip.footnote}</p>
            ) : null}
          </div>,
          document.body,
        )}
    </>
  )
}

export default App
