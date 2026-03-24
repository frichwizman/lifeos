"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  CircleDollarSign,
  Command,
  Droplets,
  Flame,
  Gem,
  GraduationCap,
  HeartPulse,
  MoonStar,
  ShieldCheck,
  Sparkle,
  Plus,
  Sparkles,
  Users,
  Timer
} from "lucide-react";
import {
  CURRENCIES,
  DEFAULT_STATE,
  LIFE_PILLARS,
  MODULE_COLORS,
  STORAGE_KEY,
  clamp,
  computeIncomeStats,
  formatNumber,
  getCompletedCount,
  getLevel,
  getLogValue,
  getStreak,
  getTaskHistory,
  getTodayKey,
  getTodayXP,
  lifeGroups,
  moneyTasks,
  studyTasks
} from "@/lib/lifeos-data";

const pillarIcons = {
  exercise: Activity,
  "sleep-quality": MoonStar,
  "water-intake": Droplets,
  "stress-level": Sparkle,
  "social-connection": Users,
  "risky-substances": ShieldCheck,
  meditation: HeartPulse
};

const allDefaultTrackedTaskIds = [
  ...studyTasks.map((task) => task.id),
  ...lifeGroups.flatMap((group) => group.items.map((item) => item.id))
];

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/work", label: "Work" },
  { href: "/study", label: "Study" },
  { href: "/life", label: "Life" },
  { href: "/money", label: "Money" },
  { href: "/settings", label: "Settings" }
];

export function LifeOSApp({ view = "dashboard" }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const todayKey = getTodayKey();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const todayXP = getTodayXP(state.logs, todayKey);
  const level = getLevel(state.profile.totalXP);
  const income = computeIncomeStats(state.profile.yearGoal);
  const lifeDoneCount = getCompletedCount(
    state.logs,
    todayKey,
    lifeGroups.flatMap((group) => group.items.map((item) => item.id))
  );
  const studyDoneCount = getCompletedCount(
    state.logs,
    todayKey,
    studyTasks.map((task) => task.id)
  );
  const allHabitsDone = lifeDoneCount === 7 && studyDoneCount === studyTasks.length;
  const pbReady = state.profile.pbXP > 0;
  const pbRatio = pbReady ? clamp(todayXP / state.profile.pbXP, 0, 1.25) : 0;

  const logTask = (task, value) => {
    const normalized =
      task.type === "boolean" ? Boolean(value) : typeof value === "number" ? value : Number(value || 0);
    setState((current) => {
      const previousXP = current.logs?.[todayKey]?.[task.id]?.xp ?? 0;
      const xpBase =
        task.type === "ratingReverse"
          ? Math.round((6 - normalized) * task.xpPerUnit)
          : task.type === "boolean"
            ? normalized
              ? task.xpPerUnit
              : 0
            : Math.round(normalized * task.xpPerUnit);
      const todayWithoutCurrent = getTodayXP(current.logs, todayKey) - previousXP;
      const nextTodayXP = todayWithoutCurrent + xpBase;
      return {
        ...current,
        profile: {
          ...current.profile,
          totalXP: current.profile.totalXP - previousXP + xpBase,
          pbXP: Math.max(current.profile.pbXP, nextTodayXP)
        },
        logs: {
          ...current.logs,
          [todayKey]: {
            ...(current.logs?.[todayKey] ?? {}),
            [task.id]: {
              value: normalized,
              xp: xpBase,
              ts: Date.now()
            }
          }
        }
      };
    });
  };

  const toggleTodo = (projectId, todoId) => {
    const task = { id: `${projectId}:${todoId}`, type: "boolean", xpPerUnit: 10 };
    const currentValue = Boolean(getLogValue(state.logs, todayKey, task.id));
    logTask(task, !currentValue);
  };

  const addProject = () => {
    setState((current) => ({
      ...current,
      workProjects: [
        ...current.workProjects,
        {
          id: `project-${Date.now()}`,
          name: `New Project ${current.workProjects.length + 1}`,
          color: MODULE_COLORS.work,
          todos: []
        }
      ]
    }));
  };

  const addTodo = (projectId) => {
    setState((current) => ({
      ...current,
      workProjects: current.workProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              todos: [
                ...project.todos,
                { id: `todo-${Date.now()}`, label: "New focus item", xp: 10 }
              ]
            }
          : project
      )
    }));
  };

  const renameProject = (projectId, name) => {
    setState((current) => ({
      ...current,
      workProjects: current.workProjects.map((project) =>
        project.id === projectId ? { ...project, name } : project
      )
    }));
  };

  const updateProfile = (key, value) => {
    setState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [key]: value
      }
    }));
  };

  const heroCards = useMemo(
    () => [
      {
        label: "Work Projects",
        value: state.workProjects.length,
        icon: BriefcaseBusiness,
        color: MODULE_COLORS.work
      },
      {
        label: "Study Tasks Done",
        value: `${studyDoneCount}/${studyTasks.length}`,
        icon: GraduationCap,
        color: MODULE_COLORS.study
      },
      {
        label: "Life Pillars Done",
        value: `${lifeDoneCount}/7`,
        icon: HeartPulse,
        color: MODULE_COLORS.life
      },
      {
        label: "Money Logs",
        value: moneyTasks.filter((task) => Number(getLogValue(state.logs, todayKey, task.id) ?? 0) > 0).length,
        icon: CircleDollarSign,
        color: MODULE_COLORS.money
      }
    ],
    [lifeDoneCount, state.logs, state.workProjects.length, studyDoneCount, todayKey]
  );

  const pageMeta = {
    dashboard: {
      title: "Dashboard",
      description: "A compact operating view for your timeline, targets, streaks, and momentum."
    },
    work: {
      title: "Work",
      description: "Project-based execution. Keep today clear, but retain the long game."
    },
    study: {
      title: "Study",
      description: "Log focused learning with presets, notes, and streak visibility."
    },
    life: {
      title: "Life",
      description: "Seven daily pillars that keep energy, clarity, and resilience on track."
    },
    money: {
      title: "Money",
      description: "Record income, expenses, and savings without leaving the operating system."
    },
    settings: {
      title: "Settings",
      description: "Adjust your profile, timeline assumptions, and annual target without cluttering the dashboard."
    }
  }[view];

  const activePath = pathname === "/" ? "/dashboard" : pathname;

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-app">
          <div className="app-icon">
            <Command size={18} />
          </div>
          <div className="hero-app-copy">
            <p className="eyebrow">App</p>
            <h1>LifeOS</h1>
          </div>
        </div>
        <div className="hero-inline-stats">
          <div className="hero-stat hero-stat-compact">
            <strong>LV {level.level}</strong>
          </div>
          <div className="hero-stat hero-stat-compact">
            <strong>{state.profile.name || "User"}</strong>
          </div>
        </div>
      </section>

      <nav className="top-nav" aria-label="Primary">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-link ${activePath === item.href ? "is-active" : ""}`}>
            {item.label}
          </Link>
        ))}
      </nav>

      {view === "dashboard" ? (
        <>
          <section className="dashboard-grid">
            <Card title="Life Timeline" icon={Activity} className="card-timeline">
              <div className="timeline-metrics">
                <TimelineMetric label="Life Used" value={`${Math.round((state.profile.age / state.profile.lifeExpectancy) * 100)}%`} />
                <TimelineMetric
                  label="Days Left"
                  value={formatNumber((state.profile.lifeExpectancy - state.profile.age) * 365)}
                />
                <TimelineMetric
                  label="To Retirement"
                  value={formatNumber(Math.max(0, (state.profile.retirementAge - state.profile.age) * 365))}
                />
              </div>
              <div className="timeline-track">
                <span style={{ width: `${(state.profile.age / state.profile.lifeExpectancy) * 100}%` }} />
              </div>
              <div className="timeline-steps">
                {[0, 18, 25, 35, 65, 85].map((age) => (
                  <span key={age}>{age}</span>
                ))}
              </div>
            </Card>

            <Card title="Year Goal" icon={Gem} className="card-year-goal">
              <div className="metric-row">
                <strong>
                  {state.profile.currency}
                  {formatNumber(state.profile.yearGoal)}
                </strong>
                <span>{Math.round(income.progress * 100)}% through the year</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${income.progress * 100}%` }} />
              </div>
              <div className="timeline-metrics compact">
                <TimelineMetric label="Daily" value={`${state.profile.currency}${formatNumber(income.dailyTarget)}`} />
                <TimelineMetric label="Monthly" value={`${state.profile.currency}${formatNumber(income.monthlyTarget)}`} />
                <TimelineMetric label="Should Have" value={`${state.profile.currency}${formatNumber(income.shouldHaveMade)}`} />
              </div>
            </Card>

            <Card title="Personal Best" icon={Sparkles} className="card-pb">
              <div className="metric-row">
                <strong>{formatNumber(todayXP)} XP</strong>
                <span>PB {formatNumber(state.profile.pbXP || 0)}</span>
              </div>
              <div className={`progress-track ${pbReady && todayXP >= state.profile.pbXP ? "is-gold" : ""}`}>
                <span style={{ width: `${pbReady ? Math.min(pbRatio, 1) * 100 : 0}%` }} />
              </div>
              <p className="muted">
                {pbReady ? "Push past your best session and the bar turns gold." : "PB tracking starts after your first full day."}
              </p>
            </Card>

            <Card title="Core Streaks" icon={Flame} className="card-streaks">
              <div className="streak-widget">
                {["exercise", "meditation", "reading"].map((taskId) => (
                  <StreakMini
                    key={taskId}
                    label={taskId.replace("-", " ")}
                    streak={getStreak(state.logs, taskId)}
                    history={getTaskHistory(state.logs, taskId, 7)}
                  />
                ))}
              </div>
            </Card>

            <Card title="Life Pillars" icon={HeartPulse} className="card-pillars">
              <div className="pillars-grid">
                {LIFE_PILLARS.map((pillar) => {
                  const done = Boolean(getLogValue(state.logs, todayKey, pillar.id));
                  const PillarIcon = pillarIcons[pillar.id] ?? HeartPulse;
                  return (
                    <div
                      key={pillar.id}
                      className={`pillar-hex ${done ? "is-done" : ""}`}
                      style={{ "--pillar-color": pillar.color }}
                    >
                      <PillarIcon size={18} className="pillar-icon" />
                      <span className="pillar-label">{pillar.short}</span>
                    </div>
                  );
                })}
              </div>
              <p className="muted">
                {lifeDoneCount === 7 ? "All done. Every pillar got attention today." : `${lifeDoneCount}/7 pillars completed today.`}
              </p>
            </Card>

          </section>

          <section className="summary-strip">
            <div className="summary-copy">
              <p className="eyebrow">XP Hero Card</p>
              <h2>Today is a compounding system, not a checklist.</h2>
              <p className="muted">Complete all default Life and Study tasks to trigger the daily completion moment.</p>
            </div>
            <div className="overview-cards">
              {heroCards.map((card) => (
                <div key={card.label} className="overview-card" style={{ "--accent": card.color }}>
                  <card.icon size={18} />
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </div>
          </section>

          {allHabitsDone ? (
            <section className="completion-sheet">
              <div>
                <p className="eyebrow">Daily Completion</p>
                <h3>Life + Study default stack completed.</h3>
              </div>
              <div className="completion-stats">
                <span>{formatNumber(todayXP)} XP today</span>
                <span>LV {level.level}</span>
                <span>{allDefaultTrackedTaskIds.length} defaults cleared</span>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <>
          <section className="module-page-intro">
            <p className="eyebrow">{pageMeta.title}</p>
            <h2>{pageMeta.title}</h2>
            <p className="muted">{pageMeta.description}</p>
          </section>

          <section className="modules-grid modules-grid-single">
            {view === "work" ? (
              <ModuleCard title="Work" color={MODULE_COLORS.work} icon={BriefcaseBusiness}>
                <div className="module-head module-head-end">
                  <button className="ghost-button" onClick={addProject}>
                    <Plus size={16} />
                    Add project
                  </button>
                </div>
                <div className="project-list project-list-split">
                  {state.workProjects.map((project) => (
                    <div key={project.id} className="project-card">
                      <div className="project-top">
                        <input value={project.name} onChange={(event) => renameProject(project.id, event.target.value)} />
                        <button className="ghost-button" onClick={() => addTodo(project.id)}>
                          <Plus size={16} />
                          Todo
                        </button>
                      </div>
                      <div className="todo-list">
                        {project.todos.length ? (
                          project.todos.map((todo) => {
                            const done = Boolean(getLogValue(state.logs, todayKey, `${project.id}:${todo.id}`));
                            return (
                              <button
                                key={todo.id}
                                className={`todo-row ${done ? "is-done" : ""}`}
                                onClick={() => toggleTodo(project.id, todo.id)}
                              >
                                <span>{todo.label}</span>
                                <small>+10 XP</small>
                              </button>
                            );
                          })
                        ) : (
                          <div className="empty-state">No todos yet. Add your first focus item.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ModuleCard>
            ) : null}

            {view === "study" ? (
              <ModuleCard title="Study" color={MODULE_COLORS.study} icon={GraduationCap}>
                <TaskList tasks={studyTasks} logs={state.logs} todayKey={todayKey} notes={state.notes} onLog={logTask} showStreaks />
              </ModuleCard>
            ) : null}

            {view === "life" ? (
              <ModuleCard title="Life" color={MODULE_COLORS.life} icon={HeartPulse}>
                <div className="group-stack">
                  {lifeGroups.map((group) => (
                    <div key={group.title} className="task-group">
                      <div className="group-title">{group.title}</div>
                      <TaskList tasks={group.items} logs={state.logs} todayKey={todayKey} notes={state.notes} onLog={logTask} showStreaks />
                    </div>
                  ))}
                </div>
              </ModuleCard>
            ) : null}

            {view === "money" ? (
              <ModuleCard title="Money" color={MODULE_COLORS.money} icon={CircleDollarSign}>
                <TaskList tasks={moneyTasks} logs={state.logs} todayKey={todayKey} notes={{}} onLog={logTask} currency={state.profile.currency} />
              </ModuleCard>
            ) : null}

            {view === "settings" ? (
              <ModuleCard title="Settings" color="#8892a0" icon={Timer}>
                <div className="settings-stack">
                  <div className="settings-group">
                    <div className="group-title">Profile</div>
                    <div className="controls-grid">
                      <label>
                        Name
                        <input value={state.profile.name || ""} onChange={(event) => updateProfile("name", event.target.value)} />
                      </label>
                      <label>
                        Currency
                        <select value={state.profile.currency} onChange={(event) => updateProfile("currency", event.target.value)}>
                          {CURRENCIES.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="group-title">Timeline</div>
                    <div className="controls-grid">
                      <label>
                        Age
                        <input type="number" value={state.profile.age} onChange={(event) => updateProfile("age", Number(event.target.value || 0))} />
                      </label>
                      <label>
                        Retirement Age
                        <input
                          type="number"
                          value={state.profile.retirementAge}
                          onChange={(event) => updateProfile("retirementAge", Number(event.target.value || 0))}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="group-title">Targets</div>
                    <div className="controls-grid">
                      <label>
                        Year Goal
                        <input
                          type="number"
                          value={state.profile.yearGoal}
                          onChange={(event) => updateProfile("yearGoal", Number(event.target.value || 0))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </ModuleCard>
            ) : null}
          </section>
        </>
      )}
    </main>
  );
}

function Card({ title, icon: Icon, children, className = "" }) {
  return (
    <article className={`panel-card ${className}`}>
      <div className="panel-head">
        <div className="panel-title">
          <Icon size={16} />
          <span>{title}</span>
        </div>
      </div>
      {children}
    </article>
  );
}

function ModuleCard({ title, color, icon: Icon, children }) {
  return (
    <section className="module-card" style={{ "--module-color": color }}>
      <div className="module-title">
        <div>
          <Icon size={18} />
          <span>{title}</span>
        </div>
      </div>
      {children}
    </section>
  );
}

function TaskList({ tasks, logs, todayKey, notes, onLog, currency, showStreaks = false }) {
  return (
    <div className="task-list">
      {tasks.map((task) => {
        const value = getLogValue(logs, todayKey, task.id);
        return (
          <div key={task.id} className="task-row">
            <div className="task-copy">
              <div className="task-heading">
                <strong>{task.label}</strong>
                <span className="task-value">
                  {task.type === "boolean"
                    ? value
                      ? "Clean"
                      : "Pending"
                    : value
                      ? `${currency && task.unit === "$" ? currency : ""}${value}${task.unit !== "$" ? ` ${task.unit}` : ""}`
                      : `0 ${task.unit}`}
                </span>
              </div>
              {notes?.[task.id] ? <p>{notes[task.id]}</p> : null}
              {task.type !== "boolean" ? (
                <div className="preset-row">
                  {task.presets?.map((preset) => (
                    <button key={preset} className="chip" onClick={() => onLog(task, preset)}>
                      {currency && task.unit === "$" ? currency : ""}
                      {preset}
                      {task.unit !== "$" ? task.unit : ""}
                    </button>
                  ))}
                </div>
              ) : null}
              {task.type === "rating" || task.type === "ratingReverse" ? (
                <div className="preset-row">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} className={`chip ${value === rating ? "is-active" : ""}`} onClick={() => onLog(task, rating)}>
                      {rating}★
                    </button>
                  ))}
                </div>
              ) : null}
              {task.type === "boolean" ? (
                <button className={`boolean-log ${value ? "is-active" : ""}`} onClick={() => onLog(task, !value)}>
                  {value ? "✓ Clean" : "Log Clean Day"}
                </button>
              ) : null}
              {showStreaks ? (
                <div className="streak-row">
                  {getTaskHistory(logs, task.id).map((entry) => (
                    <span key={entry.key} className={entry.done ? "is-on" : ""} />
                  ))}
                  {getStreak(logs, task.id) >= 2 ? <em>🔥 {getStreak(logs, task.id)}</em> : null}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineMetric({ label, value }) {
  return (
    <div className="timeline-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StreakMini({ label, history, streak }) {
  return (
    <div className="streak-mini streak-inline">
      <span className="capitalize streak-name">{label}</span>
      <div className="streak-row compact">
        {history.map((entry) => (
          <span key={entry.key} className={entry.done ? "is-on" : ""} />
        ))}
      </div>
    </div>
  );
}
