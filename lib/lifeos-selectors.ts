import {
  clamp,
  computeFocusReward,
  computeIncomeStats,
  formatDateKey,
  formatNumber,
  formatStressLevelValue,
  getFocusDayStreak,
  getFocusSessionsForDate,
  getLevel,
  getLogValue,
  getStreak,
  getTaskHistory,
  getTodayXP
} from "@/lib/lifeos-data";
import type {
  ActiveExecutionTask,
  DashboardTask,
  DashboardOverview,
  ExecutionState,
  FocusType,
  FocusTaskOption,
  FocusTaskOptions,
  FocusViewModel,
  HistoryDay,
  HistoryEntry,
  LifeGroup,
  LifeOSLogs,
  LifeOSState,
  MiscTodoCounts,
  MoneySummary,
  WorkProjectSlotLabels,
  NoteCollections,
  NoteItem,
  ProjectDailyActionStatus,
  QuickActionSummary,
  StudySummaryItem,
  TrackedTaskDefinition,
  WorkComposerViewModel,
  WorkExecutionSummary,
  WorkPageViewModel,
  WorkProjectActionViewModel,
  WorkProject,
  WorkProjectViewModel,
  WorkSidebarSummary
} from "@/lib/lifeos-types";

export function buildTaskMap<T extends { id: string }>(tasks: T[]): Record<string, T> {
  return Object.fromEntries(tasks.map((task) => [task.id, task]));
}

export function buildLifePageTasks(lifeTaskMap: Record<string, TrackedTaskDefinition>): TrackedTaskDefinition[] {
  return [
    "exercise",
    "meditation",
    "sleep-quality",
    "water-intake",
    "stress-level",
    "weight",
    "steps"
  ]
    .map((taskId) => lifeTaskMap[taskId])
    .filter(Boolean);
}

export function buildFocusTaskOptions(
  state: LifeOSState,
  todayKey: string,
  lifePageTasks: TrackedTaskDefinition[],
  studyTasks: TrackedTaskDefinition[]
): FocusTaskOptions {
  return {
    work: state.workProjects.flatMap((project) =>
      (project.todayActions ?? [])
        .filter((action) => !Boolean(getLogValue(state.logs, todayKey, `${project.id}:${action.id}`)))
        .map<FocusTaskOption>((action) => ({
          id: `work:${project.id}:${action.id}`,
          logTaskId: `${project.id}:${action.id}`,
          taskId: action.id,
          label: action.label || "Untitled task",
          meta: project.name,
          type: "work",
          sourceType: "work-todo",
          projectId: project.id
        }))
    ),
    study: studyTasks.map<FocusTaskOption>((task) => ({
      id: `study:${task.id}`,
      logTaskId: task.id,
      taskId: task.id,
      label: task.label,
      meta: "Study",
      type: "study",
      sourceType: "tracked-task"
    })),
    life: lifePageTasks
      .filter((task) => !["stress-level", "weight"].includes(task.id))
      .map<FocusTaskOption>((task) => ({
        id: `life:${task.id}`,
        logTaskId: task.id,
        taskId: task.id,
        label: task.label,
        meta: "Life",
        type: "life",
        sourceType: "tracked-task"
      }))
  };
}

function formatHistoryValue(task: TrackedTaskDefinition | undefined, rawValue: number | boolean | undefined, currency: string): string {
  if (task?.type === "boolean") return rawValue ? "Done" : "Not done";
  if (task?.id === "stress-level") return formatStressLevelValue(rawValue);
  if (task?.unit === "$") return `${currency}${formatNumber(Number(rawValue || 0))}`;
  if (typeof rawValue === "number" && typeof task?.decimalPlaces === "number") {
    return `${rawValue.toFixed(task.decimalPlaces)}${task.compactUnit ? "" : " "}${task.unit ?? ""}`.trim();
  }
  return `${rawValue}${task?.compactUnit ? "" : " "}${task?.unit ?? ""}`.trim();
}

function formatHistoryDateLabel(date: Date, isToday: boolean): string {
  if (isToday) return "Today";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

export function buildHistoryDays(params: {
  logs: LifeOSLogs;
  todayKey: string;
  workProjects: WorkProject[];
  studyTaskMap: Record<string, TrackedTaskDefinition>;
  lifeTaskMap: Record<string, TrackedTaskDefinition>;
  moneyTaskMap: Record<string, TrackedTaskDefinition>;
  currency: string;
  lifeQuickActionMap: Record<string, { label: string; group: string }>;
}): HistoryDay[] {
  const { logs, todayKey, workProjects, studyTaskMap, lifeTaskMap, moneyTaskMap, currency, lifeQuickActionMap } = params;

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const dateKey = formatDateKey(date);
    const dayLogs = logs?.[dateKey] ?? {};
    const entries = Object.entries(dayLogs)
      .map<HistoryEntry | null>(([taskId, record]) => {
        const rawValue = record?.value;
        const isDone = typeof rawValue === "boolean" ? rawValue : Number(rawValue) > 0;
        if (!isDone) return null;

        if (taskId.includes(":")) {
          const [projectId, todoId] = taskId.split(":");
          const project = workProjects.find((item) => item.id === projectId);
          const todo =
            project?.todayActions.find((item) => item.id === todoId) ??
            project?.backlog.find((item) => item.id === todoId) ??
            project?.nextDayCandidates.find((item) => item.id === todoId);
          return {
            key: taskId,
            category: "Work",
            label: todo?.label ?? "Completed work item",
            value: "Done",
            meta: project?.name ?? "Work",
            xp: record?.xp ?? 0
          };
        }

        const studyTask = studyTaskMap[taskId];
        if (studyTask) {
          return {
            key: taskId,
            category: "Study",
            label: studyTask.label,
            value: formatHistoryValue(studyTask, rawValue, currency),
            meta: "",
            xp: record?.xp ?? 0
          };
        }

        const lifeTask = lifeTaskMap[taskId];
        if (lifeTask) {
          return {
            key: taskId,
            category: "Life",
            label: lifeTask.label,
            value: formatHistoryValue(lifeTask, rawValue, currency),
            meta: "",
            xp: record?.xp ?? 0
          };
        }

        const moneyTask = moneyTaskMap[taskId];
        if (moneyTask) {
          return {
            key: taskId,
            category: "Money",
            label: moneyTask.label,
            value: formatHistoryValue(moneyTask, rawValue, currency),
            meta: "",
            xp: record?.xp ?? 0
          };
        }

        const quickAction = lifeQuickActionMap[taskId];
        if (quickAction) {
          return {
            key: taskId,
            category: "Life",
            label: quickAction.label,
            value: "Done",
            meta: quickAction.group,
            xp: record?.xp ?? 0
          };
        }

        return null;
      })
      .filter((entry): entry is HistoryEntry => Boolean(entry))
      .sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));

    return {
      key: dateKey,
      label: formatHistoryDateLabel(date, dateKey === todayKey),
      dateKey,
      isToday: dateKey === todayKey,
      xp: getTodayXP(logs, dateKey),
      count: entries.length,
      entries
    };
  });
}

export function buildSelectedLifeQuickActions(
  logs: LifeOSLogs,
  todayKey: string,
  lifeQuickActionMap: Record<string, { label: string; group: string }>
): QuickActionSummary[] {
  return Object.entries(logs?.[todayKey] ?? {})
    .filter(([taskId, record]) => {
      const action = lifeQuickActionMap[taskId];
      if (!action) return false;
      const rawValue = record?.value;
      return typeof rawValue === "boolean" ? rawValue : Number(rawValue) > 0;
    })
    .map(([taskId]) => ({
      id: taskId,
      ...lifeQuickActionMap[taskId]
    }))
    .sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
}

export function buildMoneySummary(logs: LifeOSLogs, dateKey: string): MoneySummary {
  return {
    income: Number(getLogValue(logs, dateKey, "income-logged") ?? 0),
    expense: Number(getLogValue(logs, dateKey, "expense-tracked") ?? 0),
    savings: Number(getLogValue(logs, dateKey, "saved-today") ?? 0),
    investment: Number(getLogValue(logs, dateKey, "investment-return") ?? 0)
  };
}

export function buildStudySummary(
  logs: LifeOSLogs,
  dateKey: string,
  studyTasks: TrackedTaskDefinition[],
  formatter: (task: TrackedTaskDefinition, value: number | boolean | undefined) => string
): StudySummaryItem[] {
  return studyTasks.map((task) => ({
    id: task.id,
    label: task.label,
    value: formatter(task, getLogValue(logs, dateKey, task.id))
  }));
}

export function isMiscTodoDone(
  item: LifeOSState["miscTodos"][number] | null | undefined,
  dateKey: string
): boolean {
  if (!item) return false;
  if (item.category === "daily") {
    return item.completedDayKey === dateKey;
  }
  return Boolean(item.done);
}

export function buildMiscTodoCounts(miscTodos: LifeOSState["miscTodos"], todayKey: string): MiscTodoCounts {
  return {
    total: miscTodos.length,
    open: miscTodos.filter((item) => !isMiscTodoDone(item, todayKey)).length,
    done: miscTodos.filter((item) => isMiscTodoDone(item, todayKey)).length,
    work: miscTodos.filter((item) => item.category === "work").length,
    study: miscTodos.filter((item) => item.category === "study").length,
    life: miscTodos.filter((item) => item.category === "life").length,
    daily: miscTodos.filter((item) => item.category === "daily").length
  };
}

export function buildNoteCollections(noteItems: NoteItem[], noteFilter: string): NoteCollections {
  const sorted = [...noteItems].sort((a, b) => {
    if (a.archived !== b.archived) return Number(a.archived) - Number(b.archived);
    if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
    return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
  });

  const activeNotes = sorted.filter((note) => !note.archived);
  const filtered =
    noteFilter === "Pinned"
      ? activeNotes.filter((note) => note.pinned)
      : noteFilter === "Recent"
        ? activeNotes.slice(0, 8)
        : noteFilter === "Archived"
          ? sorted.filter((note) => note.archived)
          : activeNotes;

  return {
    sorted,
    filtered,
    counts: {
      all: sorted.filter((note) => !note.archived).length,
      pinned: sorted.filter((note) => !note.archived && note.pinned).length,
      recent: sorted.filter((note) => !note.archived).slice(0, 8).length,
      archived: noteItems.filter((note) => note.archived).length
    }
  };
}

export function getNoteActionLabel(note: NoteItem | null | undefined): string {
  const title = note?.title?.trim();
  const content = note?.content?.trim();
  return title || content || "Untitled note";
}

export function buildDashboardOverview(state: LifeOSState): DashboardOverview {
  return {
    level: getLevel(state.profile.totalXP),
    income: computeIncomeStats(state.profile.yearGoal),
    lifeUsedRatio: clamp(state.profile.age / state.profile.lifeExpectancy, 0, 1),
    daysLeft: Math.max(0, Math.round((state.profile.lifeExpectancy - state.profile.age) * 365)),
    yearsToRetirement: Math.max(0, state.profile.retirementAge - state.profile.age),
    coreStreaks: [
      {
        label: "Language Skills",
        history: getTaskHistory(state.logs, "language-skills", 7),
        streak: getStreak(state.logs, "language-skills")
      },
      {
        label: "Exercise",
        history: getTaskHistory(state.logs, "exercise", 7),
        streak: getStreak(state.logs, "exercise")
      },
      {
        label: "Meditation",
        history: getTaskHistory(state.logs, "meditation", 7),
        streak: getStreak(state.logs, "meditation")
      }
    ]
  };
}

export function buildFocusViewModel(params: {
  focusType: FocusType;
  focusTask: FocusTaskOption | null;
  focusTaskOptions: FocusTaskOptions;
  focusRemainingSeconds: number;
  focusSessions: LifeOSState["focusSessions"];
  todayKey: string;
}): FocusViewModel {
  const { focusType, focusTask, focusTaskOptions, focusRemainingSeconds, focusSessions, todayKey } = params;

  return {
    formattedTime: `${String(Math.floor(focusRemainingSeconds / 60)).padStart(2, "0")}:${String(focusRemainingSeconds % 60).padStart(2, "0")}`,
    sessionsTodayCount: getFocusSessionsForDate(focusSessions, todayKey).length,
    dayStreak: getFocusDayStreak(focusSessions, todayKey),
    availableTaskCount: focusType ? (focusTaskOptions[focusType] ?? []).length : 0,
    rewardPreview: computeFocusReward({
      type: focusType,
      taskBound: Boolean(focusTask),
      focusSessions,
      dateKey: todayKey
    })
  };
}

export function buildWorkSidebarSummary(state: LifeOSState, todayKey: string): WorkSidebarSummary {
  const projectSummaries = state.workProjects.map((project) => {
    const total = (project.todayActions ?? []).length;
    const done = (project.todayActions ?? []).filter((action) => Boolean(getLogValue(state.logs, todayKey, `${project.id}:${action.id}`))).length;
    return {
      id: project.id,
      label: project.name,
      total,
      done,
      open: Math.max(0, total - done),
      backlog: (project.backlog ?? []).length,
      candidates: (project.nextDayCandidates ?? []).length
    };
  });

  return {
    total: projectSummaries.reduce((sum, project) => sum + project.total, 0),
    done: projectSummaries.reduce((sum, project) => sum + project.done, 0),
    open: projectSummaries.reduce((sum, project) => sum + project.open, 0),
    projects: projectSummaries
  };
}

export function buildWorkExecutionSummary(workProjects: WorkProject[]): WorkExecutionSummary {
  const projectSummaries = workProjects.map((project) => {
    const total = (project.todayActions ?? []).length;
    const remainingToTarget = Math.max(0, 3 - total);
    return {
      id: project.id,
      total,
      executionReady: total >= 3 && total <= 5,
      remainingToTarget
    };
  });

  return {
    readyProjects: projectSummaries.filter((project) => project.executionReady).length,
    projectsNeedingActions: projectSummaries.filter((project) => project.remainingToTarget > 0).length,
    missingActions: projectSummaries.reduce((sum, project) => sum + project.remainingToTarget, 0)
  };
}

export function getProjectDailyActionStatus(project: WorkProject | null | undefined): ProjectDailyActionStatus {
  const total = project?.todayActions?.length ?? 0;

  if (total >= 3 && total <= 5) {
    return {
      tone: "is-ready",
      message: "Execution-ready. Keep these concrete and finishable."
    };
  }

  if (total < 3) {
    return {
      tone: "is-light",
      message: `${3 - total} more action${3 - total === 1 ? "" : "s"} to reach the daily target of 3.`
    };
  }

  return {
    tone: "is-full",
    message: "Full for today. Finish or remove one before adding more."
  };
}

export function buildWorkProjectViewModels(
  workProjects: WorkProject[],
  logs: LifeOSLogs,
  todayKey: string,
  slotLabels: WorkProjectSlotLabels
): WorkProjectViewModel[] {
  return workProjects.map((project) => ({
    project,
    slotLabel: slotLabels[project.id] ?? project.name,
    todayCount: (project.todayActions ?? []).length,
    status: getProjectDailyActionStatus(project),
    todayActions: (project.todayActions ?? []).map<WorkProjectActionViewModel>((action) => ({
      action,
      done: Boolean(getLogValue(logs, todayKey, `${project.id}:${action.id}`))
    }))
  }));
}

export function buildWorkComposerViewModel(
  workProjects: WorkProject[],
  modalProjectId: string,
  draft: string
): WorkComposerViewModel {
  const activeProject = workProjects.find((project) => project.id === modalProjectId) ?? null;

  return {
    isOpen: Boolean(modalProjectId),
    projectId: modalProjectId,
    title: activeProject?.name ?? "Project",
    draft,
    activeProject,
    nextDayCandidates: activeProject?.nextDayCandidates ?? [],
    backlog: activeProject?.backlog ?? []
  };
}

export function buildWorkPageViewModel(params: {
  state: LifeOSState;
  todayKey: string;
  slotLabels: WorkProjectSlotLabels;
  modalProjectId: string;
  draft: string;
}): WorkPageViewModel {
  const { state, todayKey, slotLabels, modalProjectId, draft } = params;

  return {
    sidebarSummary: buildWorkSidebarSummary(state, todayKey),
    executionSummary: buildWorkExecutionSummary(state.workProjects),
    projectViewModels: buildWorkProjectViewModels(state.workProjects, state.logs, todayKey, slotLabels),
    composerViewModel: buildWorkComposerViewModel(state.workProjects, modalProjectId, draft)
  };
}

export function buildDashboardTasks(state: LifeOSState, todayKey: string, studyTasks: TrackedTaskDefinition[], lifeGroups: LifeGroup[]): DashboardTask[] {
  const workTasks = state.workProjects.flatMap((project) =>
    project.todayActions
      .filter((action) => !Boolean(getLogValue(state.logs, todayKey, `${project.id}:${action.id}`)))
      .map<DashboardTask>((action) => ({
        id: `work:${project.id}:${action.id}`,
        sourceType: "work-todo",
        sourceId: action.id,
        projectId: project.id,
        label: action.label || "Untitled task",
        category: "Work",
        context: project.name,
        xpReward: 10,
        attributeKey: "wealth",
        attributeDelta: project.id === "side-business" ? 3 : 2
      }))
  );

  const studyExecutionTasks = studyTasks
    .filter((task) => Number(getLogValue(state.logs, todayKey, task.id) ?? 0) <= 0)
    .map<DashboardTask>((task) => ({
      id: `study:${task.id}`,
      sourceType: "tracked-task",
      sourceId: task.id,
      projectId: "",
      label: task.label,
      category: "Study",
      context: "Learning block",
      xpReward: Math.round((task.presets?.[0] ?? 1) * task.xpPerUnit),
      completionValue: task.presets?.[0] ?? 1,
      task,
      attributeKey: "mind",
      attributeDelta: 2
    }));

  const actionableLifeTasks = lifeGroups
    .flatMap((group) => group.items)
    .filter((task) => !["sleep-quality", "stress-level", "weight"].includes(task.id))
    .filter((task) => Number(getLogValue(state.logs, todayKey, task.id) ?? 0) <= 0)
    .map<DashboardTask>((task) => ({
      id: `life:${task.id}`,
      sourceType: "tracked-task",
      sourceId: task.id,
      projectId: "",
      label: task.label,
      category: "Life",
      context: "Daily upkeep",
      xpReward: Math.round((task.presets?.[0] ?? 1) * task.xpPerUnit),
      completionValue: task.presets?.[0] ?? 1,
      task,
      attributeKey: task.id === "meditation" ? "mind" : "body",
      attributeDelta: 1
    }));

  return [...workTasks, ...studyExecutionTasks, ...actionableLifeTasks];
}

export function getMainDashboardTask(dashboardTasks: DashboardTask[], executionMainTaskId: string): DashboardTask | null {
  return dashboardTasks.find((task) => task.id === executionMainTaskId) ?? dashboardTasks[0] ?? null;
}

export function getActiveExecutionTask(
  dashboardTasks: DashboardTask[],
  execution: ExecutionState
): ActiveExecutionTask | null {
  return (
    dashboardTasks.find((task) => task.id === execution.currentTaskId) ?? 
    (execution.currentTaskId
      ? {
          id: execution.currentTaskId,
          label: execution.currentTaskLabel,
          category: execution.currentCategory,
          context: "",
          xpReward: execution.xpReward,
          attributeKey: (execution.attributeKey || "mind") as ActiveExecutionTask["attributeKey"],
          attributeDelta: execution.attributeDelta,
          sourceType: execution.sourceType,
          sourceId: execution.sourceId,
          projectId: execution.projectId
        }
      : null)
  );
}

export function formatExecutionElapsedTime(execution: ExecutionState, nowMs: number): string {
  const executionElapsedMs =
    execution.elapsedMs +
    (execution.status === "active" && execution.startTime ? Math.max(0, nowMs - new Date(execution.startTime).getTime()) : 0);

  const executionMinutes = Math.floor(executionElapsedMs / 60000);
  const executionSeconds = Math.floor((executionElapsedMs % 60000) / 1000);
  return `${String(executionMinutes).padStart(2, "0")}:${String(executionSeconds).padStart(2, "0")}`;
}
