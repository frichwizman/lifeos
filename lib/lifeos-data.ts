import type {
  BackupSnapshot,
  ComputeFocusRewardInput,
  DailyLogRecord,
  FocusReward,
  FocusSession,
  FocusType,
  IncomeStats,
  LevelProgress,
  LifeGroup,
  LifeOSLogs,
  LifeOSState,
  LifePillar,
  LogValue,
  MigratableLifeOSState,
  MigratableWorkProject,
  NoteItem,
  ProfileState,
  SyncPayload,
  TaskHistoryEntry,
  TrackedTaskDefinition,
  WorkAction,
  WorkProject
} from "@/lib/lifeos-types";

export const STORAGE_KEY = "lifeos-state-v1";
export const BACKUP_STORAGE_KEY = "lifeos-backups-v1";

const LEGACY_WORK_TODO_IDS = new Set(["job-1", "job-2", "side-1", "side-2"]);
const FIXED_WORK_PROJECT_IDS = new Set(["main-job", "side-business", "optional"]);
const LEGACY_WORK_PROJECT_NAMES: Record<string, Set<string>> = {
  "main-job": new Set(["Main Job", "Main"]),
  "side-business": new Set(["Side Business", "Side"]),
  optional: new Set(["Optional"])
};

export const MODULE_COLORS: Record<"work" | "study" | "life" | "money", string> = {
  work: "#e8b84b",
  study: "#58b4d1",
  life: "#6bc98a",
  money: "#9d82d8"
};

export const STRESS_LEVEL_OPTIONS = [
  {
    value: 1,
    label: "Relaxed",
    shortLabel: "Rlx",
    tone: "relaxed",
    description: "Calm and settled."
  },
  {
    value: 2,
    label: "Low",
    shortLabel: "Low",
    tone: "low",
    description: "Light tension, still manageable."
  },
  {
    value: 3,
    label: "Moderate",
    shortLabel: "Mod",
    tone: "moderate",
    description: "Noticeable stress that needs attention."
  },
  {
    value: 4,
    label: "High",
    shortLabel: "High",
    tone: "high",
    description: "Stress is elevated right now."
  }
] as const;

export function getStressLevelOption(value: LogValue | undefined) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return undefined;
  return STRESS_LEVEL_OPTIONS.find((option) => option.value === numericValue);
}

export function formatStressLevelValue(value: LogValue | undefined) {
  return getStressLevelOption(value)?.label ?? "Not logged";
}

export function formatStressLevelShortValue(value: LogValue | undefined) {
  return getStressLevelOption(value)?.shortLabel ?? "";
}

export const FOCUS_XP_V1 = {
  baseXP: 10,
  taskBindingBonusPct: 20,
  typeMultipliers: {
    work: 1.2,
    study: 1,
    life: 0.8
  }
} as const;

export const CURRENCIES = ["$", "€", "£", "¥", "₹", "₩", "A$", "C$", "S$", "HK$", "CHF", "AED"] as const;

export const LIFE_PILLARS: LifePillar[] = [
  { id: "exercise", pillar: "Physical Activity", short: "Move", color: "#6bc98a" },
  { id: "sleep-quality", pillar: "Sleep", short: "Sleep", color: "#58b4d1" },
  { id: "water-intake", pillar: "Nutrition", short: "Fuel", color: "#f4845f" },
  { id: "stress-level", pillar: "Stress Management", short: "Calm", color: "#9d82d8" },
  { id: "social-connection", pillar: "Social Connection", short: "Social", color: "#e8b84b" },
  { id: "risky-substances", pillar: "Avoiding Risky Substances", short: "Clean", color: "#b388ff" },
  { id: "meditation", pillar: "Mindfulness", short: "Mind", color: "#7ee8a2" }
];

export const DEFAULT_STATE: LifeOSState = {
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
  noteCursor: 0,
  noteItems: [],
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

export const studyTasks: TrackedTaskDefinition[] = [
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

export const lifeGroups: LifeGroup[] = [
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
        unit: "",
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

export const moneyTasks: TrackedTaskDefinition[] = [
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

export const MONEY_TASK_IDS = moneyTasks.map((task) => task.id);

export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

export function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const day = Math.floor(diff / 86400000);
  return day;
}

export function getDaysInYear(date: Date = new Date()): number {
  const year = date.getFullYear();
  return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function getLevel(totalXP: number): LevelProgress {
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

export function getLogValue(logs: LifeOSLogs | undefined, dateKey: string, taskId: string): LogValue | undefined {
  return logs?.[dateKey]?.[taskId]?.value;
}

export function getTaskHistory(logs: LifeOSLogs | undefined, taskId: string, days = 14): TaskHistoryEntry[] {
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

export function getStreak(logs: LifeOSLogs | undefined, taskId: string): number {
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

export function getTodayXP(logs: LifeOSLogs | undefined, dateKey: string): number {
  const day = logs?.[dateKey] ?? {};
  return Object.values(day).reduce((sum, item) => sum + (item.xp ?? 0), 0);
}

export function getCompletedCount(logs: LifeOSLogs | undefined, dateKey: string, taskIds: string[]): number {
  return taskIds.filter((taskId) => {
    const value = logs?.[dateKey]?.[taskId]?.value;
    return typeof value === "boolean" ? value : Number(value) > 0;
  }).length;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = String(dateKey || "")
    .split("-")
    .map((value) => Number(value));

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

export function getFocusSessionsForDate(focusSessions: FocusSession[] | undefined, dateKey: string): FocusSession[] {
  return (focusSessions ?? []).filter((session) => formatDateKey(new Date(session.timestamp)) === dateKey);
}

export function getFocusDayStreak(
  focusSessions: FocusSession[] | undefined,
  endDateKey = formatDateKey(new Date()),
  includePendingDay = false
): number {
  const completedDayKeys = new Set((focusSessions ?? []).map((session) => formatDateKey(new Date(session.timestamp))));
  if (includePendingDay) completedDayKeys.add(endDateKey);

  let streak = 0;
  const cursor = parseDateKey(endDateKey);

  while (completedDayKeys.has(formatDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getFocusStreakBonusPct(streak: number): number {
  if (streak >= 10) return 30;
  if (streak >= 5) return 20;
  if (streak >= 2) return 10;
  return 0;
}

export function getFocusTypeLabel(type: FocusType): string {
  if (type === "work") return "Work";
  if (type === "study") return "Study";
  if (type === "life") return "Life";
  return "";
}

export function computeFocusReward({
  type,
  taskBound = false,
  focusSessions = [],
  dateKey = formatDateKey(new Date())
}: ComputeFocusRewardInput): FocusReward {
  if (!type || !FOCUS_XP_V1.typeMultipliers[type]) {
    return {
      baseXP: FOCUS_XP_V1.baseXP,
      typeLabel: "",
      typeMultiplier: 1,
      taskBindingBonusPct: 0,
      streakCount: 0,
      streakBonusPct: 0,
      xpEarned: 0
    };
  }

  const streakCount = getFocusDayStreak(focusSessions, dateKey, true);
  const streakBonusPct = getFocusStreakBonusPct(streakCount);
  const typeMultiplier = FOCUS_XP_V1.typeMultipliers[type];
  const taskBindingBonusPct = taskBound ? FOCUS_XP_V1.taskBindingBonusPct : 0;
  const multiplier = typeMultiplier * (1 + taskBindingBonusPct / 100) * (1 + streakBonusPct / 100);
  const xpEarned = Math.round(FOCUS_XP_V1.baseXP * multiplier);

  return {
    baseXP: FOCUS_XP_V1.baseXP,
    typeLabel: getFocusTypeLabel(type),
    typeMultiplier,
    taskBindingBonusPct,
    streakCount,
    streakBonusPct,
    xpEarned
  };
}

export function computeIncomeStats(goal: number): IncomeStats {
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

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeNoteItem(item: unknown, index = 0): NoteItem | null {
  if (!item || typeof item !== "object") return null;
  const candidate = item as Partial<NoteItem>;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
  if (!title && !content) return null;
  return {
    id: typeof candidate.id === "string" && candidate.id ? candidate.id : `note-${index}`,
    title,
    content,
    type: typeof candidate.type === "string" && candidate.type ? candidate.type : "Draft",
    pinned: Boolean(candidate.pinned),
    archived: Boolean(candidate.archived),
    createdAt: candidate.createdAt || new Date(0).toISOString(),
    updatedAt: candidate.updatedAt || candidate.createdAt || new Date(0).toISOString(),
    colorIndex: Number.isFinite(Number(candidate.colorIndex)) ? Number(candidate.colorIndex) : index % 10
  };
}

function normalizeActionItem(item: unknown, index = 0): WorkAction | null {
  if (!item || typeof item !== "object") return null;
  const candidate = item as Partial<WorkAction>;
  return {
    id: typeof candidate.id === "string" && candidate.id ? candidate.id : `action-${index}`,
    label: typeof candidate.label === "string" && candidate.label.trim() ? candidate.label : "Untitled action"
  };
}

function isMigratableProject(project: unknown): project is MigratableWorkProject & { id: string } {
  return Boolean(project) && typeof project === "object" && typeof (project as { id?: unknown }).id === "string";
}

export function migrateState(rawState?: MigratableLifeOSState | null): LifeOSState {
  const rawWorkProjects = Array.isArray(rawState?.workProjects) ? rawState.workProjects : DEFAULT_STATE.workProjects;
  const rawMiscTodos = Array.isArray(rawState?.miscTodos) ? rawState.miscTodos : DEFAULT_STATE.miscTodos;
  const rawFocusSessions = Array.isArray(rawState?.focusSessions) ? rawState.focusSessions : DEFAULT_STATE.focusSessions;
  const rawNoteItems = Array.isArray(rawState?.noteItems) ? rawState.noteItems : DEFAULT_STATE.noteItems;
  const merged: LifeOSState = {
    ...DEFAULT_STATE,
    ...(rawState as Partial<LifeOSState>),
    miscTodos: rawMiscTodos as LifeOSState["miscTodos"],
    focusSessions: rawFocusSessions as LifeOSState["focusSessions"],
    noteItems: rawNoteItems.map((item, index) => normalizeNoteItem(item, index)).filter((item): item is NoteItem => Boolean(item)),
    noteCursor: Number.isFinite(Number(rawState?.noteCursor)) ? Number(rawState?.noteCursor) : DEFAULT_STATE.noteCursor,
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
    },
    focusPrefill: {
      ...DEFAULT_STATE.focusPrefill,
      ...(rawState?.focusPrefill ?? {})
    }
  };

  const incomingProjects = ensureArray<MigratableWorkProject>(rawWorkProjects);
  const incomingProjectMap = new Map<string, MigratableWorkProject>(
    incomingProjects
      .filter((project): project is MigratableWorkProject & { id: string } => isMigratableProject(project) && FIXED_WORK_PROJECT_IDS.has(project.id))
      .map((project) => [project.id, project])
  );

  return {
    ...merged,
    workProjects: DEFAULT_STATE.workProjects.map((project) => {
      const sourceProject: MigratableWorkProject = incomingProjectMap.get(project.id) ?? project;
      const legacyTodos = ensureArray(sourceProject.todos)
        .filter((todo) => todo && typeof todo === "object" && !LEGACY_WORK_TODO_IDS.has((todo as { id?: string }).id ?? ""))
        .map((todo, index) => normalizeActionItem(todo, index))
        .filter((item): item is WorkAction => Boolean(item));
      const todayActions = ensureArray(sourceProject.todayActions)
        .map((item, index) => normalizeActionItem(item, index))
        .filter((item): item is WorkAction => Boolean(item));
      const backlog = ensureArray(sourceProject.backlog)
        .map((item, index) => normalizeActionItem(item, index))
        .filter((item): item is WorkAction => Boolean(item));
      const nextDayCandidates = ensureArray(sourceProject.nextDayCandidates)
        .map((item, index) => normalizeActionItem(item, index))
        .filter((item): item is WorkAction => Boolean(item))
        .slice(0, 5);
      const nextTodayActions = todayActions.length || backlog.length || nextDayCandidates.length ? todayActions : legacyTodos.slice(0, 5);
      const nextBacklog = todayActions.length || backlog.length || nextDayCandidates.length ? backlog : legacyTodos.slice(5);
      const incomingName = typeof sourceProject.name === "string" ? sourceProject.name.trim() : "";
      const normalizedName =
        incomingName && !LEGACY_WORK_PROJECT_NAMES[project.id]?.has(incomingName) ? incomingName : project.name;

      return {
        ...project,
        ...(sourceProject as Partial<WorkProject>),
        name: normalizedName,
        todayActions: nextTodayActions,
        backlog: nextBacklog,
        nextDayCandidates
      };
    })
  };
}

export function touchState(state: LifeOSState): LifeOSState {
  return {
    ...state,
    sync: {
      ...state.sync,
      updatedAt: new Date().toISOString()
    }
  };
}

export function generateSyncCode(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function createSyncPayload(state: LifeOSState): SyncPayload {
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

export function getStateContentScore(state: Partial<LifeOSState> | null | undefined): number {
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

function getLogRecordTimestamp(record: DailyLogRecord | null | undefined): number {
  const timestamp = Number(record?.ts ?? 0);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function chooseLatestLogRecord(
  localRecord: DailyLogRecord | null | undefined,
  remoteRecord: DailyLogRecord | null | undefined
): DailyLogRecord | undefined {
  if (!localRecord) return remoteRecord ?? undefined;
  if (!remoteRecord) return localRecord ?? undefined;

  return getLogRecordTimestamp(remoteRecord) > getLogRecordTimestamp(localRecord) ? remoteRecord : localRecord;
}

export function mergeLifeOSLogs(localLogs: LifeOSLogs | undefined, remoteLogs: LifeOSLogs | undefined): LifeOSLogs {
  const merged: LifeOSLogs = {};
  const dateKeys = new Set([...Object.keys(localLogs ?? {}), ...Object.keys(remoteLogs ?? {})]);

  for (const dateKey of dateKeys) {
    const localDay = localLogs?.[dateKey] ?? {};
    const remoteDay = remoteLogs?.[dateKey] ?? {};
    const taskIds = new Set([...Object.keys(localDay), ...Object.keys(remoteDay)]);
    const mergedDay: LifeOSLogs[string] = {};

    for (const taskId of taskIds) {
      const latest = chooseLatestLogRecord(localDay[taskId], remoteDay[taskId]);
      if (latest) mergedDay[taskId] = latest;
    }

    merged[dateKey] = mergedDay;
  }

  return merged;
}

export function pickTaskLogs(logs: LifeOSLogs | undefined, taskIds: readonly string[]): LifeOSLogs {
  const taskIdSet = new Set(taskIds);
  const picked: LifeOSLogs = {};

  for (const [dateKey, day] of Object.entries(logs ?? {})) {
    const pickedDay: LifeOSLogs[string] = {};
    for (const [taskId, record] of Object.entries(day)) {
      if (taskIdSet.has(taskId)) pickedDay[taskId] = record;
    }
    if (Object.keys(pickedDay).length) picked[dateKey] = pickedDay;
  }

  return picked;
}

export function pickMoneyLogs(logs: LifeOSLogs | undefined): LifeOSLogs {
  return pickTaskLogs(logs, MONEY_TASK_IDS);
}

function getLogsXP(logs: LifeOSLogs): number {
  return Object.values(logs).reduce(
    (sum, day) => sum + Object.values(day).reduce((daySum, record) => daySum + Number(record?.xp ?? 0), 0),
    0
  );
}

function getBestDayXP(logs: LifeOSLogs): number {
  return Object.keys(logs).reduce((best, dateKey) => Math.max(best, getTodayXP(logs, dateKey)), 0);
}

function mergeProfileForLogs(
  baseProfile: ProfileState,
  localProfile: ProfileState,
  remoteProfile: ProfileState,
  mergedLogs: LifeOSLogs
): ProfileState {
  return {
    ...baseProfile,
    totalXP: Math.max(
      Number(baseProfile.totalXP ?? 0),
      Number(localProfile.totalXP ?? 0),
      Number(remoteProfile.totalXP ?? 0),
      getLogsXP(mergedLogs)
    ),
    pbXP: Math.max(
      Number(baseProfile.pbXP ?? 0),
      Number(localProfile.pbXP ?? 0),
      Number(remoteProfile.pbXP ?? 0),
      getBestDayXP(mergedLogs)
    )
  };
}

function mergeSyncStateData(base: LifeOSState, local: LifeOSState, remote: LifeOSState): LifeOSState {
  const mergedLogs = mergeLifeOSLogs(local.logs, remote.logs);
  const updatedAt = [base.sync.updatedAt, local.sync.updatedAt, remote.sync.updatedAt]
    .filter(Boolean)
    .sort()
    .at(-1);

  return migrateState({
    ...base,
    logs: mergedLogs,
    profile: mergeProfileForLogs(base.profile, local.profile, remote.profile, mergedLogs),
    sync: {
      ...base.sync,
      updatedAt: updatedAt ?? base.sync.updatedAt
    }
  });
}

export function choosePreferredSyncState(
  localState: MigratableLifeOSState | LifeOSState,
  remoteState: MigratableLifeOSState | LifeOSState
): LifeOSState {
  const local = migrateState(localState);
  const remote = migrateState(remoteState);
  const localScore = getStateContentScore(local);
  const remoteScore = getStateContentScore(remote);
  const localUpdatedAt = local.sync.updatedAt ?? "";
  const localLastSyncedAt = local.sync.lastSyncedAt ?? "";
  const remoteUpdatedAt = remote.sync.updatedAt ?? "";
  const localHasUnsyncedChanges = localUpdatedAt > localLastSyncedAt;
  const remoteIsNewerThanLocalSync = remoteUpdatedAt > localLastSyncedAt;

  if (localScore === 0 && remoteScore === 0) {
    return remoteUpdatedAt > localUpdatedAt ? remote : local;
  }

  if (localScore === 0) return remote;
  if (remoteScore === 0) return local;

  if (localHasUnsyncedChanges && !remoteIsNewerThanLocalSync) return mergeSyncStateData(local, local, remote);
  if (!localHasUnsyncedChanges && remoteIsNewerThanLocalSync) return mergeSyncStateData(remote, local, remote);

  return mergeSyncStateData(remoteUpdatedAt > localUpdatedAt ? remote : local, local, remote);
}

export function readBackups(): BackupSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(BACKUP_STORAGE_KEY) || "[]") as BackupSnapshot[];
  } catch {
    return [];
  }
}

export function writeBackupSnapshot(state: LifeOSState): BackupSnapshot[] {
  if (typeof window === "undefined") return [];
  const backups = readBackups();
  const snapshot: BackupSnapshot = {
    createdAt: new Date().toISOString(),
    state: createSyncPayload(state)
  };
  const next = [snapshot, ...backups].slice(0, 20);
  window.localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(next));
  return next;
}
