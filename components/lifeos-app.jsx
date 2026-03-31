"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Armchair,
  BriefcaseBusiness,
  CircleDollarSign,
  ChevronDown,
  Command,
  CookingPot,
  Droplets,
  Download,
  Flame,
  Footprints,
  Gamepad2,
  Gem,
  GraduationCap,
  HeartPulse,
  History,
  Home,
  Link2,
  ListTodo,
  MessageCircle,
  MonitorPlay,
  MoonStar,
  Music4,
  Save,
  RefreshCw,
  Package,
  ShieldCheck,
  ShoppingBasket,
  Sparkle,
  Plus,
  Play,
  Phone,
  Pause,
  CheckCircle2,
  Sparkles,
  Trash2,
  Users,
  Timer,
  UtensilsCrossed
} from "lucide-react";
import {
  CURRENCIES,
  DEFAULT_STATE,
  LIFE_PILLARS,
  MODULE_COLORS,
  STORAGE_KEY,
  clamp,
  computeIncomeStats,
  formatDateKey,
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
  { href: "/dashboard", label: "Home" },
  { href: "/focus", label: "Focus" },
  { href: "/todo", label: "Todo" },
  { href: "/work", label: "Work" },
  { href: "/study", label: "Study" },
  { href: "/life", label: "Life" },
  {
    href: "/rooms",
    label: "Rooms",
    children: [
      { href: "/rooms/office", label: "Office" },
      { href: "/rooms/study", label: "Study Room" }
    ]
  },
  { href: "/money", label: "Money" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" }
];

const ATTRIBUTE_LABELS = {
  mind: "Mind",
  body: "Body",
  wealth: "Wealth",
  social: "Social"
};

const WORK_PROJECT_SLOT_LABELS = {
  "main-job": "Main",
  "side-business": "Side",
  optional: "Optional"
};

const LIFE_QUICK_ACTIONS = [
  {
    title: "Household",
    items: [
      { label: "Laundry", icon: RefreshCw },
      { label: "Clean", icon: Sparkles },
      { label: "Organize", icon: BriefcaseBusiness },
      { label: "Trash", icon: Trash2 },
      { label: "Supplies", icon: Package },
      { label: "Room", icon: Home }
    ]
  },
  {
    title: "Food",
    items: [
      { label: "Cook", icon: CookingPot },
      { label: "Grocery", icon: ShoppingBasket },
      { label: "Water", icon: Droplets },
      { label: "Eat", icon: UtensilsCrossed }
    ]
  },
  {
    title: "Health",
    items: [
      { label: "Exercise", icon: Activity },
      { label: "Meditation", icon: HeartPulse },
      { label: "Sleep", icon: MoonStar },
      { label: "Walk", icon: Footprints }
    ]
  },
  {
    title: "Social",
    items: [
      { label: "Call", icon: Phone },
      { label: "Meet", icon: Users },
      { label: "Chat", icon: MessageCircle },
      { label: "Family", icon: Home }
    ]
  },
  {
    title: "Leisure",
    items: [
      { label: "Game", icon: Gamepad2 },
      { label: "Video", icon: MonitorPlay },
      { label: "Music", icon: Music4 },
      { label: "Rest", icon: Armchair }
    ]
  }
];

const LIFE_QUICK_ACTION_MAP = Object.fromEntries(
  LIFE_QUICK_ACTIONS.flatMap((group) =>
    group.items.map((item) => [
      `life-quick:${item.label.toLowerCase().replace(/\s+/g, "-")}`,
      {
        label: item.label,
        group: group.title
      }
    ])
  )
);

const LIFE_DEFAULT_INPUTS = {
  exercise: 5,
  "sleep-quality": 75,
  meditation: 5,
  "water-intake": 250
};

const STUDY_DEFAULT_INPUTS = {
  "language-skills": 25,
  "ai-skills": 25,
  reading: 5
};

const MONEY_DEFAULT_INPUTS = {
  "income-logged": 50,
  "expense-tracked": 20,
  "saved-today": 20,
  "investment-return": 50
};

const FOCUS_DURATION_OPTIONS = {
  work: [25],
  study: [25, 45],
  life: [15, 25]
};

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

const STUDY_ROOM_MAP = {
  width: 980,
  height: 700
};

const STUDY_ROOM_ZONES = [
  {
    id: "quiet-zone",
    label: "A Zone",
    kind: "Quiet Focus",
    x: 42,
    y: 78,
    width: 404,
    height: 226,
    seats: [
      { id: "A1", x: 118, y: 136 },
      { id: "A2", x: 228, y: 136 },
      { id: "A3", x: 338, y: 136 },
      { id: "A4", x: 118, y: 220 },
      { id: "A5", x: 228, y: 220 },
      { id: "A6", x: 338, y: 220 }
    ]
  },
  {
    id: "focus-zone",
    label: "B Zone",
    kind: "Light Focus",
    x: 42,
    y: 344,
    width: 404,
    height: 236,
    seats: [
      { id: "B1", x: 118, y: 414 },
      { id: "B2", x: 228, y: 414 },
      { id: "B3", x: 338, y: 414 },
      { id: "B4", x: 118, y: 500 },
      { id: "B5", x: 228, y: 500 },
      { id: "B6", x: 338, y: 500 }
    ]
  },
  {
    id: "booth-zone",
    label: "C Zone",
    kind: "Booth Seats",
    x: 482,
    y: 78,
    width: 208,
    height: 226,
    seats: [
      { id: "C1", x: 544, y: 132 },
      { id: "C2", x: 628, y: 132 },
      { id: "C3", x: 544, y: 220 },
      { id: "C4", x: 628, y: 220 }
    ]
  },
  {
    id: "window-zone",
    label: "D Zone",
    kind: "Window Seats",
    x: 482,
    y: 344,
    width: 208,
    height: 236,
    seats: [
      { id: "D1", x: 544, y: 420 },
      { id: "D2", x: 628, y: 420 },
      { id: "D3", x: 544, y: 506 },
      { id: "D4", x: 628, y: 506 }
    ]
  },
  {
    id: "commons",
    label: "Commons",
    kind: "Lounge + Tea",
    x: 724,
    y: 78,
    width: 214,
    height: 502,
    seats: []
  }
];

export function LifeOSApp({ view = "dashboard" }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [lifeLogDate, setLifeLogDate] = useState(getTodayKey());
  const [moneyLogDate, setMoneyLogDate] = useState(getTodayKey());
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [backupCount, setBackupCount] = useState(0);
  const [openNavMenu, setOpenNavMenu] = useState("");
  const [roomsMenuPosition, setRoomsMenuPosition] = useState({ top: 0, left: 12 });
  const [lifeQuickAction, setLifeQuickAction] = useState("");
  const [miscTodoInput, setMiscTodoInput] = useState("");
  const [miscTodoCategory, setMiscTodoCategory] = useState("work");
  const [focusType, setFocusType] = useState("");
  const [focusTask, setFocusTask] = useState(null);
  const [focusStatus, setFocusStatus] = useState("idle");
  const [focusDurationMinutes, setFocusDurationMinutes] = useState(25);
  const [focusRemainingSeconds, setFocusRemainingSeconds] = useState(25 * 60);
  const [focusStartedAt, setFocusStartedAt] = useState(null);
  const [focusTaskModalOpen, setFocusTaskModalOpen] = useState(false);
  const [workActionModalProjectId, setWorkActionModalProjectId] = useState("");
  const [workActionDraft, setWorkActionDraft] = useState("");
  const [officePresence, setOfficePresence] = useState({
    x: 108,
    y: 138,
    zoneId: "open-desks",
    seatId: "open-1",
    status: "Working"
  });
  const [studyPresence, setStudyPresence] = useState({
    zoneId: "quiet-zone",
    seatId: "A3",
    mode: "Deep Focus"
  });
  const todayKey = getTodayKey();
  const pathname = usePathname();
  const router = useRouter();
  const pollingRef = useRef(null);
  const pushTimeoutRef = useRef(null);
  const officeMapRef = useRef(null);
  const roomsTriggerRef = useRef(null);
  const roomsDropdownRef = useRef(null);
  const [executionNow, setExecutionNow] = useState(Date.now());
  const focusTimerRef = useRef(null);

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
    if (state.execution.status !== "active") return;
    const timer = window.setInterval(() => setExecutionNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state.execution.status]);

  useEffect(() => {
    if (focusStatus !== "running") return;
    focusTimerRef.current = window.setInterval(() => {
      setFocusRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(focusTimerRef.current);
          setFocusStatus("completed");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(focusTimerRef.current);
  }, [focusStatus]);

  const lifeTaskMap = useMemo(
    () =>
      Object.fromEntries(
        lifeGroups.flatMap((group) => group.items).map((task) => [task.id, task])
      ),
    []
  );
  const studyTaskMap = useMemo(() => Object.fromEntries(studyTasks.map((task) => [task.id, task])), []);
  const moneyTaskMap = useMemo(() => Object.fromEntries(moneyTasks.map((task) => [task.id, task])), []);
  const lifePageTasks = [
    "exercise",
    "meditation",
    "sleep-quality",
    "water-intake",
    "stress-level",
    "social-connection",
    "risky-substances"
  ]
    .map((taskId) => lifeTaskMap[taskId])
    .filter(Boolean);

  const focusTaskOptions = useMemo(
    () => ({
      work: state.workProjects.flatMap((project) =>
        (project.todayActions ?? [])
          .filter((action) => !Boolean(getLogValue(state.logs, todayKey, `${project.id}:${action.id}`)))
          .map((action) => ({
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
      study: studyTasks.map((task) => ({
        id: `study:${task.id}`,
        logTaskId: task.id,
        taskId: task.id,
        label: task.label,
        meta: "Study",
        type: "study",
        sourceType: "tracked-task"
      })),
      life: lifePageTasks
        .filter((task) => !["stress-level", "risky-substances"].includes(task.id))
        .map((task) => ({
          id: `life:${task.id}`,
          logTaskId: task.id,
          taskId: task.id,
          label: task.label,
          meta: "Life",
          type: "life",
          sourceType: "tracked-task"
        }))
    }),
    [lifePageTasks, state.logs, state.workProjects, todayKey]
  );

  useEffect(() => {
    if (view !== "focus") return;
    if (!state.focusPrefill?.type) return;

    const prefillType = state.focusPrefill.type;
    const nextDuration = FOCUS_DURATION_OPTIONS[prefillType]?.[0] ?? 25;
    const matchingTask = (focusTaskOptions[prefillType] ?? []).find((item) => item.id === state.focusPrefill.taskId);

    setFocusType(prefillType);
    setFocusTask(matchingTask ?? null);
    setFocusDurationMinutes(nextDuration);
    setFocusRemainingSeconds(nextDuration * 60);

    commitState((current) => ({
      ...current,
      focusPrefill: {
        ...DEFAULT_STATE.focusPrefill
      }
    }));
  }, [view, state.focusPrefill, focusTaskOptions]);

  useEffect(() => {
    if (openNavMenu !== "rooms") return;

    const updatePosition = () => {
      const trigger = roomsTriggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const maxLeft = Math.max(12, window.innerWidth - 196);
      setRoomsMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(12, Math.min(rect.left, maxLeft))
      });
    };

    const onPointerDown = (event) => {
      const trigger = roomsTriggerRef.current;
      const dropdown = roomsDropdownRef.current;
      if (trigger?.contains(event.target) || dropdown?.contains(event.target)) return;
      setOpenNavMenu("");
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openNavMenu]);

  useEffect(() => {
    if (!ready || state.workDayKey === todayKey) return;

    commitState((current) => ({
      ...current,
      workDayKey: todayKey,
      workProjects: current.workProjects.map((project) => {
        const unfinished = (project.todayActions ?? []).filter(
          (action) => !Boolean(getLogValue(current.logs, current.workDayKey, `${project.id}:${action.id}`))
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
    }));
  }, [ready, state.workDayKey, todayKey]);

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
  const completedWorkCount = state.workProjects.reduce(
    (sum, project) =>
      sum + (project.todayActions ?? []).filter((action) => Boolean(getLogValue(state.logs, todayKey, `${project.id}:${action.id}`))).length,
    0
  );
  const todayCompletedCount = completedWorkCount + studyDoneCount + lifeDoneCount;
  const lifeUsedRatio = clamp(state.profile.age / state.profile.lifeExpectancy, 0, 1);
  const daysLeft = Math.max(0, Math.round((state.profile.lifeExpectancy - state.profile.age) * 365));
  const yearsToRetirement = Math.max(0, state.profile.retirementAge - state.profile.age);
  const pillarCompletion = LIFE_PILLARS.map((pillar) => {
    const value = getLogValue(state.logs, todayKey, pillar.id);
    const done = typeof value === "boolean" ? value : Number(value) > 0;
    return {
      ...pillar,
      done
    };
  });
  const coreStreaks = [
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
  ];
  const historyDays = useMemo(() => {
    const formatDateLabel = (date, isToday) => {
      if (isToday) return "Today";
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      }).format(date);
    };

    const formatHistoryValue = (task, rawValue) => {
      if (task?.type === "boolean") return rawValue ? "Done" : "Not done";
      if (task?.unit === "$") return `${state.profile.currency}${formatNumber(Number(rawValue || 0))}`;
      if (task?.unit === "★") return `${rawValue}★`;
      return `${rawValue}${task?.compactUnit ? "" : " "}${task?.unit ?? ""}`.trim();
    };

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const dateKey = formatDateKey(date);
      const dayLogs = state.logs?.[dateKey] ?? {};
      const entries = Object.entries(dayLogs)
        .map(([taskId, record]) => {
          const rawValue = record?.value;
          const isDone = typeof rawValue === "boolean" ? rawValue : Number(rawValue) > 0;
          if (!isDone) return null;

          if (taskId.includes(":")) {
            const [projectId, todoId] = taskId.split(":");
            const project = state.workProjects.find((item) => item.id === projectId);
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
              value: formatHistoryValue(studyTask, rawValue),
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
              value: formatHistoryValue(lifeTask, rawValue),
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
              value: formatHistoryValue(moneyTask, rawValue),
              meta: "",
              xp: record?.xp ?? 0
            };
          }

          const quickAction = LIFE_QUICK_ACTION_MAP[taskId];
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
        .filter(Boolean)
        .sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));

      return {
        key: dateKey,
        label: formatDateLabel(date, dateKey === todayKey),
        dateKey,
        isToday: dateKey === todayKey,
        xp: getTodayXP(state.logs, dateKey),
        count: entries.length,
        entries
      };
    });
  }, [lifeTaskMap, moneyTaskMap, state.logs, state.profile.currency, state.workProjects, studyTaskMap, todayKey]);
  const featuredHistoryDay = historyDays[0];
  const previousHistoryDays = historyDays.slice(1);
  const selectedLifeQuickActions = useMemo(
    () =>
      Object.entries(state.logs?.[lifeLogDate] ?? {})
        .filter(([taskId, record]) => {
          const action = LIFE_QUICK_ACTION_MAP[taskId];
          if (!action) return false;
          const rawValue = record?.value;
          return typeof rawValue === "boolean" ? rawValue : Number(rawValue) > 0;
        })
        .map(([taskId]) => ({
          id: taskId,
          ...LIFE_QUICK_ACTION_MAP[taskId]
        }))
        .sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label)),
    [lifeLogDate, state.logs]
  );
  const yesterdayKey = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return formatDateKey(date);
  }, []);
  const buildMoneySummary = (dateKey) => ({
    income: Number(getLogValue(state.logs, dateKey, "income-logged") ?? 0),
    expense: Number(getLogValue(state.logs, dateKey, "expense-tracked") ?? 0),
    savings: Number(getLogValue(state.logs, dateKey, "saved-today") ?? 0),
    investment: Number(getLogValue(state.logs, dateKey, "investment-return") ?? 0)
  });
  const todayMoneySummary = useMemo(
    () => buildMoneySummary(todayKey),
    [state.logs, todayKey]
  );
  const yesterdayMoneySummary = useMemo(
    () => buildMoneySummary(yesterdayKey),
    [state.logs, yesterdayKey]
  );
  const buildStudySummary = (dateKey) =>
    studyTasks.map((task) => ({
      id: task.id,
      label: task.label,
      value: formatTaskValue(task, getLogValue(state.logs, dateKey, task.id), state.profile.currency)
    }));
  const todayStudySummary = useMemo(
    () => buildStudySummary(todayKey),
    [state.logs, todayKey, state.profile.currency]
  );
  const yesterdayStudySummary = useMemo(
    () => buildStudySummary(yesterdayKey),
    [state.logs, yesterdayKey, state.profile.currency]
  );
  const miscTodoItems = state.miscTodos ?? [];
  const miscTodoCounts = useMemo(
    () => ({
      total: miscTodoItems.length,
      open: miscTodoItems.filter((item) => !item.done).length,
      done: miscTodoItems.filter((item) => item.done).length,
      work: miscTodoItems.filter((item) => item.category === "work").length,
      study: miscTodoItems.filter((item) => item.category === "study").length,
      life: miscTodoItems.filter((item) => item.category === "life").length
    }),
    [miscTodoItems]
  );
  const workSidebarSummary = useMemo(() => {
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
  }, [state.logs, state.workProjects, todayKey]);
  const focusAvailableDurations = focusType ? FOCUS_DURATION_OPTIONS[focusType] ?? [] : [];
  const formattedFocusTime = `${String(Math.floor(focusRemainingSeconds / 60)).padStart(2, "0")}:${String(focusRemainingSeconds % 60).padStart(2, "0")}`;
  const focusRewardPreview = useMemo(() => {
    if (!focusType) {
      return {
        xpEarned: 0,
        streakCount: 0,
        streakBonusPct: 0,
        breakBonus: 0,
        typeLabel: ""
      };
    }

    const sessionsToday = (state.focusSessions ?? []).filter((session) => formatDateKey(new Date(session.timestamp)) === todayKey).length;
    const streakCount = sessionsToday + 1;
    const streakBonusPct = streakCount >= 4 ? 30 : streakCount === 3 ? 20 : streakCount === 2 ? 10 : 0;
    const typeMultiplier = focusType === "work" ? 1.2 : focusType === "study" ? 1 : 0.8;
    const taskMultiplier = focusTask ? 1.2 : 1;
    const streakMultiplier = 1 + streakBonusPct / 100;
    const breakBonus = focusType === "life" && !focusTask ? 2 : 0;
    const xpEarned = Math.round(10 * typeMultiplier * taskMultiplier * streakMultiplier) + breakBonus;

    return {
      xpEarned,
      streakCount,
      streakBonusPct,
      breakBonus,
      typeLabel: focusType === "work" ? "Work" : focusType === "study" ? "Study" : "Life"
    };
  }, [focusTask, focusType, state.focusSessions, todayKey]);

  const applyTrackedLogAtDate = (current, task, value, dateKey) => {
    const normalized =
      task.type === "boolean" ? Boolean(value) : typeof value === "number" ? value : Number(value || 0);
    const previousXP = current.logs?.[dateKey]?.[task.id]?.xp ?? 0;
    const xpBase =
      task.type === "ratingReverse"
        ? Math.round((6 - normalized) * task.xpPerUnit)
        : task.type === "boolean"
          ? normalized
            ? task.xpPerUnit
            : 0
          : Math.round(normalized * task.xpPerUnit);
    const dayWithoutCurrent = getTodayXP(current.logs, dateKey) - previousXP;
    const nextDayXP = dayWithoutCurrent + xpBase;
    return {
      ...current,
      profile: {
        ...current.profile,
        totalXP: current.profile.totalXP - previousXP + xpBase,
        pbXP: Math.max(current.profile.pbXP, nextDayXP)
      },
      logs: {
        ...current.logs,
        [dateKey]: {
          ...(current.logs?.[dateKey] ?? {}),
          [task.id]: {
            value: normalized,
            xp: xpBase,
            ts: Date.now()
          }
        }
      }
    };
  };

  const applyTrackedLog = (current, task, value) => applyTrackedLogAtDate(current, task, value, todayKey);

  const logTask = (task, value) => {
    commitState((current) => applyTrackedLog(current, task, value));
  };

  const logTaskAtDate = (task, value, dateKey) => {
    commitState((current) => applyTrackedLogAtDate(current, task, value, dateKey));
  };

  const toggleTodo = (projectId, todoId) => {
    const task = { id: `${projectId}:${todoId}`, type: "boolean", xpPerUnit: 10 };
    const currentValue = Boolean(getLogValue(state.logs, todayKey, task.id));
    logTask(task, !currentValue);
  };

  const moveWorkActionToToday = (projectId, action, source = "backlog") => {
    commitState((current) => ({
      ...current,
      workProjects: current.workProjects.map((project) =>
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
    }));
  };

  const addWorkActionFromDraft = (projectId) => {
    const label = workActionDraft.trim();
    if (!label) return;

    moveWorkActionToToday(
      projectId,
      {
        id: `work-action-${Date.now()}`,
        label
      },
      "new"
    );
    setWorkActionDraft("");
    setWorkActionModalProjectId("");
  };

  const renameTodayAction = (projectId, actionId, label) => {
    commitState((current) => ({
      ...current,
      workProjects: current.workProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              todayActions: (project.todayActions ?? []).map((action) =>
                action.id === actionId ? { ...action, label } : action
              )
            }
          : project
      )
    }));
  };

  const deleteTodayAction = (projectId, actionId) => {
    commitState((current) => ({
      ...current,
      workProjects: current.workProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              todayActions: (project.todayActions ?? []).filter((action) => action.id !== actionId)
            }
          : project
      ),
      logs: {
        ...current.logs,
        [todayKey]: Object.fromEntries(
          Object.entries(current.logs?.[todayKey] ?? {}).filter(([taskId]) => taskId !== `${projectId}:${actionId}`)
        )
      }
    }));
  };

  const renameWorkProject = (projectId, name) => {
    commitState((current) => ({
      ...current,
      workProjects: current.workProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              name
            }
          : project
      )
    }));
  };

  const addMiscTodo = () => {
    const label = miscTodoInput.trim();
    if (!label) return;

    commitState((current) => ({
      ...current,
      miscTodos: [
        {
          id: `misc-${Date.now()}`,
          label,
          category: miscTodoCategory,
          done: false,
          createdAt: Date.now(),
          completedAt: null
        },
        ...(current.miscTodos ?? [])
      ]
    }));

    setMiscTodoInput("");
  };

  const updateMiscTodo = (todoId, updates) => {
    commitState((current) => ({
      ...current,
      miscTodos: (current.miscTodos ?? []).map((item) =>
        item.id === todoId ? { ...item, ...updates } : item
      )
    }));
  };

  const toggleMiscTodo = (todoId) => {
    const currentTodo = miscTodoItems.find((item) => item.id === todoId);
    if (!currentTodo) return;

    updateMiscTodo(todoId, {
      done: !currentTodo.done,
      completedAt: currentTodo.done ? null : Date.now()
    });
  };

  const deleteMiscTodo = (todoId) => {
    commitState((current) => ({
      ...current,
      miscTodos: (current.miscTodos ?? []).filter((item) => item.id !== todoId)
    }));
  };

  const setFocusTypeState = (nextType) => {
    if (!FOCUS_DURATION_OPTIONS[nextType]) return;
    const nextDuration = FOCUS_DURATION_OPTIONS[nextType][0];
    setFocusType(nextType);
    setFocusTask(null);
    setFocusStatus("idle");
    setFocusDurationMinutes(nextDuration);
    setFocusRemainingSeconds(nextDuration * 60);
    setFocusStartedAt(null);
  };

  const startFocusSession = () => {
    if (!focusType) return;
    setFocusStatus("running");
    setFocusStartedAt(Date.now());
  };

  const pauseFocusSession = () => {
    setFocusStatus("paused");
  };

  const resumeFocusSession = () => {
    setFocusStatus("running");
  };

  const stopFocusSession = () => {
    setFocusStatus("idle");
    setFocusRemainingSeconds(focusDurationMinutes * 60);
    setFocusStartedAt(null);
  };

  const recordFocusSession = () => {
    if (!focusType) return;

    commitState((current) => {
      const dateKey = todayKey;
      const focusLogId = `focus-session:${Date.now()}`;
      const sessionsToday = (current.focusSessions ?? []).filter((session) => formatDateKey(new Date(session.timestamp)) === dateKey).length;
      const streakCount = sessionsToday + 1;
      const streakBonusPct = streakCount >= 4 ? 30 : streakCount === 3 ? 20 : streakCount === 2 ? 10 : 0;
      const typeMultiplier = focusType === "work" ? 1.2 : focusType === "study" ? 1 : 0.8;
      const taskMultiplier = focusTask ? 1.2 : 1;
      const streakMultiplier = 1 + streakBonusPct / 100;
      const breakBonus = focusType === "life" && !focusTask ? 2 : 0;
      const xpEarned = Math.round(10 * typeMultiplier * taskMultiplier * streakMultiplier) + breakBonus;
      const dayWithoutCurrent = getTodayXP(current.logs, dateKey);
      const nextDayXP = dayWithoutCurrent + xpEarned;
      const linkedTaskId = focusTask?.logTaskId ?? "";
      const linkedTaskRecord = linkedTaskId ? current.logs?.[dateKey]?.[linkedTaskId] ?? null : null;

      return {
        ...current,
        profile: {
          ...current.profile,
          totalXP: Number(current.profile.totalXP ?? 0) + xpEarned,
          pbXP: Math.max(current.profile.pbXP, nextDayXP)
        },
        logs: {
          ...current.logs,
          [dateKey]: {
            ...(current.logs?.[dateKey] ?? {}),
            ...(linkedTaskId
              ? {
                  [linkedTaskId]: {
                    ...(linkedTaskRecord ?? {}),
                    value: linkedTaskRecord?.value ?? 0,
                    xp: linkedTaskRecord?.xp ?? 0,
                    ts: linkedTaskRecord?.ts ?? Date.now(),
                    focusXp: Number(linkedTaskRecord?.focusXp ?? 0) + xpEarned
                  }
                }
              : {}),
            [focusLogId]: {
              value: xpEarned,
              xp: xpEarned,
              ts: Date.now(),
              type: "focus-session"
            }
          }
        },
        focusSessions: [
          {
            id: `focus-${Date.now()}`,
            type: focusType,
            duration: focusDurationMinutes,
            taskId: focusTask?.taskId ?? "",
            taskLabel: focusTask?.label ?? "",
            sourceType: focusTask?.sourceType ?? "",
            projectId: focusTask?.projectId ?? "",
            xpEarned,
            streakBonusPct,
            breakBonus,
            timestamp: new Date().toISOString()
          },
          ...(current.focusSessions ?? [])
        ].slice(0, 100)
      };
    });
  };

  const finishFocusSession = () => {
    recordFocusSession();
    setFocusStatus("idle");
    setFocusRemainingSeconds(focusDurationMinutes * 60);
    setFocusStartedAt(null);
  };

  const startNextFocusSession = () => {
    recordFocusSession();
    setFocusStatus("running");
    setFocusRemainingSeconds(focusDurationMinutes * 60);
    setFocusStartedAt(Date.now());
  };

  const launchWorkFocus = (project, action) => {
    commitState((current) => ({
      ...current,
      focusPrefill: {
        type: "work",
        taskId: `work:${project.id}:${action.id}`,
        label: action.label,
        meta: project.name,
        sourceType: "work-todo",
        projectId: project.id,
        logTaskId: `${project.id}:${action.id}`
      }
    }));
    router.push("/focus");
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
    link.download = `lifeos-backup-${formatDateKey(new Date())}.json`;
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

  const triggerLifeQuickAction = (label, dateKey = todayKey) => {
    setLifeQuickAction(label);
    const quickActionId = `life-quick:${label.toLowerCase().replace(/\s+/g, "-")}`;
    setState((current) => {
      const next = touchState(
        applyTrackedLogAtDate(
          current,
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

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}

      return next;
    });
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

  const dashboardTasks = useMemo(() => {
    const workTasks = state.workProjects.flatMap((project) =>
      project.todayActions
        .filter((action) => !Boolean(getLogValue(state.logs, todayKey, `${project.id}:${action.id}`)))
        .map((action) => ({
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
      .map((task) => ({
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
      .filter((task) => !["sleep-quality", "stress-level", "risky-substances"].includes(task.id))
      .filter((task) => Number(getLogValue(state.logs, todayKey, task.id) ?? 0) <= 0)
      .map((task) => ({
        id: `life:${task.id}`,
        sourceType: "tracked-task",
        sourceId: task.id,
        projectId: "",
        label: task.label,
        category: "Life",
        context: task.id === "social-connection" ? "Connection" : "Daily upkeep",
        xpReward: Math.round((task.presets?.[0] ?? 1) * task.xpPerUnit),
        completionValue: task.presets?.[0] ?? 1,
        task,
        attributeKey: task.id === "social-connection" ? "social" : task.id === "meditation" ? "mind" : "body",
        attributeDelta: task.id === "social-connection" ? 2 : 1
      }));

    return [...workTasks, ...studyExecutionTasks, ...actionableLifeTasks];
  }, [state.logs, state.workProjects, todayKey]);

  const mainTask =
    dashboardTasks.find((task) => task.id === state.execution.mainTaskId) ??
    dashboardTasks[0] ??
    null;

  const activeExecutionTask =
    dashboardTasks.find((task) => task.id === state.execution.currentTaskId) ??
    (state.execution.currentTaskId
      ? {
          id: state.execution.currentTaskId,
          label: state.execution.currentTaskLabel,
          category: state.execution.currentCategory,
          context: "",
          xpReward: state.execution.xpReward,
          attributeKey: state.execution.attributeKey,
          attributeDelta: state.execution.attributeDelta,
          sourceType: state.execution.sourceType,
          sourceId: state.execution.sourceId,
          projectId: state.execution.projectId
        }
      : null);

  const executionElapsedMs =
    state.execution.elapsedMs +
    (state.execution.status === "active" && state.execution.startTime ? Math.max(0, executionNow - new Date(state.execution.startTime).getTime()) : 0);

  const executionMinutes = Math.floor(executionElapsedMs / 60000);
  const executionSeconds = Math.floor((executionElapsedMs % 60000) / 1000);
  const formattedExecutionTime = `${String(executionMinutes).padStart(2, "0")}:${String(executionSeconds).padStart(2, "0")}`;

  const pageMeta = {
    dashboard: {
      title: "Dashboard",
      description: "A compact operating view for your timeline, targets, streaks, and momentum."
    },
    focus: {
      title: "Focus",
      description: "Choose a lane, optionally bind a task, and move straight into a calm execution session."
    },
    work: {
      title: "Work",
      description: "Project-based execution. Keep today clear, but retain the long game."
    },
    todo: {
      title: "Todo",
      description: "Capture loose tasks, tag them to Work, Study, or Life, and clear them without cluttering your fixed systems."
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
    history: {
      title: "History",
      description: "Review today’s full record first, then scan the previous six days of logged execution."
    },
    settings: {
      title: "Settings",
      description: "Adjust your profile, timeline assumptions, and annual target without cluttering the dashboard."
    },
    "study-room": {
      title: "Study Room",
      description: "A calmer floorplan for picking a seat, settling in, and starting focused study."
    },
    "office-room": {
      title: "Office",
      description: "A focused room mockup for deep work, project momentum, and daily execution."
    }
  }[view];

  const activePath = pathname === "/" ? "/dashboard" : pathname;
  const activeOfficeZone = OFFICE_ZONES.find((zone) => zone.id === officePresence.zoneId) ?? OFFICE_ZONES[0];
  const activeStudyZone = STUDY_ROOM_ZONES.find((zone) => zone.id === studyPresence.zoneId) ?? STUDY_ROOM_ZONES[0];

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

  const moveToStudySeat = (zoneId, seat) => {
    setStudyPresence((current) => ({
      ...current,
      zoneId,
      seatId: seat.id
    }));
  };

  const setStudyMode = (mode) => {
    setStudyPresence((current) => ({
      ...current,
      mode
    }));
  };

  const startExecution = (task) => {
    commitState((current) => ({
      ...current,
      execution: {
        ...current.execution,
        status: "active",
        currentTaskId: task.id,
        currentTaskLabel: task.label,
        currentCategory: task.category,
        sourceType: task.sourceType,
        sourceId: task.sourceId,
        projectId: task.projectId ?? "",
        startTime: new Date().toISOString(),
        elapsedMs: current.execution.currentTaskId === task.id ? current.execution.elapsedMs : 0,
        xpReward: task.xpReward ?? 0,
        attributeKey: task.attributeKey ?? "",
        attributeDelta: task.attributeDelta ?? 0,
        mainTaskId: current.execution.mainTaskId || task.id
      }
    }));
  };

  const toggleExecutionPause = () => {
    if (!state.execution.currentTaskId) return;
    if (state.execution.status === "active") {
      const nextElapsed =
        state.execution.elapsedMs +
        (state.execution.startTime ? Math.max(0, Date.now() - new Date(state.execution.startTime).getTime()) : 0);
      commitState((current) => ({
        ...current,
        execution: {
          ...current.execution,
          status: "paused",
          startTime: null,
          elapsedMs: nextElapsed
        }
      }));
      return;
    }

    commitState((current) => ({
      ...current,
      execution: {
        ...current.execution,
        status: "active",
        startTime: new Date().toISOString()
      }
    }));
  };

  const completeExecution = () => {
    if (!activeExecutionTask) return;

    commitState((current) => {
      let next = current;

      if (activeExecutionTask.sourceType === "work-todo") {
        next = applyTrackedLog(
          next,
          {
            id: `${activeExecutionTask.projectId}:${activeExecutionTask.sourceId}`,
            type: "boolean",
            xpPerUnit: activeExecutionTask.xpReward || 10
          },
          true
        );
      }

      if (activeExecutionTask.sourceType === "tracked-task") {
        const sourceTask =
          activeExecutionTask.category === "Study"
            ? studyTasks.find((task) => task.id === activeExecutionTask.sourceId)
            : lifeGroups.flatMap((group) => group.items).find((task) => task.id === activeExecutionTask.sourceId);

        if (sourceTask) {
          next = applyTrackedLog(next, sourceTask, activeExecutionTask.completionValue ?? sourceTask.presets?.[0] ?? true);
        }
      }

      return {
        ...next,
        attributes: {
          ...next.attributes,
          [activeExecutionTask.attributeKey || "mind"]:
            Number(next.attributes?.[activeExecutionTask.attributeKey || "mind"] ?? 0) + Number(activeExecutionTask.attributeDelta ?? 0)
        },
        execution: {
          ...DEFAULT_STATE.execution,
          mainTaskId: current.execution.mainTaskId
        }
      };
    });
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
        {navItems.map((item) => {
          const isRooms = item.href === "/rooms";
          const isActive = isRooms
            ? activePath.startsWith("/rooms/")
            : activePath === item.href;

          if (item.children) {
            return (
              <div
                key={item.href}
                className={`nav-group ${isActive ? "is-active" : ""}`}
                style={
                  openNavMenu === "rooms"
                    ? {
                        "--nav-dropdown-top": `${roomsMenuPosition.top}px`,
                        "--nav-dropdown-left": `${roomsMenuPosition.left}px`
                      }
                    : undefined
                }
              >
                <button
                  ref={roomsTriggerRef}
                  type="button"
                  className={`nav-link nav-summary ${isActive ? "is-active" : ""}`}
                  onClick={() => setOpenNavMenu((current) => (current === "rooms" ? "" : "rooms"))}
                >
                  <span>{item.label}</span>
                  <ChevronDown size={14} />
                </button>
                {openNavMenu === "rooms" ? (
                  <div ref={roomsDropdownRef} className="nav-dropdown">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`nav-dropdown-link ${activePath === child.href ? "is-active" : ""}`}
                        onClick={() => setOpenNavMenu("")}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={`nav-link ${isActive ? "is-active" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {view !== "dashboard" && view !== "focus" && state.execution.currentTaskId ? (
        <section className="execution-active-panel">
          <div className="execution-active-copy">
            <p className="eyebrow">Execution State</p>
            <h2>{activeExecutionTask?.label || state.execution.currentTaskLabel}</h2>
            <div className="execution-meta">
              <span>{activeExecutionTask?.category || state.execution.currentCategory}</span>
              <span>Time {formattedExecutionTime}</span>
              <span>+{activeExecutionTask?.xpReward || state.execution.xpReward} XP</span>
              {activeExecutionTask?.attributeKey ? (
                <span>
                  +{activeExecutionTask.attributeDelta} {ATTRIBUTE_LABELS[activeExecutionTask.attributeKey]}
                </span>
              ) : null}
            </div>
          </div>
          <div className="execution-active-actions">
            <button className="ghost-button" onClick={toggleExecutionPause}>
              {state.execution.status === "active" ? <Pause size={16} /> : <Play size={16} />}
              {state.execution.status === "active" ? "Pause" : "Resume"}
            </button>
            <button className="ghost-button execution-complete-button" onClick={completeExecution}>
              <CheckCircle2 size={16} />
              Complete
            </button>
          </div>
        </section>
      ) : null}

      {view === "dashboard" ? (
        <>
          <section className="execution-layout">
            <div className="execution-layout-primary">
              <section className="execution-entry">
                <div className="execution-main-card">
                  <div className="execution-main-copy">
                    <p className="eyebrow">Main Quest Today</p>
                    <h2>{mainTask ? mainTask.label : "No priority task yet"}</h2>
                    <p className="muted">
                      {mainTask
                        ? `${mainTask.category} · ${mainTask.context} · +${mainTask.xpReward} XP`
                        : "Add a work todo or keep logging study and life tasks to create a clearer daily quest."}
                    </p>
                  </div>
                  {mainTask ? (
                    <button className="ghost-button execution-start-button" onClick={() => startExecution(mainTask)}>
                      <Play size={16} />
                      Start
                    </button>
                  ) : null}
                </div>

                <div className="execution-side-list">
                  <div className="execution-section-head">
                    <p className="eyebrow">Side Tasks</p>
                    <span className="muted">{Math.max(0, dashboardTasks.length - (mainTask ? 1 : 0))} remaining</span>
                  </div>
                  <div className="execution-queue">
                    {dashboardTasks.filter((task) => task.id !== mainTask?.id).slice(0, 8).map((task) => (
                      <article key={task.id} className="execution-task-card">
                        <div className="execution-task-copy">
                          <span className="execution-task-category">{task.category}</span>
                          <strong>{task.label}</strong>
                          <small>
                            {task.context} · +{task.xpReward} XP · +{task.attributeDelta} {ATTRIBUTE_LABELS[task.attributeKey]}
                          </small>
                        </div>
                        <div className="execution-task-actions">
                          <button className="ghost-button" onClick={() => startExecution(task)}>
                            <Play size={16} />
                            Start
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <aside className="execution-layout-secondary dashboard-support-rail">
              <Card title="Life Timeline" icon={Timer} className="card-timeline dashboard-rail-card">
                <div className="timeline-track">
                  <span style={{ width: `${lifeUsedRatio * 100}%` }} />
                </div>
                <CompactStatGrid
                  columns={3}
                  items={[
                    { label: "Life Used", value: `${Math.round(lifeUsedRatio * 100)}%` },
                    { label: "Days Left", value: formatNumber(daysLeft) },
                    { label: "To Retirement", value: `${yearsToRetirement} yrs` }
                  ]}
                />
              </Card>

              <Card title="Year Goal" icon={CircleDollarSign} className="card-year-goal dashboard-rail-card">
                <div className="metric-row">
                  <span className="muted">Year Goal</span>
                  <strong>
                    {state.profile.currency}
                    {formatNumber(state.profile.yearGoal)}
                  </strong>
                </div>
                <div className="timeline-track">
                  <span style={{ width: `${income.progress * 100}%` }} />
                </div>
                <CompactStatGrid
                  columns={3}
                  items={[
                    { label: "Daily Target", value: `${state.profile.currency}${formatNumber(income.dailyTarget)}` },
                    { label: "Monthly Target", value: `${state.profile.currency}${formatNumber(income.monthlyTarget)}` },
                    { label: "Should Be At", value: `${state.profile.currency}${formatNumber(income.shouldHaveMade)}` }
                  ]}
                />
              </Card>

              <Card title="Personal Best" icon={Gem} className="card-pb dashboard-rail-card">
                <div className="metric-row">
                  <span className="muted">Today XP</span>
                  <strong>{formatNumber(todayXP)} XP</strong>
                </div>
                <div className="progress-track is-gold">
                  <span style={{ width: `${Math.min(pbRatio, 1) * 100}%` }} />
                </div>
                <CompactStatGrid
                  columns={3}
                  items={[
                    { label: "PB XP", value: `${formatNumber(state.profile.pbXP || 0)} XP` },
                    { label: "Tasks Done", value: formatNumber(todayCompletedCount) },
                    { label: "Status", value: allHabitsDone ? "Clean day" : "In progress" }
                  ]}
                />
              </Card>

              <Card title="Core Streaks" icon={Flame} className="card-streaks dashboard-rail-card">
                <div className="streak-widget">
                  {coreStreaks.map((item) => (
                    <StreakMini key={item.label} label={item.label} history={item.history} streak={item.streak} />
                  ))}
                </div>
              </Card>

              <Card title="Life Pillars" icon={Sparkles} className="card-pillars dashboard-rail-card">
                <div className="pillars-grid">
                  {pillarCompletion.map((pillar) => {
                    const Icon = pillarIcons[pillar.id];
                    return (
                      <div
                        key={pillar.id}
                        className={`pillar-hex ${pillar.done ? "is-done" : ""}`}
                        style={{ "--pillar-color": pillar.color }}
                      >
                        <Icon size={18} className="pillar-icon" />
                        <span>{pillar.short}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <div className="dashboard-feedback-rail">
                <Card title="Current Task" icon={Play} className="dashboard-rail-card dashboard-feedback-card-frame">
                  {activeExecutionTask ? (
                    <div className="execution-feedback-stack">
                      <h3>{activeExecutionTask.label}</h3>
                      <div className="execution-stat-row">
                        <span>Status</span>
                        <strong>{state.execution.status === "paused" ? "Paused" : "Active"}</strong>
                      </div>
                      <div className="execution-stat-row">
                        <span>Timer</span>
                        <strong>{formattedExecutionTime}</strong>
                      </div>
                      <div className="execution-stat-row">
                        <span>Reward</span>
                        <strong>+{activeExecutionTask.xpReward} XP</strong>
                      </div>
                      <div className="execution-feedback-actions">
                        <button className="ghost-button" onClick={toggleExecutionPause}>
                          {state.execution.status === "active" ? <Pause size={16} /> : <Play size={16} />}
                          {state.execution.status === "active" ? "Pause" : "Resume"}
                        </button>
                        <button className="ghost-button execution-complete-button" onClick={completeExecution}>
                          <CheckCircle2 size={16} />
                          Complete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="execution-feedback-stack">
                      <h3>Idle</h3>
                      <p className="muted">No active task</p>
                    </div>
                  )}
                </Card>

                <Card title="Today Progress" icon={CheckCircle2} className="dashboard-rail-card dashboard-feedback-card-frame">
                  <CompactStatGrid
                    columns={1}
                    items={[
                      { label: "Tasks completed", value: formatNumber(todayCompletedCount) },
                      { label: "XP gained today", value: `${formatNumber(todayXP)} XP` }
                    ]}
                  />
                </Card>

                <Card title="Character State" icon={Gem} className="dashboard-rail-card dashboard-feedback-card-frame">
                  <div className="execution-feedback-stack">
                    <div className="execution-stat-row">
                      <span>Level</span>
                      <strong>{level.level}</strong>
                    </div>
                    <div className="execution-stat-row">
                      <span>XP Progress</span>
                      <strong>
                        {formatNumber(level.current)} / {formatNumber(level.needed)}
                      </strong>
                    </div>
                    <div className="progress-track execution-progress-track">
                      <span style={{ width: `${(level.current / level.needed) * 100}%` }} />
                    </div>
                  </div>
                </Card>
              </div>
            </aside>
          </section>
        </>
      ) : (
        <>
          {view === "focus" ? (
            <section className="focus-page-shell">
              <div className="focus-page-core">
                <div className="focus-type-selector">
                  {["work", "study", "life"].map((type) => (
                    <button
                      key={type}
                      className={`focus-type-chip ${focusType === type ? "is-active" : ""}`}
                      onClick={() => setFocusTypeState(type)}
                      disabled={focusStatus !== "idle"}
                    >
                      {type === "work" ? "Work" : type === "study" ? "Study" : "Life"}
                    </button>
                  ))}
                </div>

                <div className="focus-task-selector">
                  <div className="focus-task-copy">
                    <span className="eyebrow">Task</span>
                    <strong>{focusTask ? focusTask.label : "No task selected"}</strong>
                    <p className="muted">
                      {focusTask ? focusTask.meta : focusType ? "Optional. Start with a task or skip it." : "Select a type first."}
                    </p>
                  </div>
                  <div className="focus-task-actions">
                    <button
                      className="ghost-button"
                      onClick={() => setFocusTaskModalOpen(true)}
                      disabled={!focusType || focusStatus !== "idle"}
                    >
                      {focusTask ? "Change" : "Select Task"}
                    </button>
                    <button
                      className="ghost-button"
                      onClick={() => setFocusTask(null)}
                      disabled={!focusTask || focusStatus !== "idle"}
                    >
                      Skip
                    </button>
                  </div>
                </div>

                <div className="focus-timer-shell">
                  {focusAvailableDurations.length > 1 ? (
                    <div className="focus-duration-toggle">
                      {focusAvailableDurations.map((duration) => (
                        <button
                          key={duration}
                          className={`focus-duration-chip ${focusDurationMinutes === duration ? "is-active" : ""}`}
                          onClick={() => {
                            setFocusDurationMinutes(duration);
                            setFocusRemainingSeconds(duration * 60);
                            setFocusStatus("idle");
                          }}
                          disabled={focusStatus !== "idle"}
                        >
                          {duration} min
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="focus-timer-display">{formattedFocusTime}</div>
                  <p className="muted focus-status-text">
                    {focusStatus === "idle"
                      ? "Ready to start"
                      : focusStatus === "running"
                        ? "In session"
                        : focusStatus === "paused"
                          ? "Paused"
                        : "Session complete"}
                  </p>
                  {focusStatus === "completed" ? (
                    <div className="focus-completion-feedback">
                      <strong>+{focusRewardPreview.xpEarned} XP</strong>
                      <span>{focusRewardPreview.typeLabel} Focus Completed</span>
                      {focusRewardPreview.streakBonusPct > 0 ? <small>Streak +{focusRewardPreview.streakBonusPct}%</small> : null}
                      {focusRewardPreview.breakBonus > 0 ? <small>Break +{focusRewardPreview.breakBonus} XP</small> : null}
                    </div>
                  ) : null}
                </div>

                <div className="focus-controls">
                  {focusStatus === "idle" ? (
                    <button className="ghost-button focus-primary-button" onClick={startFocusSession} disabled={!focusType}>
                      <Play size={16} />
                      Start
                    </button>
                  ) : null}

                  {focusStatus === "running" ? (
                    <>
                      <button className="ghost-button" onClick={pauseFocusSession}>
                        <Pause size={16} />
                        Pause
                      </button>
                      <button className="ghost-button" onClick={stopFocusSession}>
                        Stop
                      </button>
                    </>
                  ) : null}

                  {focusStatus === "paused" ? (
                    <>
                      <button className="ghost-button" onClick={resumeFocusSession}>
                        <Play size={16} />
                        Resume
                      </button>
                      <button className="ghost-button" onClick={stopFocusSession}>
                        Stop
                      </button>
                    </>
                  ) : null}

                  {focusStatus === "completed" ? (
                    <>
                      <button className="ghost-button focus-primary-button" onClick={finishFocusSession}>
                        Done
                      </button>
                      <button className="ghost-button" onClick={startNextFocusSession}>
                        <Plus size={16} />
                        Start Next Session
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {focusTaskModalOpen ? (
                <div className="focus-task-modal-backdrop" onClick={() => setFocusTaskModalOpen(false)}>
                  <div className="focus-task-modal" onClick={(event) => event.stopPropagation()}>
                    <div className="focus-task-modal-head">
                      <div>
                        <p className="eyebrow">Select Task</p>
                        <h3>{focusType ? `${focusType[0].toUpperCase()}${focusType.slice(1)} tasks` : "Pick a type first"}</h3>
                      </div>
                      <button className="ghost-button" onClick={() => setFocusTaskModalOpen(false)}>
                        Close
                      </button>
                    </div>

                    <div className="focus-task-modal-list">
                      {(focusType ? focusTaskOptions[focusType] ?? [] : []).length ? (
                        (focusTaskOptions[focusType] ?? []).map((item) => (
                          <button
                            key={item.id}
                            className={`focus-task-option ${focusTask?.id === item.id ? "is-active" : ""}`}
                            onClick={() => {
                              setFocusTask(item);
                              setFocusTaskModalOpen(false);
                            }}
                          >
                            <strong>{item.label}</strong>
                            <span>{item.meta}</span>
                          </button>
                        ))
                      ) : (
                        <p className="muted">No available tasks for this type right now.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {view !== "focus" ? (
          <section className="module-page-intro">
            <p className="eyebrow">{pageMeta.title}</p>
            <h2>{pageMeta.title}</h2>
            <p className="muted">{pageMeta.description}</p>
          </section>
          ) : null}

          {view !== "focus" ? <section className="modules-grid modules-grid-single">
            {view === "todo" ? (
              <section className="life-page-layout">
                <div className="life-page-primary">
                  <ModuleCard title="Todo" color="#8892a0" icon={ListTodo}>
                    <div className="misc-todo-stack">
                      <div className="misc-todo-composer">
                        <select value={miscTodoCategory} onChange={(event) => setMiscTodoCategory(event.target.value)}>
                          <option value="work">Work</option>
                          <option value="study">Study</option>
                          <option value="life">Life</option>
                        </select>
                        <input
                          className="misc-todo-input"
                          value={miscTodoInput}
                          placeholder="Add a small loose task"
                          onChange={(event) => setMiscTodoInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") addMiscTodo();
                          }}
                        />
                        <button className="ghost-button" onClick={addMiscTodo}>
                          <Plus size={16} />
                          Add
                        </button>
                      </div>

                      <div className="misc-todo-grid">
                        {miscTodoItems.length ? (
                          miscTodoItems.map((item) => (
                            <article key={item.id} className={`misc-todo-card ${item.done ? "is-done" : ""}`}>
                              <div className="misc-todo-card-head">
                                <span className={`misc-todo-badge is-${item.category}`}>{item.category}</span>
                                <button className="misc-todo-delete" onClick={() => deleteMiscTodo(item.id)} aria-label="Delete todo">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                              <div className="misc-todo-card-main">
                                <input
                                  className="misc-todo-card-input"
                                  value={item.label}
                                  onChange={(event) => updateMiscTodo(item.id, { label: event.target.value })}
                                />
                                <button className={`ghost-button ${item.done ? "is-active" : ""}`} onClick={() => toggleMiscTodo(item.id)}>
                                  {item.done ? "Done" : "Mark"}
                                </button>
                              </div>
                            </article>
                          ))
                        ) : (
                          <div className="misc-todo-empty">
                            <p className="muted">Add a loose task, tag it to Work, Study, or Life, and clear it here.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </ModuleCard>
                </div>

                <aside className="life-page-secondary">
                  <div className="money-sidebar-stack">
                    <Card title="Today" icon={ListTodo} className="life-quick-card">
                      <div className="money-summary-grid">
                        <div className="money-summary-item">
                          <span>Total</span>
                          <strong>{formatNumber(miscTodoCounts.total)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Open</span>
                          <strong>{formatNumber(miscTodoCounts.open)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Done</span>
                          <strong>{formatNumber(miscTodoCounts.done)}</strong>
                        </div>
                      </div>
                    </Card>

                    <Card title="Categories" icon={Command} className="life-quick-card">
                      <div className="money-summary-grid">
                        <div className="money-summary-item">
                          <span>Work</span>
                          <strong>{formatNumber(miscTodoCounts.work)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Study</span>
                          <strong>{formatNumber(miscTodoCounts.study)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Life</span>
                          <strong>{formatNumber(miscTodoCounts.life)}</strong>
                        </div>
                      </div>
                    </Card>
                  </div>
                </aside>
              </section>
            ) : null}

            {view === "work" ? (
              <section className="life-page-layout">
                <div className="life-page-primary">
                  <ModuleCard title="Work" color={MODULE_COLORS.work} icon={BriefcaseBusiness}>
                    <div className="project-list project-list-split">
                      {state.workProjects.map((project) => (
                        <div key={project.id} className="project-column">
                          <div className="project-heading">
                            <strong>{WORK_PROJECT_SLOT_LABELS[project.id] ?? project.name}</strong>
                            <button
                              className="ghost-button"
                              onClick={() => setWorkActionModalProjectId(project.id)}
                              disabled={(project.todayActions ?? []).length >= 5}
                            >
                              <Plus size={16} />
                              Add
                            </button>
                          </div>
                          <div className="project-card">
                            <div className="project-subhead">
                              <span>Today</span>
                              <input
                                className="project-name-input"
                                value={project.name}
                                onChange={(event) => renameWorkProject(project.id, event.target.value)}
                                aria-label={`${project.name} project name`}
                              />
                              <small>{(project.todayActions ?? []).length} / 5</small>
                            </div>

                            <div className="work-action-list">
                              {(project.todayActions ?? []).length ? (
                                (project.todayActions ?? []).map((action) => {
                                  const done = Boolean(getLogValue(state.logs, todayKey, `${project.id}:${action.id}`));
                                  return (
                                    <article key={action.id} className={`work-action-card ${done ? "is-done" : ""}`}>
                                      <div className="work-action-copy">
                                        <div className="work-action-main">
                                          <input
                                            className="work-action-input"
                                            value={action.label}
                                            onChange={(event) => renameTodayAction(project.id, action.id, event.target.value)}
                                          />
                                          <button
                                            className="icon-button"
                                            aria-label="Delete action"
                                            onClick={() => deleteTodayAction(project.id, action.id)}
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="work-action-controls">
                                        <button className="ghost-button" onClick={() => launchWorkFocus(project, action)}>
                                          <Play size={16} />
                                          Start Focus
                                        </button>
                                        <label className="work-action-check">
                                          <input
                                            type="checkbox"
                                            checked={done}
                                            onChange={() => toggleTodo(project.id, action.id)}
                                          />
                                          <span>Complete</span>
                                        </label>
                                      </div>
                                    </article>
                                  );
                                })
                              ) : (
                                <div className="misc-todo-empty">
                                  <p className="muted">Pick up to 5 actions for today. Keep each one clear and finishable.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ModuleCard>
                </div>

                <aside className="life-page-secondary">
                  <div className="money-sidebar-stack">
                    <Card title="Today" icon={BriefcaseBusiness} className="life-quick-card">
                      <div className="money-summary-grid">
                        <div className="money-summary-item">
                          <span>Total Actions</span>
                          <strong>{formatNumber(workSidebarSummary.total)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Open</span>
                          <strong>{formatNumber(workSidebarSummary.open)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Done</span>
                          <strong>{formatNumber(workSidebarSummary.done)}</strong>
                        </div>
                      </div>
                    </Card>

                    <Card title="Projects" icon={Command} className="life-quick-card">
                      <div className="money-summary-grid">
                        {workSidebarSummary.projects.map((project) => (
                          <div key={project.id} className="money-summary-item">
                            <span>{project.label}</span>
                            <strong>
                              {formatNumber(project.total)} today · {formatNumber(project.backlog)} backlog
                            </strong>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </aside>

                {workActionModalProjectId ? (
                  <div className="focus-task-modal-backdrop" onClick={() => setWorkActionModalProjectId("")}>
                    <div className="focus-task-modal" onClick={(event) => event.stopPropagation()}>
                      <div className="focus-task-modal-head">
                        <div>
                          <p className="eyebrow">Today Actions</p>
                          <h3>
                            {state.workProjects.find((project) => project.id === workActionModalProjectId)?.name ?? "Project"}
                          </h3>
                        </div>
                        <button className="ghost-button" onClick={() => setWorkActionModalProjectId("")}>
                          Close
                        </button>
                      </div>

                      {(() => {
                        const activeProject = state.workProjects.find((project) => project.id === workActionModalProjectId);
                        if (!activeProject) return null;

                        return (
                          <div className="work-action-modal-stack">
                            {(activeProject.nextDayCandidates ?? []).length ? (
                              <div className="work-action-modal-section">
                                <span className="eyebrow">Next Day Candidates</span>
                                <div className="focus-task-modal-list">
                                  {(activeProject.nextDayCandidates ?? []).map((action) => (
                                    <button
                                      key={action.id}
                                      className="focus-task-option"
                                      onClick={() => {
                                        moveWorkActionToToday(activeProject.id, action, "candidate");
                                        setWorkActionModalProjectId("");
                                      }}
                                    >
                                      <strong>{action.label}</strong>
                                      <span>Carry over</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            <div className="work-action-modal-section">
                              <span className="eyebrow">Backlog</span>
                              <div className="focus-task-modal-list">
                                {(activeProject.backlog ?? []).length ? (
                                  (activeProject.backlog ?? []).map((action) => (
                                    <button
                                      key={action.id}
                                      className="focus-task-option"
                                      onClick={() => {
                                        moveWorkActionToToday(activeProject.id, action, "backlog");
                                        setWorkActionModalProjectId("");
                                      }}
                                    >
                                      <strong>{action.label}</strong>
                                      <span>Move into Today</span>
                                    </button>
                                  ))
                                ) : (
                                  <p className="muted">Backlog is empty right now.</p>
                                )}
                              </div>
                            </div>

                            <div className="work-action-modal-section">
                              <span className="eyebrow">Create New</span>
                              <div className="misc-todo-composer">
                                <input
                                  className="misc-todo-input"
                                  value={workActionDraft}
                                  placeholder="Create a new action for today"
                                  onChange={(event) => setWorkActionDraft(event.target.value)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") addWorkActionFromDraft(activeProject.id);
                                  }}
                                />
                                <button className="ghost-button" onClick={() => addWorkActionFromDraft(activeProject.id)}>
                                  <Plus size={16} />
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {view === "study" ? (
              <section className="life-page-layout">
                <div className="life-page-primary">
                  <ModuleCard title="Study" color={MODULE_COLORS.study} icon={GraduationCap}>
                    <LifeTaskGrid
                      tasks={studyTasks}
                      logs={state.logs}
                      todayKey={todayKey}
                      onLog={logTask}
                      defaultInputs={STUDY_DEFAULT_INPUTS}
                    />
                  </ModuleCard>
                </div>

                <aside className="life-page-secondary">
                  <div className="money-sidebar-stack">
                    <Card title="Today" icon={GraduationCap} className="life-quick-card">
                      <div className="money-summary-grid">
                        {todayStudySummary.map((item) => (
                          <div key={item.id} className="money-summary-item">
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card title="Yesterday" icon={GraduationCap} className="life-quick-card">
                      <div className="money-summary-grid">
                        {yesterdayStudySummary.map((item) => (
                          <div key={item.id} className="money-summary-item">
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </aside>
              </section>
            ) : null}

            {view === "life" ? (
              <section className="life-page-layout">
                <div className="life-page-primary">
                  <ModuleCard title="Life" color={MODULE_COLORS.life} icon={HeartPulse}>
                    <div className="money-log-stack">
                      <div className="money-log-toolbar">
                        <label className="money-log-date">
                          <span>Log Date</span>
                          <input
                            type="date"
                            value={lifeLogDate}
                            max={todayKey}
                            onChange={(event) => setLifeLogDate(event.target.value || todayKey)}
                          />
                        </label>
                        <div className="money-log-toolbar-actions">
                          <span className="muted money-log-helper">Cards below reflect the selected date.</span>
                          {lifeLogDate !== todayKey ? (
                            <button className="ghost-button" onClick={() => setLifeLogDate(todayKey)}>
                              Today
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <LifeTaskGrid
                        tasks={lifePageTasks}
                        logs={state.logs}
                        todayKey={lifeLogDate}
                        onLog={(task, value) => logTaskAtDate(task, value, lifeLogDate)}
                      />
                    </div>
                  </ModuleCard>
                </div>

                <aside className="life-page-secondary">
                  <Card title={lifeLogDate === todayKey ? "Today Actions" : "Logged Actions"} icon={History} className="life-quick-card">
                    {selectedLifeQuickActions.length ? (
                      <div className="life-today-actions">
                        {selectedLifeQuickActions.map((item) => (
                          <div key={item.id} className="life-today-action-pill">
                            <span className="life-today-action-group">{item.group}</span>
                            <strong>{item.label}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">No quick actions logged for this date yet.</p>
                    )}
                  </Card>

                  {LIFE_QUICK_ACTIONS.map((group) => (
                    <Card key={group.title} title={group.title} icon={Sparkle} className="life-quick-card">
                      <div className="life-quick-grid">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.label}
                              className={`life-quick-action ${lifeQuickAction === item.label ? "is-active" : ""}`}
                              onClick={() => triggerLifeQuickAction(item.label, lifeLogDate)}
                            >
                              <Icon size={15} />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                </aside>
              </section>
            ) : null}

            {view === "money" ? (
              <section className="life-page-layout">
                <div className="life-page-primary">
                  <ModuleCard title="Money" color={MODULE_COLORS.money} icon={CircleDollarSign}>
                    <div className="money-log-stack">
                      <div className="money-log-toolbar">
                        <label className="money-log-date">
                          <span>Log Date</span>
                          <input
                            type="date"
                            value={moneyLogDate}
                            max={todayKey}
                            onChange={(event) => setMoneyLogDate(event.target.value || todayKey)}
                          />
                        </label>
                        <div className="money-log-toolbar-actions">
                          <span className="muted money-log-helper">Cards below reflect the selected date.</span>
                          {moneyLogDate !== todayKey ? (
                            <button className="ghost-button" onClick={() => setMoneyLogDate(todayKey)}>
                              Today
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <LifeTaskGrid
                        tasks={moneyTasks}
                        logs={state.logs}
                        todayKey={moneyLogDate}
                        onLog={(task, value) => logTaskAtDate(task, value, moneyLogDate)}
                        currency={state.profile.currency}
                        defaultInputs={MONEY_DEFAULT_INPUTS}
                      />
                    </div>
                  </ModuleCard>
                </div>

                <aside className="life-page-secondary">
                  <div className="money-sidebar-stack">
                    <Card title="Today" icon={CircleDollarSign} className="life-quick-card">
                      <div className="money-summary-grid is-compact-four">
                        <div className="money-summary-item">
                          <span>Income</span>
                          <strong>{formatCurrencyValue(todayMoneySummary.income, state.profile.currency)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Expense</span>
                          <strong>{formatCurrencyValue(todayMoneySummary.expense, state.profile.currency)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Savings</span>
                          <strong>{formatCurrencyValue(todayMoneySummary.savings, state.profile.currency)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Investment</span>
                          <strong>{formatCurrencyValue(todayMoneySummary.investment, state.profile.currency)}</strong>
                        </div>
                      </div>
                    </Card>

                    <Card title="Yesterday" icon={CircleDollarSign} className="life-quick-card">
                      <div className="money-summary-grid is-compact-four">
                        <div className="money-summary-item">
                          <span>Income</span>
                          <strong>{formatCurrencyValue(yesterdayMoneySummary.income, state.profile.currency)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Expense</span>
                          <strong>{formatCurrencyValue(yesterdayMoneySummary.expense, state.profile.currency)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Savings</span>
                          <strong>{formatCurrencyValue(yesterdayMoneySummary.savings, state.profile.currency)}</strong>
                        </div>
                        <div className="money-summary-item">
                          <span>Investment</span>
                          <strong>{formatCurrencyValue(yesterdayMoneySummary.investment, state.profile.currency)}</strong>
                        </div>
                      </div>
                    </Card>
                  </div>
                </aside>
              </section>
            ) : null}

            {view === "history" ? (
              <ModuleCard title="History" color="#8892a0" icon={History}>
                <section className="history-page-layout">
                  <div className="history-page-primary">
                    <div className="history-content-grid">
                      <section className="history-featured-card">
                        <div className="history-day-head">
                          <div>
                            <p className="eyebrow">Today Snapshot</p>
                            <h2>{featuredHistoryDay.label}</h2>
                            <p className="muted">{featuredHistoryDay.dateKey}</p>
                          </div>
                          <div className="history-day-stats">
                            <div className="history-stat-chip">
                              <span>Entries</span>
                              <strong>{featuredHistoryDay.count}</strong>
                            </div>
                            <div className="history-stat-chip">
                              <span>XP</span>
                              <strong>{formatNumber(featuredHistoryDay.xp)} XP</strong>
                            </div>
                          </div>
                        </div>
                        {featuredHistoryDay.entries.length ? (
                          <div className="history-entry-grid">
                            {featuredHistoryDay.entries.map((entry) => (
                              <article key={`${featuredHistoryDay.key}-${entry.key}`} className="history-entry-card is-featured">
                                <div className="history-entry-top">
                                  <span className="history-entry-tag">{entry.category}</span>
                                  <strong>{entry.value}</strong>
                                </div>
                                <div className="history-entry-copy">
                                  <h3>{entry.label}</h3>
                                  {entry.meta ? <p className="muted">{entry.meta}</p> : null}
                                </div>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="history-empty-card">
                            <strong>No entries yet</strong>
                            <p className="muted">Start logging today and the full day record will appear here.</p>
                          </div>
                        )}
                      </section>

                      {previousHistoryDays.map((day) => (
                        <article key={day.key} className="history-day-card">
                          <div className="history-day-head">
                            <div>
                              <h3>{day.label}</h3>
                              <p className="muted">{day.dateKey}</p>
                            </div>
                            <div className="history-day-stats">
                              <div className="history-stat-chip">
                                <span>Entries</span>
                                <strong>{day.count}</strong>
                              </div>
                              <div className="history-stat-chip">
                                <span>XP</span>
                                <strong>{formatNumber(day.xp)} XP</strong>
                              </div>
                            </div>
                          </div>

                          {day.entries.length ? (
                            <div className="history-entry-list">
                              {day.entries.map((entry) => (
                                <div key={`${day.key}-${entry.key}`} className="history-entry-row">
                                  <div className="history-entry-inline">
                                    <span className="history-entry-tag">{entry.category}</span>
                                    <strong>{entry.label}</strong>
                                  </div>
                                  <span className="history-entry-value">{entry.value}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="muted">No tracked entries.</p>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>

                  <aside className="history-page-secondary">
                    <Card title="History Sidebar" icon={History} className="history-sidebar-card">
                      <div className="history-sidebar-placeholder">
                        <p className="muted">Reserved for future filters, summaries, and date tools.</p>
                      </div>
                    </Card>
                  </aside>
                </section>
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

            {view === "study-room" ? (
              <section className="room-shell">
                <div className="room-stage room-stage-study">
                  <div className="room-glow room-glow-left" />
                  <div className="room-glow room-glow-right" />
                  <div className="study-room-layout">
                    <div className="study-map-panel">
                      <div className="study-map-toolbar">
                        <div>
                          <span className="eyebrow">Study Room MVP</span>
                          <h3>Pick a seat, settle into a zone, and keep the commons more open.</h3>
                        </div>
                        <div className="study-status-pill">{studyPresence.mode}</div>
                      </div>

                      <div className="study-map-viewport">
                        <div className="study-map-hint">Drag to browse the floorplan on mobile.</div>
                        <div
                          className="study-map-surface"
                          style={{ "--study-map-width": `${STUDY_ROOM_MAP.width}px`, "--study-map-height": `${STUDY_ROOM_MAP.height}px` }}
                        >
                          <div className="study-hallway study-hallway-main" />
                          <div className="study-hallway study-hallway-inner" />
                          {STUDY_ROOM_ZONES.map((zone) => (
                            <section
                              key={zone.id}
                              className={`study-zone study-zone-${zone.id} ${studyPresence.zoneId === zone.id ? "is-active" : ""}`}
                              style={{
                                left: `${zone.x}px`,
                                top: `${zone.y}px`,
                                width: `${zone.width}px`,
                                height: `${zone.height}px`
                              }}
                            >
                              <div className="study-zone-label">
                                <strong>{zone.label}</strong>
                                <span>{zone.kind}</span>
                              </div>
                              <StudyZoneDecor zone={zone} />
                              {zone.seats.map((seat) => (
                                <button
                                  key={seat.id}
                                  className={`study-seat ${studyPresence.seatId === seat.id ? "is-selected" : ""}`}
                                  style={{ left: `${seat.x - zone.x - 24}px`, top: `${seat.y - zone.y - 18}px` }}
                                  onClick={() => moveToStudySeat(zone.id, seat)}
                                  aria-label={`${seat.id} seat`}
                                >
                                  <span>{seat.id}</span>
                                </button>
                              ))}
                            </section>
                          ))}
                          <div className="study-door study-door-entry" />
                          <div className="study-door study-door-quiet" />
                          <div className="study-door study-door-focus" />
                          <div className="study-door study-door-booth" />
                          <div className="study-door study-door-window" />
                          <div className="study-door study-door-commons" />
                        </div>
                      </div>
                    </div>

                    <aside className="study-side-panel">
                      <article className="study-info-card">
                        <span className="eyebrow">Selected Seat</span>
                        <h3>{studyPresence.seatId}</h3>
                        <p className="muted">
                          {activeStudyZone.label} · {activeStudyZone.kind}
                        </p>
                      </article>

                      <article className="study-info-card">
                        <span className="eyebrow">Mode</span>
                        <div className="preset-row">
                          {["Deep Focus", "Review", "Co-study", "Break"].map((mode) => (
                            <button key={mode} className={`chip ${studyPresence.mode === mode ? "is-active" : ""}`} onClick={() => setStudyMode(mode)}>
                              {mode}
                            </button>
                          ))}
                        </div>
                      </article>

                      <article className="study-info-card">
                        <span className="eyebrow">Why This Layout</span>
                        <ul className="room-list">
                          <li>Seat density is lower than the office prototype</li>
                          <li>The commons zone takes more area for breaks and reset</li>
                          <li>Booths and window seats support different study moods</li>
                          <li>The floorplan is simpler to scale into real seat booking later</li>
                        </ul>
                      </article>
                    </aside>
                  </div>
                </div>
              </section>
            ) : null}
          </section> : null}
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

function StudyZoneDecor({ zone }) {
  if (zone.id === "quiet-zone" || zone.id === "focus-zone") {
    return (
      <>
        <div className="study-furniture desk-row" style={{ left: 48, top: 58, width: zone.width - 96 }} />
        <div className="study-furniture desk-row" style={{ left: 48, top: 142, width: zone.width - 96 }} />
        <div className="study-furniture aisle-strip" style={{ left: 26, top: zone.height - 48, width: zone.width - 52 }} />
      </>
    );
  }

  if (zone.id === "booth-zone") {
    return (
      <>
        <div className="study-furniture booth-wall" style={{ left: 24, top: 56, width: 64, height: 62 }} />
        <div className="study-furniture booth-wall" style={{ left: 116, top: 56, width: 64, height: 62 }} />
        <div className="study-furniture booth-wall" style={{ left: 24, top: 146, width: 64, height: 62 }} />
        <div className="study-furniture booth-wall" style={{ left: 116, top: 146, width: 64, height: 62 }} />
      </>
    );
  }

  if (zone.id === "window-zone") {
    return (
      <>
        <div className="study-furniture window-strip" style={{ left: 28, top: 46, width: zone.width - 56 }} />
        <div className="study-furniture lounge-bench" style={{ left: 34, top: 146, width: zone.width - 68 }} />
        <div className="study-furniture plant-pot" style={{ left: zone.width - 56, top: 182 }} />
      </>
    );
  }

  if (zone.id === "commons") {
    return (
      <>
        <div className="study-furniture snack-counter" style={{ left: 24, top: 48, width: 74 }} />
        <div className="study-furniture tea-counter" style={{ left: 116, top: 48, width: 74 }} />
        <div className="study-furniture locker-wall" style={{ left: 24, top: 150, width: 42, height: 122 }} />
        <div className="study-furniture commons-sofa" style={{ left: 92, top: 214, width: 90 }} />
        <div className="study-furniture commons-rug" style={{ left: 38, top: 318, width: 148 }} />
        <div className="study-furniture round-table" style={{ left: 54, top: 360 }} />
        <div className="study-furniture round-table" style={{ left: 126, top: 390 }} />
        <div className="study-furniture plant-pot" style={{ left: 166, top: 328 }} />
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
                <span className="task-value">{formatTaskValue(task, value, currency)}</span>
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

function LifeTaskGrid({ tasks, logs, todayKey, onLog, currency, showStreaks = false, defaultInputs = LIFE_DEFAULT_INPUTS }) {
  const [customValues, setCustomValues] = useState({});

  return (
    <div className="life-task-grid">
      {tasks.map((task) => {
        const value = getLogValue(logs, todayKey, task.id);
        const isRating = task.type === "rating" || task.type === "ratingReverse";
        const allowsNegative = Boolean(task.allowNegative);
        const allowsZero = Boolean(task.allowZero);
        const shouldShowStreak = showStreaks || task.id === "exercise" || task.id === "meditation";
        const shouldShowSleepHistory = task.id === "sleep-quality";
        const defaultInput = defaultInputs[task.id];
        const dropdownPresets = (task.presets ?? []).filter((preset) => preset !== defaultInput);
        const customValue = customValues[task.id] ?? "";

        return (
          <article key={task.id} className="life-task-card">
            <div className="life-task-head">
              <strong>{task.label}</strong>
              <span className="task-value">{formatTaskValue(task, value, currency)}</span>
            </div>

            {defaultInput ? (
              <div className="life-task-input-stack">
                <button className="chip life-task-default-chip" onClick={() => onLog(task, defaultInput)}>
                  {defaultInput}
                  {task.unit !== "$" ? task.unit : ""}
                </button>
                <select
                  className="life-task-select"
                  value=""
                  onChange={(event) => {
                    const rawValue = event.target.value;
                    if (rawValue === "") return;
                    const nextValue = Number(rawValue);
                    const canLog = allowsNegative ? (allowsZero ? !Number.isNaN(nextValue) : nextValue !== 0) : allowsZero ? nextValue >= 0 : nextValue > 0;
                    if (canLog) onLog(task, nextValue);
                  }}
                >
                  <option value="">More</option>
                  {dropdownPresets.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                      {task.unit !== "$" ? task.unit : ""}
                    </option>
                  ))}
                </select>
                <div className="life-task-custom-row">
                  <input
                    className="life-task-input"
                    inputMode="numeric"
                    type="number"
                    min={allowsNegative || allowsZero ? undefined : "0"}
                    placeholder={task.unit}
                    value={customValue}
                    onChange={(event) =>
                      setCustomValues((current) => ({
                        ...current,
                        [task.id]: event.target.value
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      if (customValue === "") return;
                      const nextValue = Number(customValue);
                      const canLog = allowsNegative ? (allowsZero ? !Number.isNaN(nextValue) : nextValue !== 0) : allowsZero ? nextValue >= 0 : nextValue > 0;
                      if (!canLog) return;
                      onLog(task, nextValue);
                      setCustomValues((current) => ({
                        ...current,
                        [task.id]: ""
                      }));
                    }}
                  />
                  <button
                    className="ghost-button life-task-custom-button"
                    onClick={() => {
                      if (customValue === "") return;
                      const nextValue = Number(customValue);
                      const canLog = allowsNegative ? (allowsZero ? !Number.isNaN(nextValue) : nextValue !== 0) : allowsZero ? nextValue >= 0 : nextValue > 0;
                      if (!canLog) return;
                      onLog(task, nextValue);
                      setCustomValues((current) => ({
                        ...current,
                        [task.id]: ""
                      }));
                    }}
                  >
                    Log
                  </button>
                </div>
              </div>
            ) : task.type !== "boolean" ? (
              <div className={`life-task-actions ${isRating ? "is-rating" : ""}`}>
                {task.presets?.map((preset) => (
                  <button key={preset} className="chip" onClick={() => onLog(task, preset)}>
                    {currency && task.unit === "$" ? currency : ""}
                    {preset}
                    {task.unit !== "$" ? task.unit : ""}
                  </button>
                ))}
              </div>
            ) : null}

            {isRating ? (
              <div className="life-task-actions is-rating">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button key={rating} className={`chip ${value === rating ? "is-active" : ""}`} onClick={() => onLog(task, rating)}>
                    {rating}★
                  </button>
                ))}
              </div>
            ) : null}

            {task.type === "boolean" ? (
              <button className={`boolean-log life-task-boolean ${value ? "is-active" : ""}`} onClick={() => onLog(task, !value)}>
                {value ? "✓ Clean" : "Log Clean Day"}
              </button>
            ) : null}

            {shouldShowStreak ? (
              <div className="streak-row">
                {getTaskHistory(logs, task.id).map((entry) => (
                  <span key={entry.key} className={entry.done ? "is-on" : ""} />
                ))}
                {getStreak(logs, task.id) >= 2 ? <em>🔥 {getStreak(logs, task.id)}</em> : null}
              </div>
            ) : null}

            {shouldShowSleepHistory ? (
              <div className="sleep-score-history" aria-label="Sleep score history for the last 14 days">
                {getSleepScoreHistory(logs, task.id, 14).map((entry) => (
                  <span key={entry.key} className={`sleep-score-dot ${entry.tone}`} title={`${entry.key}: ${entry.value ?? "No score"}`} />
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function getSleepScoreHistory(logs, taskId, days = 14) {
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - index - 1));
    const key = formatDateKey(date);
    const value = Number(logs?.[key]?.[taskId]?.value ?? 0);

    let tone = "is-empty";
    if (value > 0 && value <= 59) tone = "is-low";
    else if (value >= 60 && value <= 74) tone = "is-mid";
    else if (value >= 75 && value <= 84) tone = "is-good";
    else if (value >= 85) tone = "is-great";

    return {
      key,
      value: value > 0 ? value : null,
      tone
    };
  });
}

function formatTaskValue(task, value, currency) {
  if (task.type === "boolean") {
    return value ? "Clean" : "Pending";
  }

  if (task.unit === "$" && Number(value || 0) !== 0) {
    return formatCurrencyValue(Number(value || 0), currency);
  }

  const separator = task.compactUnit ? "" : " ";
  if (value) {
    return `${currency && task.unit === "$" ? currency : ""}${value}${task.unit !== "$" ? `${separator}${task.unit}` : ""}`;
  }

  return `0${task.unit !== "$" ? `${separator}${task.unit}` : ""}`;
}

function formatCurrencyValue(value, currency) {
  const numericValue = Number(value || 0);
  const absValue = formatNumber(Math.abs(numericValue));
  if (numericValue < 0) return `-${currency}${absValue}`;
  return `${currency}${absValue}`;
}

function TimelineMetric({ label, value }) {
  return (
    <div className="timeline-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CompactStatGrid({ items, columns = 3 }) {
  return (
    <div className="compact-stat-grid" style={{ "--compact-columns": columns }}>
      {items.map((item) => (
        <div key={item.label} className="compact-stat-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
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
