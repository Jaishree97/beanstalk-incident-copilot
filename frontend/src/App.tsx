import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Gauge,
  LayoutDashboard,
  Menu,
  Moon,
  RefreshCw,
  Server,
  Settings,
  ShieldCheck,
  Sun,
  Terminal,
  X,
  Zap,
} from 'lucide-react'

import { fetchIncidents } from './services/api'
import type { Incident } from './types/incident'

function formatTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function severityStyles(severity: string) {
  switch (severity.toLowerCase()) {
    case 'critical':
      return {
        badge: 'border-red-200 bg-red-50 text-red-700',
        dot: 'bg-red-500',
        accent: 'border-l-red-500',
      }

    case 'high':
      return {
        badge: 'border-orange-200 bg-orange-50 text-orange-700',
        dot: 'bg-orange-500',
        accent: 'border-l-orange-500',
      }

    case 'medium':
      return {
        badge: 'border-amber-200 bg-amber-50 text-amber-700',
        dot: 'bg-amber-500',
        accent: 'border-l-amber-500',
      }

    default:
      return {
        badge: 'border-slate-200 bg-slate-50 text-slate-600',
        dot: 'bg-slate-400',
        accent: 'border-l-slate-400',
      }
  }
}

function App() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selected, setSelected] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('beanstalk-theme') === 'dark'
  })

  useEffect(() => {
    const root = document.documentElement

    root.classList.toggle('dark', darkMode)
    root.style.colorScheme = darkMode ? 'dark' : 'light'

    localStorage.setItem(
      'beanstalk-theme',
      darkMode ? 'dark' : 'light',
    )
  }, [darkMode])

  async function loadIncidents() {
    try {
      setLoading(true)
      setError('')

      const data = await fetchIncidents()

      setIncidents(data)

      setSelected((current) => {
        if (current) {
          return (
            data.find(
              (item) => item.incident_id === current.incident_id,
            ) ??
            data[0] ??
            null
          )
        }

        return data[0] ?? null
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load incidents',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncidents()
  }, [])

  const criticalCount = useMemo(
    () =>
      incidents.filter(
        (item) => item.severity.toLowerCase() === 'critical',
      ).length,
    [incidents],
  )

  const averageConfidence = useMemo(() => {
    if (!incidents.length) return 0

    return Math.round(
      incidents.reduce(
        (sum, item) => sum + item.confidence,
        0,
      ) / incidents.length,
    )
  }, [incidents])

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900 transition-colors duration-200 dark:bg-[#0b1120] dark:text-slate-100">

        {/* Mobile navigation overlay */}
        {mobileNav && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
            onClick={() => setMobileNav(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[248px] border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-950 lg:translate-x-0 ${
            mobileNav
              ? 'translate-x-0'
              : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">

            {/* Brand */}
            <div className="flex h-[72px] items-center border-b border-slate-200 px-5 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 dark:bg-white">
                <Activity className="h-5 w-5 text-white dark:text-slate-900" />
              </div>

              <div className="ml-3">
                <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Beanstalk
                </div>

                <div className="text-[11px] font-medium text-slate-400">
                  Incident Copilot
                </div>
              </div>

              <button
                className="ml-auto text-slate-400 lg:hidden"
                onClick={() => setMobileNav(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Workspace */}
            <div className="px-3 py-5">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Workspace
              </div>

              <NavItem
                active
                icon={<LayoutDashboard />}
                label="Overview"
              />

              <NavItem
                icon={<AlertCircle />}
                label="Incidents"
                count={incidents.length}
              />

              <NavItem
                icon={<Server />}
                label="Environments"
              />

              <NavItem
                icon={<Activity />}
                label="Monitoring"
              />
            </div>

            {/* Configuration */}
            <div className="px-3">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Configuration
              </div>

              <NavItem
                icon={<Bell />}
                label="Notifications"
              />

              <NavItem
                icon={<Settings />}
                label="Settings"
              />
            </div>

            {/* Sidebar status */}
            <div className="mt-auto border-t border-slate-200 p-4 dark:border-slate-800">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>

                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Copilot online
                  </span>
                </div>

                <div className="mt-2 text-[11px] leading-5 text-slate-400">
                  Monitoring victim-app-prod
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main application */}
        <div className="lg:pl-[248px]">

          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <div className="flex h-[72px] items-center justify-between px-5 sm:px-8">

              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                  onClick={() => setMobileNav(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div>
                  <div className="text-xs font-medium text-slate-400">
                    Operations
                  </div>

                  <h1 className="text-base font-semibold text-slate-900 dark:text-white">
                    Incident Overview
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">

                {/* Theme switch */}
                <button
                  onClick={() =>
                    setDarkMode((value) => !value)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  title={
                    darkMode
                      ? 'Switch to light mode'
                      : 'Switch to dark mode'
                  }
                >
                  {darkMode ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>

                {/* Environment */}
                <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Production
                  </span>
                </div>

                {/* Refresh */}
                <button
                  onClick={loadIncidents}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      loading ? 'animate-spin' : ''
                    }`}
                  />

                  <span className="hidden sm:inline">
                    Refresh
                  </span>
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8">

            {/* Page heading */}
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
                  Production health
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Good morning, Operations
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Monitor incidents and investigate production issues from one place.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                Updated just now
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            {/* KPI cards */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <KpiCard
                label="Critical incidents"
                value={criticalCount}
                detail={
                  criticalCount
                    ? 'Requires attention'
                    : 'No active issues'
                }
                icon={<AlertCircle />}
                tone="red"
              />

              <KpiCard
                label="Investigated incidents"
                value={incidents.length}
                detail="AI-assisted investigations"
                icon={<Activity />}
                tone="blue"
              />

              <KpiCard
                label="AI confidence"
                value={`${averageConfidence}%`}
                detail="Average RCA confidence"
                icon={<Gauge />}
                tone="purple"
              />

              <KpiCard
                label="Detection pipeline"
                value="Healthy"
                detail="Alarm → AI → RCA"
                icon={<ShieldCheck />}
                tone="green"
              />
            </section>

            {/* Latest incident */}
            {selected ? (
              <section className="mt-8">

                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Latest incident
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Most recent automated investigation
                    </p>
                  </div>

                  <span className="text-xs text-slate-400">
                    {formatTime(selected.created_at)}
                  </span>
                </div>

                <IncidentHero incident={selected} />
              </section>
            ) : (
              <HealthyState />
            )}

            {/* Incident history */}
            <section className="mt-8">

              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Incident history
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Previously detected production events
                </p>
              </div>

              <IncidentTable
                incidents={incidents}
                selected={selected}
                onSelect={setSelected}
              />
            </section>

            {/* Investigation workspace */}
            {selected && (
              <section className="mt-8">

                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Investigation
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Evidence collected and automated response analysis
                  </p>
                </div>

                {/* Evidence + Timeline */}
                <div className="grid gap-6 lg:grid-cols-2">

                  <InfoBlock
                    title="Evidence collected"
                    icon={
                      <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    }
                  >
                    <div className="space-y-2">
                      {selected.evidence.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-5 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                          >
                            <span className="mr-2 text-slate-300 dark:text-slate-600">
                              {String(index + 1).padStart(
                                2,
                                '0',
                              )}
                            </span>

                            {item}
                          </div>
                        ),
                      )}
                    </div>
                  </InfoBlock>

                  <InfoBlock
                    title="Incident timeline"
                    icon={
                      <Clock3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    }
                  >
                    <div>
                      <TimelineItem
                        time={formatTime(
                          selected.created_at,
                        )}
                        title="Incident detected"
                        description={`CloudWatch alarm ${selected.alarm_name} triggered.`}
                        status="alert"
                      />

                      <TimelineItem
                        time="Automated"
                        title="Evidence collected"
                        description="Application logs and monitoring telemetry collected."
                        status="info"
                      />

                      <TimelineItem
                        time="Automated"
                        title="AI investigation completed"
                        description={`Root cause identified with ${selected.confidence}% confidence.`}
                        status="success"
                      />

                      <TimelineItem
                        time="Next action"
                        title="Remediation recommended"
                        description="Response actions generated for the operator."
                        status="warning"
                        last
                      />
                    </div>
                  </InfoBlock>
                </div>

                {/* Response + Prevention */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">

                  <InfoBlock
                    title="Recommended response"
                    icon={
                      <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    }
                  >
                    <div className="space-y-2">
                      {selected.recommended_actions.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                              {index + 1}
                            </span>

                            <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                              {item}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </InfoBlock>

                  <InfoBlock
                    title="Prevention"
                    icon={
                      <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    }
                  >
                    <div className="space-y-2">
                      {selected.prevention.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-violet-100 bg-violet-50/40 p-3 text-xs leading-5 text-slate-600 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-slate-300"
                          >
                            <span className="mr-2 font-bold text-violet-600 dark:text-violet-400">
                              {index + 1}.
                            </span>

                            {item}
                          </div>
                        ),
                      )}
                    </div>
                  </InfoBlock>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

function NavItem({
  icon,
  label,
  active = false,
  count,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  count?: number
}) {
  return (
    <button
      className={`mb-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition ${
        active
          ? 'bg-slate-900 font-semibold text-white dark:bg-white dark:text-slate-950'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <span className="mr-3 h-4 w-4 [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>

      <span>{label}</span>

      {count !== undefined && (
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
            active
              ? 'bg-white/10 text-white dark:bg-slate-900 dark:text-slate-950'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* KPI Card                                                                   */
/* -------------------------------------------------------------------------- */

function KpiCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string
  value: string | number
  detail: string
  icon: ReactNode
  tone: 'red' | 'blue' | 'purple' | 'green'
}) {
  const tones = {
    red: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
    purple:
      'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
    green:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between">

        <div>
          <p className="text-xs font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>
        </div>

        <div className={`rounded-lg p-2.5 ${tones[tone]}`}>
          <span className="[&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        {detail}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Latest Incident                                                            */
/* -------------------------------------------------------------------------- */

function IncidentHero({
  incident,
}: {
  incident: Incident
}) {
  const styles = severityStyles(incident.severity)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
      <div className={`border-l-4 ${styles.accent}`}>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_230px]">

          <div className="p-6">

            <div className="flex flex-wrap items-center gap-2">

              <span
                className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}
              >
                {incident.severity}
              </span>

              <span className="text-xs text-slate-400">
                {incident.environment}
              </span>

              <span className="text-slate-300">
                •
              </span>

              <span className="text-xs text-slate-400">
                {incident.alarm_name}
              </span>
            </div>

            <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              {incident.root_cause}
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {incident.summary}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">

              <MetaPill
                icon={<Server />}
                text={incident.environment}
              />

              <MetaPill
                icon={<Database />}
                text={incident.region}
              />

              <MetaPill
                icon={<Clock3 />}
                text={formatShortTime(incident.created_at)}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900 lg:border-l lg:border-t-0">

            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              AI assessment
            </div>

            <div className="mt-3 flex items-end gap-2">

              <span className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                {incident.confidence}%
              </span>

              <span className="pb-1 text-xs font-medium text-slate-400">
                confidence
              </span>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${incident.confidence}%`,
                }}
              />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Evidence-backed RCA
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Metadata Pill                                                              */
/* -------------------------------------------------------------------------- */

function MetaPill({
  icon,
  text,
}: {
  icon: ReactNode
  text: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
      <span className="[&>svg]:h-3 [&>svg]:w-3">
        {icon}
      </span>

      {text}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Incident Table                                                             */
/* -------------------------------------------------------------------------- */

function IncidentTable({
  incidents,
  selected,
  onSelect,
}: {
  incidents: Incident[]
  selected: Incident | null
  onSelect: (incident: Incident) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950">

      <div className="grid grid-cols-[1.5fr_1fr_110px_100px_28px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-800 dark:bg-slate-900">
        <span>Incident</span>
        <span>Environment</span>
        <span>Severity</span>
        <span>Detected</span>
        <span />
      </div>

      {incidents.length === 0 ? (
        <div className="p-8 text-center">

          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            No incidents detected
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Your monitored environment is healthy.
          </p>
        </div>
      ) : (
        incidents.map((incident) => {
          const styles = severityStyles(
            incident.severity,
          )

          const active =
            selected?.incident_id === incident.incident_id

          return (
            <button
              key={incident.incident_id}
              onClick={() => onSelect(incident)}
              className={`grid w-full grid-cols-[1.5fr_1fr_110px_100px_28px] gap-4 border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0 dark:border-slate-800 ${
                active
                  ? 'bg-blue-50/50 dark:bg-blue-950/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >

              <div className="min-w-0">

                <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {incident.root_cause}
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Terminal className="h-3 w-3" />
                  {incident.incident_id.slice(0, 8)}
                </div>
              </div>

              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                {incident.environment}
              </div>

              <div className="flex items-center">

                <span
                  className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${styles.badge}`}
                >
                  {incident.severity}
                </span>
              </div>

              <div className="flex items-center text-xs text-slate-400">
                {formatShortTime(incident.created_at)}
              </div>

              <div className="flex items-center justify-end text-slate-300 dark:text-slate-600">
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Timeline                                                                   */
/* -------------------------------------------------------------------------- */

function TimelineItem({
  time,
  title,
  description,
  status,
  last = false,
}: {
  time: string
  title: string
  description: string
  status: 'alert' | 'info' | 'success' | 'warning'
  last?: boolean
}) {
  const styles = {
    alert: {
      dot: 'bg-red-500',
      line: 'bg-red-100 dark:bg-red-950',
    },

    info: {
      dot: 'bg-blue-500',
      line: 'bg-blue-100 dark:bg-blue-950',
    },

    success: {
      dot: 'bg-emerald-500',
      line: 'bg-emerald-100 dark:bg-emerald-950',
    },

    warning: {
      dot: 'bg-amber-500',
      line: 'bg-amber-100 dark:bg-amber-950',
    },
  }

  const style = styles[status]

  return (
    <div className="flex gap-4">

      <div className="flex w-4 flex-col items-center">

        <span
          className={`mt-1.5 h-2.5 w-2.5 rounded-full ${style.dot}`}
        />

        {!last && (
          <span
            className={`mt-1 w-px flex-1 ${style.line}`}
          />
        )}
      </div>

      <div className={`pb-6 ${last ? '' : ''}`}>

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {time}
        </div>

        <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
          {title}
        </div>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Information Block                                                          */
/* -------------------------------------------------------------------------- */

function InfoBlock({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950">

      <div className="mb-4 flex items-center gap-2">

        <div className="rounded-md bg-slate-50 p-1.5 dark:bg-slate-900">
          {icon}
        </div>

        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {title}
        </h4>
      </div>

      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Healthy State                                                              */
/* -------------------------------------------------------------------------- */

function HealthyState() {
  return (
    <section className="mt-7 rounded-xl border border-emerald-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-emerald-900/50 dark:bg-slate-950">

      <div className="flex items-center gap-4">

        <div className="rounded-full bg-emerald-50 p-3 dark:bg-emerald-950/40">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div>

          <h3 className="font-bold text-slate-900 dark:text-white">
            All monitored systems are healthy
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Beanstalk Incident Copilot is actively monitoring your production environment.
          </p>
        </div>
      </div>
    </section>
  )
}

export default App