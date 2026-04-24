import {
  DEFAULT_STATE,
  computeFocusReward,
  getLogValue,
  getTodayXP,
  migrateState,
  touchState
} from "@/lib/lifeos-data";
import type {
  AttributesState,
  FocusSession,
  FocusSessionCompletion,
  FocusType,
  LifeGroup,
  LifeOSState,
  LogValue,
  MiscTodoCategory,
  NoteItem,
  ProfileState,
  TrackedTaskDefinition,
  WorkAction,
  WorkActionSource,
  WorkProject
} from "@/lib/lifeos-types";

type TrackedTaskInput = Pick<TrackedTaskDefinition, "id" | "type" | "xpPerUnit"> &
  Partial<Pick<TrackedTaskDefinition, "label" | "presets">>;

type NoteUpdater = Partial<NoteItem> | ((note: NoteItem) => Partial<NoteItem>);

interface FocusTaskBinding {
  logTaskId?: string;
  taskId?: string;
  label?: string;
  meta?: string;
  sourceType?: string;
  projectId?: string;
}

interface FocusSessionMutationInput {
  focusType: FocusType;
  focusTask?: FocusTaskBinding | null;
  focusDurationMinutes: number;
  todayKey: string;
  timestamp: string;
  focusLogId: string;
  focusSessionId: string;
}

interface ExecutionTaskInput {
  id: string;
  label: string;
  category: string;
  sourceType: string;
  sourceId: string;
  projectId?: string;
  xpReward?: number;
  attributeKey?: keyof AttributesState;
  attributeDelta?: number;
  completionValue?: LogValue;
}

interface CompleteExecutionInput {
  activeTask: ExecutionTaskInput;
  sourceTask?: TrackedTaskInput | null;
  todayKey: string;
}

function ensureDayLogs(state: LifeOSState, dateKey: string) {
  return state.logs?.[dateKey] ?? {};
}

export function resetFocusPrefill(state: LifeOSState): LifeOSState {
  return {
    ...state,
    focusPrefill: {
      ...DEFAULT_STATE.focusPrefill
    }
  };
}

export function rolloverWorkProjectsForNewDay(state: LifeOSState, todayKey: string): LifeOSState {
  return {
    ...state,
    workDayKey: todayKey,
    workProjects: state.workProjects.map((project) => {
      const unfinished = (project.todayActions ?? []).filter(
        (action) => !Boolean(getLogValue(state.logs, state.workDayKey, `${project.id}:${action.id}`))
      );
      const nextDayCandidates = [...unfinished, ...(project.nextDayCandidates ?? [])]
        .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index)
        .slice(0, 5);

      return {
        ...project,
        todayActions: [],
        nextDayCandidates
      };
    })
  };
}

export function markSyncSuccess(state: LifeOSState, lastSyncedAt: string): LifeOSState {
  return {
    ...state,
    sync: {
      ...state.sync,
      status: "synced",
      lastSyncedAt,
      error: ""
    }
  };
}

export function markSyncError(state: LifeOSState, error: string): LifeOSState {
  return {
    ...state,
    sync: {
      ...state.sync,
      status: "error",
      error
    }
  };
}

export function applyRemoteSyncedState(
  state: LifeOSState,
  syncPatch: Partial<LifeOSState["sync"]> = {}
): LifeOSState {
  return migrateState({
    ...state,
    sync: {
      ...state.sync,
      ...syncPatch,
      status: "synced",
      error: ""
    }
  });
}

export function beginAnonymousSync(state: LifeOSState, code: string): LifeOSState {
  return touchState({
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
}

export function markBackupSaved(state: LifeOSState, lastBackupAt: string): LifeOSState {
  return {
    ...state,
    sync: {
      ...state.sync,
      lastBackupAt,
      error: ""
    }
  };
}

export function applyTrackedLogAtDate(
  state: LifeOSState,
  task: TrackedTaskInput,
  value: LogValue,
  dateKey: string
): LifeOSState {
  const normalized =
    task.type === "boolean" ? Boolean(value) : typeof value === "number" ? value : Number(value || 0);
  const previousXP = state.logs?.[dateKey]?.[task.id]?.xp ?? 0;
  const xpBase =
    task.type === "ratingReverse"
      ? Math.round((6 - Number(normalized)) * task.xpPerUnit)
      : task.type === "boolean"
        ? normalized
          ? task.xpPerUnit
          : 0
        : Math.round(Number(normalized) * task.xpPerUnit);
  const dayWithoutCurrent = getTodayXP(state.logs, dateKey) - previousXP;
  const nextDayXP = dayWithoutCurrent + xpBase;

  return {
    ...state,
    profile: {
      ...state.profile,
      totalXP: state.profile.totalXP - previousXP + xpBase,
      pbXP: Math.max(state.profile.pbXP, nextDayXP)
    },
    logs: {
      ...state.logs,
      [dateKey]: {
        ...ensureDayLogs(state, dateKey),
        [task.id]: {
          value: normalized,
          xp: xpBase,
          ts: Date.now()
        }
      }
    }
  };
}

export function applyTrackedLog(state: LifeOSState, task: TrackedTaskInput, value: LogValue, dateKey: string): LifeOSState {
  return applyTrackedLogAtDate(state, task, value, dateKey);
}

export function applyLifeTaskLogAtDate(
  state: LifeOSState,
  task: TrackedTaskInput,
  value: LogValue,
  dateKey: string,
  options: { accumulate?: boolean } = {}
): LifeOSState {
  const shouldAccumulate = Boolean(options.accumulate) && task.type !== "boolean";
  const previousValue = Number(getLogValue(state.logs, dateKey, task.id) ?? 0);
  const nextValue = shouldAccumulate ? previousValue + Number(value || 0) : value;
  return applyTrackedLogAtDate(state, task, nextValue, dateKey);
}

export function toggleWorkTodoLog(state: LifeOSState, projectId: string, todoId: string, dateKey: string): LifeOSState {
  const taskId = `${projectId}:${todoId}`;
  const currentValue = Boolean(getLogValue(state.logs, dateKey, taskId));
  return applyTrackedLog(state, { id: taskId, type: "boolean", xpPerUnit: 0 }, !currentValue, dateKey);
}

export function moveWorkActionToToday(
  state: LifeOSState,
  projectId: string,
  action: WorkAction,
  source: WorkActionSource = "backlog"
): LifeOSState {
  return {
    ...state,
    workProjects: state.workProjects.map((project) =>
      project.id === projectId
        ? {
            ...project,
            todayActions:
              (project.todayActions ?? []).length >= 5
                ? project.todayActions ?? []
                : [...(project.todayActions ?? []), action],
            backlog: source === "backlog" ? (project.backlog ?? []).filter((item) => item.id !== action.id) : project.backlog ?? [],
            nextDayCandidates:
              source === "candidate"
                ? (project.nextDayCandidates ?? []).filter((item) => item.id !== action.id)
                : project.nextDayCandidates ?? []
          }
        : project
    )
  };
}

export function renameTodayAction(state: LifeOSState, projectId: string, actionId: string, label: string): LifeOSState {
  return {
    ...state,
    workProjects: state.workProjects.map((project) =>
      project.id === projectId
        ? {
            ...project,
            todayActions: (project.todayActions ?? []).map((action) => (action.id === actionId ? { ...action, label } : action))
          }
        : project
    )
  };
}

export function deleteTodayAction(state: LifeOSState, projectId: string, actionId: string, dateKey: string): LifeOSState {
  return {
    ...state,
    workProjects: state.workProjects.map((project) =>
      project.id === projectId
        ? {
            ...project,
            todayActions: (project.todayActions ?? []).filter((action) => action.id !== actionId)
          }
        : project
    ),
    logs: {
      ...state.logs,
      [dateKey]: Object.fromEntries(
        Object.entries(ensureDayLogs(state, dateKey)).filter(([taskId]) => taskId !== `${projectId}:${actionId}`)
      )
    }
  };
}

export function renameWorkProject(state: LifeOSState, projectId: string, name: string): LifeOSState {
  return {
    ...state,
    workProjects: state.workProjects.map((project) => (project.id === projectId ? { ...project, name } : project))
  };
}

export function addMiscTodo(state: LifeOSState, label: string, category: MiscTodoCategory): LifeOSState {
  return {
    ...state,
    miscTodos: [
      {
        id: `misc-${Date.now()}`,
        label,
        category,
        done: false,
        createdAt: Date.now(),
        completedAt: null,
        completedDayKey: null
      },
      ...(state.miscTodos ?? [])
    ]
  };
}

export function updateMiscTodo(
  state: LifeOSState,
  todoId: string,
  updates: Partial<LifeOSState["miscTodos"][number]>
): LifeOSState {
  return {
    ...state,
    miscTodos: (state.miscTodos ?? []).map((item) => (item.id === todoId ? { ...item, ...updates } : item))
  };
}

export function toggleMiscTodo(state: LifeOSState, todoId: string, todayKey: string): LifeOSState {
  const currentTodo = (state.miscTodos ?? []).find((item) => item.id === todoId);
  if (!currentTodo) return state;

  if (currentTodo.category === "daily") {
    const doneToday = Boolean(currentTodo.done && currentTodo.completedDayKey === todayKey);
    return updateMiscTodo(state, todoId, {
      done: !doneToday,
      completedAt: doneToday ? null : Date.now(),
      completedDayKey: doneToday ? null : todayKey
    });
  }

  return updateMiscTodo(state, todoId, {
    done: !currentTodo.done,
    completedAt: currentTodo.done ? null : Date.now()
  });
}

export function deleteMiscTodo(state: LifeOSState, todoId: string): LifeOSState {
  return {
    ...state,
    miscTodos: (state.miscTodos ?? []).filter((item) => item.id !== todoId)
  };
}

export function addNote(
  state: LifeOSState,
  input: { title: string; content: string; type: string; paletteSize: number; createdAt: string }
): LifeOSState {
  const nextCursor = ((Number(state.noteCursor ?? 0) % input.paletteSize) + 1) % input.paletteSize;
  return {
    ...state,
    noteCursor: nextCursor,
    noteItems: [
      {
        id: `note-${Date.now()}`,
        title: input.title,
        content: input.content,
        type: input.type,
        pinned: false,
        archived: false,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
        colorIndex: Number(state.noteCursor ?? 0) % input.paletteSize
      },
      ...(state.noteItems ?? [])
    ]
  };
}

export function updateNoteItem(state: LifeOSState, noteId: string, updater: NoteUpdater, updatedAt: string): LifeOSState {
  return {
    ...state,
    noteItems: (state.noteItems ?? []).map((note) =>
      note.id === noteId
        ? {
            ...note,
            ...(typeof updater === "function" ? updater(note) : updater),
            updatedAt
          }
        : note
    )
  };
}

function archiveNote(state: LifeOSState, noteId: string, updatedAt: string): LifeOSState {
  return updateNoteItem(
    state,
    noteId,
    {
      archived: true,
      pinned: false
    },
    updatedAt
  );
}

export function moveNoteToTodo(
  state: LifeOSState,
  noteId: string,
  label: string,
  category: MiscTodoCategory,
  updatedAt: string
): LifeOSState {
  return {
    ...archiveNote(state, noteId, updatedAt),
    miscTodos: [
      {
        id: `misc-${Date.now()}`,
        label,
        category,
        done: false,
        createdAt: Date.now(),
        completedAt: null,
        completedDayKey: null
      },
      ...(state.miscTodos ?? [])
    ]
  };
}

export function convertNoteToProject(state: LifeOSState, noteId: string, label: string, updatedAt: string): LifeOSState {
  return {
    ...archiveNote(state, noteId, updatedAt),
    workProjects: (state.workProjects ?? []).map((project) =>
      project.id === "optional"
        ? {
            ...project,
            backlog: [{ id: `note-backlog-${Date.now()}`, label }, ...(project.backlog ?? [])]
          }
        : project
    )
  };
}

export function convertNoteToDailyAction(state: LifeOSState, noteId: string, label: string, updatedAt: string): LifeOSState {
  return {
    ...archiveNote(state, noteId, updatedAt),
    workProjects: (state.workProjects ?? []).map((project) =>
      project.id === "optional"
        ? {
            ...project,
            todayActions:
              (project.todayActions ?? []).length >= 5
                ? project.todayActions ?? []
                : [...(project.todayActions ?? []), { id: `note-action-${Date.now()}`, label }],
            backlog:
              (project.todayActions ?? []).length >= 5
                ? [{ id: `note-backlog-${Date.now()}`, label }, ...(project.backlog ?? [])]
                : project.backlog ?? []
          }
        : project
    )
  };
}

export function recordFocusSession(
  state: LifeOSState,
  input: FocusSessionMutationInput
): { state: LifeOSState; result: FocusSessionCompletion } | null {
  if (!input.focusType) return null;

  const reward = computeFocusReward({
    type: input.focusType,
    taskBound: Boolean(input.focusTask),
    focusSessions: state.focusSessions,
    dateKey: input.todayKey
  });
  const xpEarned = reward.xpEarned;
  const dayWithoutCurrent = getTodayXP(state.logs, input.todayKey);
  const nextDayXP = dayWithoutCurrent + xpEarned;
  const linkedTaskId = input.focusTask?.logTaskId ?? "";
  const linkedTaskRecord = linkedTaskId ? state.logs?.[input.todayKey]?.[linkedTaskId] ?? null : null;
  const closesBoundAction = input.focusTask?.sourceType === "work-todo";

  const result: FocusSessionCompletion = {
    ...reward,
    duration: input.focusDurationMinutes,
    taskLabel: input.focusTask?.label ?? "",
    taskMeta: input.focusTask?.meta ?? "",
    closesBoundAction
  };

  return {
    result,
    state: {
      ...state,
      profile: {
        ...state.profile,
        totalXP: Number(state.profile.totalXP ?? 0) + xpEarned,
        pbXP: Math.max(state.profile.pbXP, nextDayXP)
      },
      logs: {
        ...state.logs,
        [input.todayKey]: {
          ...ensureDayLogs(state, input.todayKey),
          ...(linkedTaskId
            ? {
                [linkedTaskId]: {
                  ...(linkedTaskRecord ?? {}),
                  value: closesBoundAction ? true : linkedTaskRecord?.value ?? 0,
                  xp: linkedTaskRecord?.xp ?? 0,
                  ts: Date.now(),
                  focusXp: Number(linkedTaskRecord?.focusXp ?? 0) + xpEarned
                }
              }
            : {}),
          [input.focusLogId]: {
            value: xpEarned,
            xp: xpEarned,
            ts: Date.now(),
            type: "focus-session"
          }
        }
      },
      focusSessions: [
        {
          id: input.focusSessionId,
          type: input.focusType,
          duration: input.focusDurationMinutes,
          taskId: input.focusTask?.taskId ?? "",
          taskLabel: input.focusTask?.label ?? "",
          sourceType: input.focusTask?.sourceType ?? "",
          projectId: input.focusTask?.projectId ?? "",
          xpEarned,
          streakBonusPct: reward.streakBonusPct,
          timestamp: input.timestamp
        },
        ...(state.focusSessions ?? [])
      ].slice(0, 100)
    }
  };
}

export function setWorkFocusPrefill(state: LifeOSState, project: WorkProject, action: WorkAction): LifeOSState {
  return {
    ...state,
    focusPrefill: {
      type: "work",
      taskId: `work:${project.id}:${action.id}`,
      label: action.label,
      meta: project.name,
      sourceType: "work-todo",
      projectId: project.id,
      logTaskId: `${project.id}:${action.id}`
    }
  };
}

export function updateProfileField<Key extends keyof ProfileState>(
  state: LifeOSState,
  key: Key,
  value: ProfileState[Key]
): LifeOSState {
  return {
    ...state,
    profile: {
      ...state.profile,
      [key]: value
    }
  };
}

export function applyQuickLifeAction(state: LifeOSState, label: string, dateKey: string): LifeOSState {
  const quickActionId = `life-quick:${label.toLowerCase().replace(/\s+/g, "-")}`;
  return touchState(
    applyTrackedLogAtDate(
      state,
      {
        id: quickActionId,
        label,
        type: "boolean",
        xpPerUnit: 0
      },
      true,
      dateKey
    )
  );
}

export function startExecution(state: LifeOSState, task: ExecutionTaskInput, startedAt: string): LifeOSState {
  return {
    ...state,
    execution: {
      ...state.execution,
      status: "active",
      currentTaskId: task.id,
      currentTaskLabel: task.label,
      currentCategory: task.category,
      sourceType: task.sourceType,
      sourceId: task.sourceId,
      projectId: task.projectId ?? "",
      startTime: startedAt,
      elapsedMs: state.execution.currentTaskId === task.id ? state.execution.elapsedMs : 0,
      xpReward: task.xpReward ?? 0,
      attributeKey: task.attributeKey ?? "",
      attributeDelta: task.attributeDelta ?? 0,
      mainTaskId: state.execution.mainTaskId || task.id
    }
  };
}

export function toggleExecutionPause(state: LifeOSState, nowMs: number): LifeOSState {
  if (!state.execution.currentTaskId) return state;

  if (state.execution.status === "active") {
    const nextElapsed =
      state.execution.elapsedMs +
      (state.execution.startTime ? Math.max(0, nowMs - new Date(state.execution.startTime).getTime()) : 0);
    return {
      ...state,
      execution: {
        ...state.execution,
        status: "paused",
        startTime: null,
        elapsedMs: nextElapsed
      }
    };
  }

  return {
    ...state,
    execution: {
      ...state.execution,
      status: "active",
      startTime: new Date(nowMs).toISOString()
    }
  };
}

export function completeExecution(state: LifeOSState, input: CompleteExecutionInput): LifeOSState {
  let next = state;

  if (input.activeTask.sourceType === "work-todo") {
    next = applyTrackedLog(
      next,
      {
        id: `${input.activeTask.projectId}:${input.activeTask.sourceId}`,
        type: "boolean",
        xpPerUnit: input.activeTask.xpReward || 10
      },
      true,
      input.todayKey
    );
  }

  if (input.activeTask.sourceType === "tracked-task" && input.sourceTask) {
    next = applyTrackedLog(
      next,
      input.sourceTask,
      input.activeTask.completionValue ?? input.sourceTask.presets?.[0] ?? true,
      input.todayKey
    );
  }

  return {
    ...next,
    attributes: {
      ...next.attributes,
      [input.activeTask.attributeKey || "mind"]:
        Number(next.attributes?.[input.activeTask.attributeKey || "mind"] ?? 0) + Number(input.activeTask.attributeDelta ?? 0)
    },
    execution: {
      ...DEFAULT_STATE.execution,
      mainTaskId: state.execution.mainTaskId
    }
  };
}
