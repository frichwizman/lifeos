export const STORAGE_KEY = "lifeos-state-v1";

const LEGACY_WORK_TODO_IDS = new Set(["job-1", "job-2", "side-1", "side-2"]);
const FIXED_WORK_PROJECT_IDS = new Set(["main-job", "side-business"]);

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
    error: ""
  },
  profile: {
    name: "Charles",
    totalXP: 0,
    age: 32,
    lifeExpectancy: 85,
    retirementAge: 65,
    yearGoal: 120000,
    currency: "$",
    pbXP: 0
  },
  logs: {},
  notes: {
    "language-skills": "Textbook · Speaking · Listening · Vocabulary",
    "ai-skills": "Claude · ChatGPT · Gemini · Grok · Workflows",
    reading: "Books · Articles · Notes synthesis"
  },
  workProjects: [
    {
      id: "main-job",
      name: "Main Job",
      color: "#e8b84b",
      todos: []
    },
    {
      id: "side-business",
      name: "Side Business",
      color: "#d89a3f",
      todos: []
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
    presets: [15, 20, 30, 45, 60]
  },
  {
    id: "ai-skills",
    label: "AI Skills",
    unit: "min",
    type: "number",
    xpPerUnit: 0.5,
    presets: [15, 20, 30, 45, 60]
  },
  {
    id: "reading",
    label: "Reading",
    unit: "pages",
    type: "number",
    xpPerUnit: 1,
    presets: [5, 10, 20, 30, 50]
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
        label: "Sleep Quality",
        unit: "★",
        type: "rating",
        xpPerUnit: 4
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
    label: "Income Logged",
    unit: "$",
    type: "number",
    xpPerUnit: 0.04,
    presets: [50, 100, 250, 500]
  },
  {
    id: "expense-tracked",
    label: "Expense Tracked",
    unit: "$",
    type: "number",
    xpPerUnit: 0.03,
    presets: [20, 50, 100, 200]
  },
  {
    id: "saved-today",
    label: "Saved Today",
    unit: "$",
    type: "number",
    xpPerUnit: 0.05,
    presets: [20, 50, 100, 200]
  }
];

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
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
    const key = date.toISOString().slice(0, 10);
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
    const key = date.toISOString().slice(0, 10);
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
  const merged = {
    ...DEFAULT_STATE,
    ...rawState,
    sync: {
      ...DEFAULT_STATE.sync,
      ...(rawState?.sync ?? {})
    },
    profile: {
      ...DEFAULT_STATE.profile,
      ...(rawState?.profile ?? {})
    }
  };

  return {
    ...merged,
    workProjects: (rawState?.workProjects ?? DEFAULT_STATE.workProjects)
      .filter((project) => FIXED_WORK_PROJECT_IDS.has(project.id))
      .map((project) => ({
        ...project,
        todos: (project.todos ?? []).filter((todo) => !LEGACY_WORK_TODO_IDS.has(todo.id))
      }))
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
      error: ""
    }
  };
}
