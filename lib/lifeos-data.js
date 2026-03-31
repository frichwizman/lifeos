export const STORAGE_KEY = "lifeos-state-v1";
export const BACKUP_STORAGE_KEY = "lifeos-backups-v1";

const LEGACY_WORK_TODO_IDS = new Set(["job-1", "job-2", "side-1", "side-2"]);
const FIXED_WORK_PROJECT_IDS = new Set(["main-job", "side-business", "optional"]);

export const MODULE_COLORS = {
  work: "#e8b84b",
  study: "#58b4d1",
  life: "#6bc98a",
  money: "#9d82d8"
};

export const CURRENCIES = ["$", "€", "£", "¥", "₹", "₩", "A$", "C$", "S$", "HK$", "CHF", "AED"];

export const LIFE_PILLARS = [
  { id: "exercise", pillar: "Physical Activity", short: "Move", color: "#6bc98a" },
  { id: "sleep-quality", pillar: "Sleep", short: "Sleep", color: "#58b4d1" },
  { id: "water-intake", pillar: "Nutrition", short: "Fuel", color: "#f4845f" },
  { id: "stress-level", pillar: "Stress Management", short: "Calm", color: "#9d82d8" },
  { id: "social-connection", pillar: "Social Connection", short: "Social", color: "#e8b84b" },
  { id: "risky-substances", pillar: "Avoiding Risky Substances", short: "Clean", color: "#b388ff" },
  { id: "meditation", pillar: "Mindfulness", short: "Mind", color: "#7ee8a2" }
];

export const DEFAULT_STATE = {
  sync: {
    syncCode: "",
    userId: null,
    mode: "local",
    status: "idle",
    updatedAt: new Date(0).toISOString(),
    lastSyncedAt: null,
    lastBackupAt: null,
    error: ""
  },
  execution: {
    status: "idle",
    currentTaskId: "",
    currentTaskLabel: "",
    currentCategory: "",
    sourceType: "",
    sourceId: "",
    projectId: "",
    startTime: null,
    elapsedMs: 0,
    xpReward: 0,
    attributeKey: "",
    attributeDelta: 0,
    mainTaskId: ""
  },
  focusPrefill: {
    type: "",
    taskId: "",
    label: "",
    meta: "",
    sourceType: "",
    projectId: "",
    logTaskId: ""
  },
  attributes: {
    mind: 0,
    body: 0,
    wealth: 0,
    social: 0
  },
  profile: {
    name: "User",
    totalXP: 0,
    age: 32,
    lifeExpectancy: 85,
    retirementAge: 65,
    yearGoal: 120000,
    currency: "$",
    pbXP: 0
  },
  workDayKey: formatDateKey(new Date()),
  logs: {},
  focusSessions: [],
  miscTodos: [],
  notes: {
    "language-skills": "Textbook · Speaking · Listening · Vocabulary",
    "ai-skills": "Claude · ChatGPT · Gemini · Grok · Workflows",
    reading: "Books · Articles · Notes synthesis"
  },
  workProjects: [
    {
      id: "main-job",
      name: "Main",
      color: "#e8b84b",
      todayActions: [],
      backlog: [],
      nextDayCandidates: []
    },
    {
      id: "side-business",
      name: "Side",
      color: "#d89a3f",
      todayActions: [],
      backlog: [],
      nextDayCandidates: []
    },
    {
      id: "optional",
      name: "Optional",
      color: "#b6bcc8",
      todayActions: [],
      backlog: [],
      nextDayCandidates: []
    }
  ]
};

export const studyTasks = [
  {
    id: "language-skills",
    label: "Language Skills",
    unit: "min",
    type: "number",
    xpPerUnit: 0.5,
    presets: [15, 25, 30, 45, 60]
  },
  {
    id: "ai-skills",
    label: "AI Skills",
    unit: "min",
    type: "number",
    xpPerUnit: 0.5,
    presets: [15, 25, 30, 45, 60]
  },
  {
    id: "reading",
    label: "Reading",
    unit: "P",
    type: "number",
    xpPerUnit: 1,
    presets: [5, 10, 20, 30, 50],
    compactUnit: true
  }
];

export const lifeGroups = [
  {
    title: "Body",
    items: [
      {
        id: "exercise",
        label: "Exercise",
        unit: "min",
        type: "number",
        xpPerUnit: 0.5,
        presets: [15, 20, 30, 45, 60]
      },
      {
        id: "sleep-quality",
        label: "Sleep Score",
        unit: "pts",
        type: "number",
        xpPerUnit: 0.2,
        presets: [55, 65, 75, 85, 95]
      },
      {
        id: "water-intake",
        label: "Water Intake",
        unit: "ml",
        type: "number",
        xpPerUnit: 0.01,
        presets: [250, 500, 750, 1000, 1250, 1500]
      }
    ]
  },
  {
    title: "Recovery",
    items: [
      {
        id: "stress-level",
        label: "Stress Level",
        unit: "★",
        type: "ratingReverse",
        xpPerUnit: 4
      },
      {
        id: "meditation",
        label: "Meditation",
        unit: "min",
        type: "number",
        xpPerUnit: 0.6,
        presets: [5, 10, 15, 20, 30]
      }
    ]
  },
  {
    title: "Connection",
    items: [
      {
        id: "social-connection",
        label: "Social Connection",
        unit: "hr",
        type: "number",
        xpPerUnit: 8,
        presets: [0.5, 1, 1.5, 2]
      },
      {
        id: "risky-substances",
        label: "Risky Substances",
        unit: "avoid",
        type: "boolean",
        xpPerUnit: 15
      }
    ]
  }
];

export const moneyTasks = [
  {
    id: "income-logged",
    label: "Income",
    unit: "$",
    type: "number",
    xpPerUnit: 0.04,
    presets: [50, 100, 250, 500],
    allowZero: true
  },
  {
    id: "expense-tracked",
    label: "Expense",
    unit: "$",
    type: "number",
    xpPerUnit: 0.03,
    presets: [20, 50, 100, 200],
    allowZero: true
  },
  {
    id: "saved-today",
    label: "Savings",
    unit: "$",
    type: "number",
    xpPerUnit: 0.05,
    presets: [20, 50, 100, 200],
    allowZero: true
  },
  {
    id: "investment-return",
    label: "Investment",
    unit: "$",
    type: "number",
    xpPerUnit: 0.02,
    presets: [50, 100, -50, -100],
    allowNegative: true,
    allowZero: true
  }
];

export function formatDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayKey() {
  return formatDateKey(new Date());
}

export function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const day = Math.floor(diff / 86400000);
  return day;
}

export function getDaysInYear(date = new Date()) {
  const year = date.getFullYear();
  return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function getLevel(totalXP) {
  let level = 1;
  let remaining = totalXP;
  let needed = 120;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed += 40;
  }
  return { level, current: remaining, needed };
}

export function getLogValue(logs, dateKey, taskId) {
  return logs?.[dateKey]?.[taskId]?.value;
}

export function getTaskHistory(logs, taskId, days = 14) {
  const now = new Date();
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - index - 1));
    const key = formatDateKey(date);
    const value = logs?.[key]?.[taskId]?.value;
    return {
      key,
      done: typeof value === "boolean" ? value : Number(value) > 0
    };
  });
}

export function getStreak(logs, taskId) {
  let streak = 0;
  const date = new Date();
  while (true) {
    const key = formatDateKey(date);
    const value = logs?.[key]?.[taskId]?.value;
    const done = typeof value === "boolean" ? value : Number(value) > 0;
    if (!done) break;
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

export function getTodayXP(logs, dateKey) {
  const day = logs?.[dateKey] ?? {};
  return Object.values(day).reduce((sum, item) => sum + (item.xp ?? 0), 0);
}

export function getCompletedCount(logs, dateKey, taskIds) {
  return taskIds.filter((taskId) => {
    const value = logs?.[dateKey]?.[taskId]?.value;
    return typeof value === "boolean" ? value : Number(value) > 0;
  }).length;
}

export function computeIncomeStats(goal) {
  const today = new Date();
  const dayOfYear = getDayOfYear(today);
  const daysInYear = getDaysInYear(today);
  const remainingDays = Math.max(0, daysInYear - dayOfYear);
  return {
    dayOfYear,
    daysInYear,
    progress: dayOfYear / daysInYear,
    dailyTarget: goal / daysInYear,
    monthlyTarget: goal / 12,
    shouldHaveMade: (goal / daysInYear) * dayOfYear,
    remainingDays
  };
}

export function migrateState(rawState) {
  const ensureArray = (value) => (Array.isArray(value) ? value : []);
  const normalizeActionItem = (item, index = 0) => {
    if (!item || typeof item !== "object") return null;
    return {
      id: typeof item.id === "string" && item.id ? item.id : `action-${index}`,
      label: typeof item.label === "string" && item.label.trim() ? item.label : "Untitled action"
    };
  };
  const rawWorkProjects = Array.isArray(rawState?.workProjects) ? rawState.workProjects : DEFAULT_STATE.workProjects;
  const rawMiscTodos = Array.isArray(rawState?.miscTodos) ? rawState.miscTodos : DEFAULT_STATE.miscTodos;
  const rawFocusSessions = Array.isArray(rawState?.focusSessions) ? rawState.focusSessions : DEFAULT_STATE.focusSessions;
  const merged = {
    ...DEFAULT_STATE,
    ...rawState,
    miscTodos: rawMiscTodos,
    focusSessions: rawFocusSessions,
    sync: {
      ...DEFAULT_STATE.sync,
      ...(rawState?.sync ?? {})
    },
    execution: {
      ...DEFAULT_STATE.execution,
      ...(rawState?.execution ?? {})
    },
    attributes: {
      ...DEFAULT_STATE.attributes,
      ...(rawState?.attributes ?? {})
    },
    profile: {
      ...DEFAULT_STATE.profile,
      ...(rawState?.profile ?? {})
    }
  };

  const incomingProjects = rawWorkProjects;
  const incomingProjectMap = new Map(
    incomingProjects
      .filter((project) => project && typeof project === "object" && FIXED_WORK_PROJECT_IDS.has(project.id))
      .map((project) => [project.id, project])
  );

  return {
    ...merged,
    focusPrefill: {
      ...DEFAULT_STATE.focusPrefill,
      ...(rawState?.focusPrefill ?? {})
    },
    workProjects: DEFAULT_STATE.workProjects.map((project) => {
      const sourceProject = incomingProjectMap.get(project.id) ?? project;
      const legacyTodos = ensureArray(sourceProject?.todos)
        .filter((todo) => todo && typeof todo === "object" && !LEGACY_WORK_TODO_IDS.has(todo.id))
        .map(normalizeActionItem)
        .filter(Boolean);
      const todayActions = ensureArray(sourceProject?.todayActions).map(normalizeActionItem).filter(Boolean);
      const backlog = ensureArray(sourceProject?.backlog).map(normalizeActionItem).filter(Boolean);
      const nextDayCandidates = ensureArray(sourceProject?.nextDayCandidates).map(normalizeActionItem).filter(Boolean).slice(0, 5);
      const nextTodayActions = todayActions.length || backlog.length || nextDayCandidates.length ? todayActions : legacyTodos.slice(0, 5);
      const nextBacklog = todayActions.length || backlog.length || nextDayCandidates.length ? backlog : legacyTodos.slice(5);
      return {
        ...project,
        ...sourceProject,
        todayActions: nextTodayActions,
        backlog: nextBacklog,
        nextDayCandidates
      };
    })
  };
}

export function touchState(state) {
  return {
    ...state,
    sync: {
      ...state.sync,
      updatedAt: new Date().toISOString()
    }
  };
}

export function generateSyncCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function createSyncPayload(state) {
  return {
    ...state,
    sync: {
      syncCode: state.sync.syncCode,
      userId: state.sync.userId,
      mode: state.sync.mode,
      status: "idle",
      updatedAt: state.sync.updatedAt,
      lastSyncedAt: state.sync.lastSyncedAt,
      lastBackupAt: state.sync.lastBackupAt,
      error: ""
    }
  };
}

export function getStateContentScore(state) {
  const logsCount = Object.keys(state?.logs ?? {}).length;
  const totalTodos = (state?.workProjects ?? []).reduce(
    (sum, project) =>
      sum +
      (project.todayActions?.length ?? 0) +
      (project.backlog?.length ?? 0) +
      (project.nextDayCandidates?.length ?? 0),
    0
  );
  const focusSessionCount = (state?.focusSessions ?? []).length;
  const totalXP = Number(state?.profile?.totalXP ?? 0);
  return logsCount * 10 + totalTodos * 3 + focusSessionCount * 2 + totalXP;
}

export function choosePreferredSyncState(localState, remoteState) {
  const local = migrateState(localState);
  const remote = migrateState(remoteState);
  const localScore = getStateContentScore(local);
  const remoteScore = getStateContentScore(remote);

  if (localScore === 0 && remoteScore === 0) {
    return (remote.sync.updatedAt ?? "") > (local.sync.updatedAt ?? "") ? remote : local;
  }

  if (localScore === 0) return remote;
  if (remoteScore === 0) return local;

  return (remote.sync.updatedAt ?? "") > (local.sync.updatedAt ?? "") ? remote : local;
}

export function readBackups() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(BACKUP_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function writeBackupSnapshot(state) {
  if (typeof window === "undefined") return [];
  const backups = readBackups();
  const snapshot = {
    createdAt: new Date().toISOString(),
    state: createSyncPayload(state)
  };
  const next = [snapshot, ...backups].slice(0, 5);
  window.localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(next));
  return next;
}
