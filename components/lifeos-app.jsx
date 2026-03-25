"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  CircleDollarSign,
  Command,
  Droplets,
  Download,
  LampDesk,
  LayoutPanelTop,
  Flame,
  Gem,
  GraduationCap,
  HeartPulse,
  Link2,
  MoonStar,
  Save,
  RefreshCw,
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
  generateSyncCode,
  migrateState,
  moneyTasks,
  studyTasks,
  touchState,
  createSyncPayload,
  writeBackupSnapshot,
  readBackups
} from "@/lib/lifeos-data";
import { fetchSyncState, pushSyncState } from "@/lib/sync-client";
import { choosePreferredSyncState } from "@/lib/lifeos-data";

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
  { href: "/settings", label: "Settings" },
  { href: "/rooms/office", label: "Office" }
];

export function LifeOSApp({ view = "dashboard" }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [backupCount, setBackupCount] = useState(0);
  const todayKey = getTodayKey();
  const pathname = usePathname();
  const pollingRef = useRef(null);
  const pushTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const migrated = migrateState(JSON.parse(raw));
        setState(migrated);
        setSyncCodeInput(migrated.sync.syncCode || "");
      }
    } catch {}
    setBackupCount(readBackups().length);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  useEffect(() => {
    if (!ready || state.sync.mode !== "anonymous" || !state.sync.syncCode) return;

    window.clearTimeout(pushTimeoutRef.current);
    pushTimeoutRef.current = window.setTimeout(async () => {
      try {
        await pushSyncState(state.sync.syncCode, createSyncPayload(state));
        setState((current) => ({
          ...current,
          sync: {
            ...current.sync,
            status: "synced",
            lastSyncedAt: new Date().toISOString(),
            error: ""
          }
        }));
      } catch {
        setState((current) => ({
          ...current,
          sync: {
            ...current.sync,
            status: "error",
            error: "Sync push failed."
          }
        }));
      }
    }, 600);

    return () => window.clearTimeout(pushTimeoutRef.current);
  }, [ready, state.sync.mode, state.sync.syncCode, state.sync.updatedAt]);

  useEffect(() => {
    if (!ready || state.sync.mode !== "anonymous" || !state.sync.syncCode) return;

    const poll = async () => {
      try {
        const remoteState = await fetchSyncState(state.sync.syncCode);
        if (!remoteState) return;
        const preferred = choosePreferredSyncState(state, remoteState);
        if (preferred.sync.updatedAt === remoteState.sync?.updatedAt && preferred.sync.syncCode === remoteState.sync?.syncCode) {
          setState(
            migrateState({
              ...preferred,
              sync: {
                ...preferred.sync,
                status: "synced",
                error: ""
              }
            })
          );
        }
      } catch {
        setState((current) => ({
          ...current,
          sync: {
            ...current.sync,
            status: "error",
            error: "Sync pull failed."
          }
        }));
      }
    };

    poll();
    pollingRef.current = window.setInterval(poll, 5000);
    return () => window.clearInterval(pollingRef.current);
  }, [ready, state.sync.mode, state.sync.syncCode, state.sync.updatedAt]);

  const commitState = (updater) => {
    setState((current) => touchState(updater(current)));
  };

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
    commitState((current) => {
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

  const addTodo = (projectId) => {
    commitState((current) => ({
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
    commitState((current) => ({
      ...current,
      workProjects: current.workProjects.map((project) =>
        project.id === projectId ? { ...project, name } : project
      )
    }));
  };

  const renameTodo = (projectId, todoId, label) => {
    commitState((current) => ({
      ...current,
      workProjects: current.workProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              todos: project.todos.map((todo) =>
                todo.id === todoId ? { ...todo, label } : todo
              )
            }
          : project
      )
    }));
  };

  const updateProfile = (key, value) => {
    commitState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [key]: value
      }
    }));
  };

  const enableAnonymousSync = async (requestedCode) => {
    const code = (requestedCode || generateSyncCode()).trim().toUpperCase();
    const nextState = touchState({
      ...state,
      sync: {
        ...state.sync,
        syncCode: code,
        userId: null,
        mode: "anonymous",
        status: "connecting",
        error: ""
      }
    });

    setState(nextState);
    setSyncCodeInput(code);

    try {
      const remoteState = await fetchSyncState(code);
      if (remoteState) {
        const preferred = choosePreferredSyncState(nextState, remoteState);
        if (preferred.sync.updatedAt === nextState.sync.updatedAt) {
          await pushSyncState(code, createSyncPayload(nextState));
          setState({
            ...nextState,
            sync: {
              ...nextState.sync,
              status: "synced",
              lastSyncedAt: new Date().toISOString(),
              error: ""
            }
          });
        } else {
          setState(
            migrateState({
              ...preferred,
              sync: {
                ...preferred.sync,
                syncCode: code,
                mode: "anonymous",
                status: "synced",
                error: ""
              }
            })
          );
        }
      } else {
        await pushSyncState(code, createSyncPayload(nextState));
        setState((current) => ({
          ...current,
          sync: {
            ...current.sync,
            status: "synced",
            lastSyncedAt: new Date().toISOString(),
            error: ""
          }
        }));
      }
    } catch {
      setState((current) => ({
        ...current,
        sync: {
          ...current.sync,
          status: "error",
          error: "Unable to connect sync code."
        }
      }));
    }
  };

  const saveBackup = () => {
    const backups = writeBackupSnapshot(state);
    setBackupCount(backups.length);
    setState((current) => ({
      ...current,
      sync: {
        ...current.sync,
        lastBackupAt: new Date().toISOString(),
        error: ""
      }
    }));
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(createSyncPayload(state), null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const pullNow = async () => {
    if (!state.sync.syncCode) return;
    try {
      const remoteState = await fetchSyncState(state.sync.syncCode);
      if (!remoteState) return;
      const preferred = choosePreferredSyncState(state, remoteState);
      setState(
        migrateState({
          ...preferred,
          sync: {
            ...preferred.sync,
            syncCode: state.sync.syncCode,
            mode: "anonymous",
            status: "synced",
            lastSyncedAt: new Date().toISOString(),
            error: ""
          }
        })
      );
    } catch {
      setState((current) => ({
        ...current,
        sync: {
          ...current.sync,
          status: "error",
          error: "Manual pull failed."
        }
      }));
    }
  };

  const pushNow = async () => {
    if (!state.sync.syncCode) return;
    try {
      await pushSyncState(state.sync.syncCode, createSyncPayload(state));
      setState((current) => ({
        ...current,
        sync: {
          ...current.sync,
          status: "synced",
          lastSyncedAt: new Date().toISOString(),
          error: ""
        }
      }));
    } catch {
      setState((current) => ({
        ...current,
        sync: {
          ...current.sync,
          status: "error",
          error: "Manual push failed."
        }
      }));
    }
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
    },
    "office-room": {
      title: "Office",
      description: "A focused room mockup for deep work, project momentum, and daily execution."
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
                <div className="project-list project-list-split">
                  {state.workProjects.map((project) => (
                    <div key={project.id} className="project-column">
                      <div className="project-heading">
                        <input value={project.name} onChange={(event) => renameProject(project.id, event.target.value)} />
                        <button className="ghost-button" onClick={() => addTodo(project.id)}>
                          <Plus size={16} />
                          Todo
                        </button>
                      </div>
                      <div className="project-card">
                        <div className="todo-list">
                          {project.todos.map((todo) => {
                            const done = Boolean(getLogValue(state.logs, todayKey, `${project.id}:${todo.id}`));
                          return (
                            <div key={todo.id} className={`todo-row ${done ? "is-done" : ""}`}>
                              <button className={`todo-check ${done ? "is-done" : ""}`} onClick={() => toggleTodo(project.id, todo.id)}>
                                {done ? "Done" : "Mark"}
                              </button>
                              <input
                                className="todo-input"
                                value={todo.label}
                                onChange={(event) => renameTodo(project.id, todo.id, event.target.value)}
                              />
                              <small>+10 XP</small>
                            </div>
                          );
                        })}
                      </div>
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
                    <div className="group-title">Sync</div>
                    <div className="controls-grid">
                      <label>
                        Sync Code
                        <input value={syncCodeInput} onChange={(event) => setSyncCodeInput(event.target.value.toUpperCase())} />
                      </label>
                      <label>
                        Status
                        <input value={state.sync.mode === "anonymous" ? state.sync.status : "local only"} readOnly />
                      </label>
                    </div>
                    <div className="preset-row">
                      <button className="ghost-button" onClick={() => enableAnonymousSync()}>
                        <Link2 size={16} />
                        Create Sync Code
                      </button>
                      <button className="ghost-button" onClick={() => enableAnonymousSync(syncCodeInput)}>
                        <RefreshCw size={16} />
                        Connect Code
                      </button>
                      <button className="ghost-button" onClick={pushNow} disabled={!state.sync.syncCode}>
                        <RefreshCw size={16} />
                        Push Now
                      </button>
                      <button className="ghost-button" onClick={pullNow} disabled={!state.sync.syncCode}>
                        <Download size={16} />
                        Pull Now
                      </button>
                      <button className="ghost-button" onClick={saveBackup}>
                        <Save size={16} />
                        Save Backup
                      </button>
                      <button className="ghost-button" onClick={exportBackup}>
                        <Download size={16} />
                        Export JSON
                      </button>
                    </div>
                    <p className="muted">
                      Persistent sync now expects a Supabase backend. Backups and manual recovery are kept as safety tools.
                    </p>
                    {state.sync.syncCode ? (
                      <p className="muted">
                        Active code: <strong>{state.sync.syncCode}</strong>
                        {state.sync.lastSyncedAt ? ` · Last sync ${new Date(state.sync.lastSyncedAt).toLocaleTimeString()}` : ""}
                      </p>
                    ) : null}
                    <p className="muted">
                      Local backups: {backupCount}
                      {state.sync.lastBackupAt ? ` · Last backup ${new Date(state.sync.lastBackupAt).toLocaleTimeString()}` : ""}
                    </p>
                    {state.sync.error ? <p className="muted">{state.sync.error}</p> : null}
                  </div>

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

            {view === "office-room" ? (
              <section className="room-shell">
                <div className="room-stage">
                  <div className="room-glow room-glow-left" />
                  <div className="room-glow room-glow-right" />
                  <div className="office-header-bar">
                    <div className="wall-panel wall-panel-wide">
                      <span>Shared Office</span>
                      <div className="wall-lines">
                        <i />
                        <i />
                        <i />
                      </div>
                    </div>
                    <div className="wall-panel">
                      <LayoutPanelTop size={16} />
                      <span>{formatNumber(todayXP)} XP online</span>
                    </div>
                  </div>

                  <div className="shared-office-map">
                    <section className="zone-card zone-open">
                      <div className="zone-head">
                        <span className="eyebrow">Open Desks</span>
                        <b>Open workspace</b>
                      </div>
                      <div className="open-desk-grid">
                        {Array.from({ length: 8 }).map((_, index) => (
                          <div key={index} className="desk-pod">
                            <div className="desk-screen" />
                            <div className="desk-chair" />
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="zone-card zone-private">
                      <div className="zone-head">
                        <span className="eyebrow">Private Office</span>
                        <b>Independent room</b>
                      </div>
                      <div className="room-box room-box-large">
                        <div className="room-label">Founder Suite</div>
                        <div className="room-monitor" />
                        <div className="room-chair" />
                      </div>
                    </section>

                    <section className="zone-card zone-meetings">
                      <div className="zone-head">
                        <span className="eyebrow">Focus Rooms</span>
                        <b>1 / 2 / 3 / 5 seats</b>
                      </div>
                      <div className="meeting-grid">
                        {[1, 2, 3, 5].map((size) => (
                          <div key={size} className="room-box">
                            <div className="room-label">{size}-Person</div>
                            <div className={`seat-row seat-row-${size}`}>
                              {Array.from({ length: size }).map((__, seat) => (
                                <span key={seat} className="seat-dot" />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="zone-card zone-lounge">
                      <div className="zone-head">
                        <span className="eyebrow">Shared Lounge</span>
                        <b>Reset and casual talk</b>
                      </div>
                      <div className="lounge-layout">
                        <div className="sofa sofa-left" />
                        <div className="lounge-table" />
                        <div className="sofa sofa-right" />
                        <div className="coffee-bar">
                          <LampDesk size={18} />
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <div className="room-meta-grid">
                  <article className="room-meta-card">
                    <span className="eyebrow">Scene Intent</span>
                    <h3>Shared office for workers and solo founders.</h3>
                    <p className="muted">
                      The office is organized like a real coworking space: open desks for ambient focus, private rooms for deeper work, and shared space for low-pressure breaks.
                    </p>
                  </article>

                  <article className="room-meta-card">
                    <span className="eyebrow">What It Could Show</span>
                    <ul className="room-list">
                      <li>Real users occupying desk zones</li>
                      <li>Status badges like Working, Focus, Break</li>
                      <li>Room access by solo or team size</li>
                      <li>Work module tasks linked to a chosen seat</li>
                    </ul>
                  </article>
                </div>
              </section>
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
