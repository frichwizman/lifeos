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

const OFFICE_MAP = {
  width: 980,
  height: 640
};

const OFFICE_ZONES = [
  { id: "open-desks", label: "Open Desks", kind: "Open Workspace", x: 46, y: 86, width: 360, height: 246, seats: [{ id: "open-1", x: 108, y: 138 }, { id: "open-2", x: 190, y: 138 }, { id: "open-3", x: 272, y: 138 }, { id: "open-4", x: 108, y: 222 }, { id: "open-5", x: 190, y: 222 }, { id: "open-6", x: 272, y: 222 }] },
  { id: "private-office", label: "Private Office", kind: "Independent Room", x: 432, y: 86, width: 214, height: 168, seats: [{ id: "private-1", x: 538, y: 160 }] },
  { id: "room-1", label: "1-Person Room", kind: "Focus Room", x: 686, y: 86, width: 246, height: 112, seats: [{ id: "room-1-seat", x: 808, y: 140 }] },
  { id: "room-2", label: "2-Person Room", kind: "Focus Room", x: 686, y: 214, width: 246, height: 112, seats: [{ id: "room-2-seat-a", x: 774, y: 270 }, { id: "room-2-seat-b", x: 844, y: 270 }] },
  { id: "room-3", label: "3-Person Room", kind: "Focus Room", x: 432, y: 272, width: 214, height: 162, seats: [{ id: "room-3-seat-a", x: 486, y: 354 }, { id: "room-3-seat-b", x: 540, y: 354 }, { id: "room-3-seat-c", x: 594, y: 354 }] },
  { id: "room-5", label: "5-Person Room", kind: "Team Room", x: 686, y: 346, width: 246, height: 178, seats: [{ id: "room-5-seat-a", x: 734, y: 430 }, { id: "room-5-seat-b", x: 776, y: 430 }, { id: "room-5-seat-c", x: 818, y: 430 }, { id: "room-5-seat-d", x: 860, y: 430 }, { id: "room-5-seat-e", x: 798, y: 476 }] },
  { id: "lounge", label: "Shared Lounge", kind: "Break Area", x: 46, y: 366, width: 360, height: 158, seats: [{ id: "lounge-a", x: 130, y: 438 }, { id: "lounge-b", x: 224, y: 438 }, { id: "lounge-c", x: 318, y: 438 }] }
];

const OFFICE_PEERS = [
  { id: "allison", name: "Allison", zoneId: "open-desks", x: 308, y: 244, mood: "Design", avatar: "female" },
  { id: "brad", name: "Brad", zoneId: "room-5", x: 820, y: 514, mood: "Ops", avatar: "male" },
  { id: "jin", name: "Jinen", zoneId: "lounge", x: 154, y: 486, mood: "Break", avatar: "male" }
];

export function LifeOSApp({ view = "dashboard" }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [backupCount, setBackupCount] = useState(0);
  const [officePresence, setOfficePresence] = useState({
    x: 108,
    y: 138,
    zoneId: "open-desks",
    seatId: "open-1",
    status: "Working"
  });
  const todayKey = getTodayKey();
  const pathname = usePathname();
  const pollingRef = useRef(null);
  const pushTimeoutRef = useRef(null);
  const officeMapRef = useRef(null);

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
    if (view !== "office-room") return;

    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (!["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) return;
      event.preventDefault();
      const step = event.shiftKey ? 24 : 16;
      setOfficePresence((current) => {
        let x = current.x;
        let y = current.y;
        if (key === "arrowup" || key === "w") y -= step;
        if (key === "arrowdown" || key === "s") y += step;
        if (key === "arrowleft" || key === "a") x -= step;
        if (key === "arrowright" || key === "d") x += step;
        return {
          ...current,
          x: Math.max(24, Math.min(OFFICE_MAP.width - 24, x)),
          y: Math.max(24, Math.min(OFFICE_MAP.height - 24, y)),
          seatId: ""
        };
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view]);

  useEffect(() => {
    if (view !== "office-room" || officePresence.seatId) return;

    const zone =
      OFFICE_ZONES.find(
        (item) =>
          officePresence.x >= item.x &&
          officePresence.x <= item.x + item.width &&
          officePresence.y >= item.y &&
          officePresence.y <= item.y + item.height
      ) ?? OFFICE_ZONES[0];

    if (zone.id !== officePresence.zoneId) {
      setOfficePresence((current) => ({
        ...current,
        zoneId: zone.id
      }));
    }
  }, [view, officePresence.x, officePresence.y, officePresence.zoneId, officePresence.seatId]);

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
  const activeOfficeZone = OFFICE_ZONES.find((zone) => zone.id === officePresence.zoneId) ?? OFFICE_ZONES[0];

  const moveToSeat = (zoneId, seat) => {
    setOfficePresence((current) => ({
      ...current,
      zoneId,
      seatId: seat.id,
      x: seat.x,
      y: seat.y
    }));
  };

  const setOfficeStatus = (status) => {
    setOfficePresence((current) => ({
      ...current,
      status
    }));
  };

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
                <div className="room-stage room-stage-office">
                  <div className="room-glow room-glow-left" />
                  <div className="room-glow room-glow-right" />
                  <div className="office-mvp-layout">
                    <div className="office-map-panel">
                      <div className="office-map-toolbar">
                        <div>
                          <span className="eyebrow">Shared Office MVP</span>
                          <h3>Single-room office. Walk, sit, and test the layout language.</h3>
                        </div>
                        <div className="office-status-pill">{officePresence.status}</div>
                      </div>

                      <div className="office-map-viewport">
                        <div className="office-map-hint">Drag to explore the room on mobile.</div>
                        <div
                          ref={officeMapRef}
                          className="office-map-surface"
                          style={{ "--map-width": `${OFFICE_MAP.width}px`, "--map-height": `${OFFICE_MAP.height}px` }}
                        >
                          <div className="office-floor office-floor-main" />
                          <div className="office-floor office-floor-lounge" />
                          <div className="office-hallway office-hallway-main" />
                          <div className="office-hallway office-hallway-rooms" />
                          <div className="office-wall office-wall-vertical" />
                          <div className="office-wall office-wall-horizontal" />
                          <div className="office-door office-door-entry" />
                          <div className="office-door office-door-private" />
                          <div className="office-door office-door-room-1" />
                          <div className="office-door office-door-room-2" />
                          <div className="office-door office-door-room-3" />
                          <div className="office-door office-door-room-5" />
                          <div className="office-door office-door-lounge" />
                          <div className="office-room-pill">Product Team</div>

                          {OFFICE_ZONES.map((zone) => (
                            <section
                              key={zone.id}
                              className={`office-zone zone-${zone.id} ${officePresence.zoneId === zone.id ? "is-active" : ""}`}
                              style={{
                                left: `${zone.x}px`,
                                top: `${zone.y}px`,
                                width: `${zone.width}px`,
                                height: `${zone.height}px`
                              }}
                            >
                              <div className="office-zone-label">
                                <strong>{zone.label}</strong>
                                <span>{zone.kind}</span>
                              </div>
                              <OfficeZoneDecor zone={zone} />
                              {zone.seats.map((seat) => (
                                <button
                                  key={seat.id}
                                  className={`office-seat ${officePresence.seatId === seat.id ? "is-occupied" : ""}`}
                                  style={{ left: `${seat.x - zone.x - 10}px`, top: `${seat.y - zone.y - 10}px` }}
                                  onClick={() => moveToSeat(zone.id, seat)}
                                  aria-label={`${zone.label} seat`}
                                />
                              ))}
                            </section>
                          ))}

                          {OFFICE_PEERS.map((peer) => (
                            <div
                              key={peer.id}
                              className={`office-peer ${peer.zoneId === officePresence.zoneId ? "is-nearby" : ""}`}
                              style={{ left: `${peer.x - 18}px`, top: `${peer.y - 18}px` }}
                            >
                              <div className="office-peer-badge">
                                <span>{peer.name}</span>
                                <small>{peer.mood}</small>
                              </div>
                              <div className={`office-avatar-sprite is-peer ${peer.avatar === "female" ? "is-female" : "is-male"}`}>
                                <i />
                                <em />
                                <b />
                                <u />
                              </div>
                            </div>
                          ))}

                          <div
                            className="office-peer office-peer-self"
                            style={{ left: `${officePresence.x - 18}px`, top: `${officePresence.y - 18}px` }}
                          >
                            <div className="office-peer-badge is-self">
                              <span>{state.profile.name || "User"}</span>
                              <small>You</small>
                            </div>
                            <div className="office-avatar-sprite is-male">
                              <i />
                              <em />
                              <b />
                              <u />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <aside className="office-side-panel">
                      <article className="office-info-card">
                        <span className="eyebrow">Current Zone</span>
                        <h3>{activeOfficeZone.label}</h3>
                        <p className="muted">Open desks are ambient. Smaller rooms are for focused work. The lounge is for visible downtime.</p>
                      </article>

                      <article className="office-info-card">
                        <span className="eyebrow">Status</span>
                        <div className="preset-row">
                          {["Working", "Deep Focus", "Break"].map((status) => (
                            <button
                              key={status}
                              className={`chip ${officePresence.status === status ? "is-active" : ""}`}
                              onClick={() => setOfficeStatus(status)}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </article>

                      <article className="office-info-card">
                        <span className="eyebrow">This MVP Tests</span>
                        <ul className="room-list">
                          <li>A more Gather-like top-down office language</li>
                          <li>Presence labels without heavy multiplayer systems</li>
                          <li>Seat selection before real-time movement</li>
                          <li>Whether shared work feels stronger than static pages</li>
                        </ul>
                      </article>
                    </aside>
                  </div>
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

function OfficeZoneDecor({ zone }) {
  if (zone.id === "open-desks") {
    return (
      <>
        <div className="office-furniture desk-wide" style={{ left: 38, top: 54, width: 132 }} />
        <div className="office-furniture desk-wide" style={{ left: 188, top: 54, width: 132 }} />
        <div className="office-furniture desk-wide" style={{ left: 38, top: 136, width: 132 }} />
        <div className="office-furniture desk-wide" style={{ left: 188, top: 136, width: 132 }} />
        <div className="office-furniture mug" style={{ left: 108, top: 72 }} />
        <div className="office-furniture notebook" style={{ left: 258, top: 72 }} />
        <div className="office-furniture mug" style={{ left: 108, top: 154 }} />
        <div className="office-furniture notebook" style={{ left: 258, top: 154 }} />
        <div className="office-furniture keyboard" style={{ left: 76, top: 70, width: 24 }} />
        <div className="office-furniture keyboard" style={{ left: 226, top: 70, width: 24 }} />
        <div className="office-furniture keyboard" style={{ left: 76, top: 152, width: 24 }} />
        <div className="office-furniture keyboard" style={{ left: 226, top: 152, width: 24 }} />
        <div className="office-furniture monitor is-dual" style={{ left: 62, top: 36 }} />
        <div className="office-furniture monitor is-code" style={{ left: 126, top: 36 }} />
        <div className="office-furniture monitor is-dual" style={{ left: 212, top: 36 }} />
        <div className="office-furniture monitor is-chat" style={{ left: 276, top: 36 }} />
        <div className="office-furniture monitor is-code" style={{ left: 62, top: 118 }} />
        <div className="office-furniture monitor is-chat" style={{ left: 126, top: 118 }} />
        <div className="office-furniture monitor is-dual" style={{ left: 212, top: 118 }} />
        <div className="office-furniture monitor is-code" style={{ left: 276, top: 118 }} />
        <div className="office-furniture pixel-chair" style={{ left: 78, top: 96 }} />
        <div className="office-furniture pixel-chair" style={{ left: 160, top: 96 }} />
        <div className="office-furniture pixel-chair" style={{ left: 228, top: 96 }} />
        <div className="office-furniture pixel-chair" style={{ left: 310, top: 96 }} />
        <div className="office-furniture pixel-chair" style={{ left: 78, top: 178 }} />
        <div className="office-furniture pixel-chair" style={{ left: 160, top: 178 }} />
        <div className="office-furniture pixel-chair" style={{ left: 228, top: 178 }} />
        <div className="office-furniture pixel-chair" style={{ left: 310, top: 178 }} />
      </>
    );
  }

  if (zone.id === "private-office") {
    return (
      <>
        <div className="office-furniture desk-exec" style={{ left: 46, top: 66, width: 118 }} />
        <div className="office-furniture plant" style={{ left: 166, top: 44 }} />
        <div className="office-furniture shelf" style={{ left: 28, top: 26, width: 54 }} />
        <div className="office-furniture framed-art" style={{ left: 118, top: 20 }} />
        <div className="office-furniture keyboard" style={{ left: 88, top: 84, width: 28 }} />
        <div className="office-furniture monitor is-wide" style={{ left: 94, top: 50 }} />
        <div className="office-furniture pixel-chair" style={{ left: 92, top: 106 }} />
      </>
    );
  }

  if (zone.id === "room-1" || zone.id === "room-2" || zone.id === "room-3" || zone.id === "room-5") {
    return (
      <>
        <div className="office-furniture meeting-table" style={{ left: 26, top: zone.id === "room-5" ? 54 : 34, width: zone.width - 52 }} />
        <div className="office-furniture wall-screen" style={{ left: zone.width / 2 - 28, top: 14 }} />
        <div className="office-furniture speaker" style={{ left: zone.width / 2 - 70, top: 18 }} />
        <div className="office-furniture speaker" style={{ left: zone.width / 2 + 50, top: 18 }} />
        {zone.seats.map((seat) => (
          <div
            key={`${seat.id}-chair`}
            className="office-furniture pixel-chair"
            style={{ left: `${seat.x - zone.x - 9}px`, top: `${seat.y - zone.y + 10}px` }}
          />
        ))}
      </>
    );
  }

  if (zone.id === "lounge") {
    return (
      <>
        <div className="office-furniture sofa" style={{ left: 34, top: 64, width: 86 }} />
        <div className="office-furniture sofa" style={{ left: 240, top: 64, width: 86 }} />
        <div className="office-furniture coffee-table" style={{ left: 142, top: 82, width: 74 }} />
        <div className="office-furniture mug" style={{ left: 168, top: 88 }} />
        <div className="office-furniture magazine" style={{ left: 188, top: 88 }} />
        <div className="office-furniture plant" style={{ left: 304, top: 26 }} />
      </>
    );
  }

  return null;
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
