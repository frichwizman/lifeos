"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Archive,
  Armchair,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Command,
  CookingPot,
  Droplets,
  Flame,
  FileText,
  Footprints,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  History,
  Home,
  ListTodo,
  MessageCircle,
  MonitorPlay,
  MoonStar,
  Music4,
  Save,
  RefreshCw,
  Scale,
  Package,
  ShieldCheck,
  ShoppingBasket,
  Sparkle,
  Plus,
  Play,
  Phone,
  Pin,
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
  FOCUS_XP_V1,
  MODULE_COLORS,
  STORAGE_KEY,
  STRESS_LEVEL_OPTIONS,
  formatDateKey,
  formatNumber,
  formatStressLevelShortValue,
  formatStressLevelValue,
  getStressLevelOption,
  getLogValue,
  getStreak,
  getTaskHistory,
  getTodayKey,
  lifeGroups,
  generateSyncCode,
  mergeLifeOSLogs,
  migrateState,
  moneyTasks,
  pickMoneyLogs,
  studyTasks,
  touchState,
  createSyncPayload,
  writeBackupSnapshot,
  readBackups
} from "@/lib/lifeos-data";
import {
  addMiscTodo as addMiscTodoState,
  addNote,
  applyLifeTaskLogAtDate,
  applyTrackedLogAtDate,
  completeExecution as completeExecutionState,
  deleteMiscTodo as deleteMiscTodoState,
  deleteTodayAction as deleteTodayActionState,
  markSyncError,
  moveNoteToTodo as moveNoteToTodoState,
  moveWorkActionToToday as moveWorkActionToTodayState,
  recordFocusSession as recordFocusSessionState,
  renameTodayAction as renameTodayActionState,
  renameWorkProject as renameWorkProjectState,
  resetFocusPrefill,
  rolloverWorkProjectsForNewDay,
  setWorkFocusPrefill,
  startExecution as startExecutionState,
  toggleExecutionPause as toggleExecutionPauseState,
  toggleMiscTodo as toggleMiscTodoState,
  toggleWorkTodoLog,
  updateMiscTodo as updateMiscTodoState,
  updateNoteItem as updateNoteItemState,
  updateProfileField,
  convertNoteToDailyAction as convertNoteToDailyActionState,
  convertNoteToProject as convertNoteToProjectState
} from "@/lib/lifeos-actions";
import {
  applyLifeQuickActionWithPersistence,
  buildOfficeKeyboardMovePatch,
  buildOfficeSeatPatch,
  buildOfficeStatusPatch,
  buildOfficeZoneSyncPatch,
  buildBackupSaveResult,
  buildBackupCountPatch,
  buildExecutionNowPatch,
  buildLifeQuickActionPatch,
  buildNoteArchivePatch,
  buildNoteDraftPatch,
  buildNoteDraftTypePatch,
  buildNoteFilterPatch,
  buildNoteSelectionPatch,
  buildRoomsMenuClosePatch,
  buildRoomsMenuPositionPatch,
  buildRoomsMenuTogglePatch,
  buildSelectedNoteConsumedPatch,
  buildStudyModePatch,
  buildStudySeatPatch,
  buildSyncCodeInputPatch,
  buildSyncSuccessState,
  buildFocusCompletionPatch,
  buildFocusDurationSelectionPatch,
  buildFocusPausePatch,
  buildFocusPrefillPatch,
  buildFocusResetPatch,
  buildFocusStartPatch,
  buildFocusTypeSelectionPatch,
  buildTodoComposerCategoryPatch,
  buildTodoComposerInputPatch,
  buildTodoComposerResetPatch,
  buildWorkComposerClosePatch,
  buildWorkComposerControllers,
  buildWorkComposerDraftPatch,
  buildWorkComposerModalPatch,
  buildWorkPageControllers,
  buildWorkProjectActionControllers,
  getFocusTaskOptionsForType,
  prepareMiscTodoInput,
  prepareAnonymousSyncStart,
  prepareNoteSave,
  prepareProfileFieldUpdate,
  prepareSelectedNoteConversion,
  prepareWorkComposerSubmission,
  resolveAnonymousSyncRemoteState,
  resolveManualPullState,
  resolveOutboundSyncState,
  resolveRemoteRefreshState,
  shouldKeepRoomsMenuOpen
} from "@/lib/lifeos-local-helpers";
import {
  buildDashboardTasks,
  buildDashboardOverview,
  buildFocusTaskOptions,
  buildFocusViewModel,
  buildHistoryDays,
  buildLifePageTasks,
  buildMiscTodoCounts,
  buildMoneySummary,
  buildNoteCollections,
  buildSelectedLifeQuickActions,
  buildStudySummary,
  buildTaskMap,
  buildWorkPageViewModel,
  formatExecutionElapsedTime,
  getActiveExecutionTask,
  getMainDashboardTask,
  isMiscTodoDone
} from "@/lib/lifeos-selectors";
import { fetchMoneyLifeLogs, pushMoneyLifeLogs } from "@/lib/life-logs-client";
import { fetchSyncState, pushSyncState } from "@/lib/sync-client";
import { RoomsNavGroup } from "@/components/lifeos/rooms-nav-group";
import { NotesPageSection } from "@/components/lifeos/notes-page-section";
import type { CardShellProps, ModuleCardShellProps } from "@/components/lifeos/section-shell-types";
import {
  SettingsProfileSection,
  SettingsSyncSection,
  SettingsTargetsSection,
  SettingsTimelineSection
} from "@/components/lifeos/settings-sections";
import { WorkPageSection } from "@/components/lifeos/work-page-section";
import type {
  AuthStatus,
  AuthUser,
  DashboardTask,
  EditableProfileField,
  ExecutionLocalPatch,
  FocusLocalPatch,
  FocusSessionCompletion,
  FocusTaskOption,
  FocusTimerStatus,
  FocusType,
  LifeOSState,
  LifeOSLogs,
  LifeQuickActionLocalPatch,
  LogValue,
  MiscTodoCategory,
  MoneyLogSyncStatus,
  MiscTodoItem,
  NavMenuKey,
  NavMenuPosition,
  NavLocalPatch,
  NoteItem,
  NotesByTaskId,
  NoteLocalPatch,
  OfficePresenceState,
  OfficePresencePatch,
  StudyPresenceState,
  StudyPresencePatch,
  SyncLocalPatch,
  TaskHistoryEntry,
  TaskDefaultInputMap,
  TaskDraftInputMap,
  TodoComposerPatch,
  TrackedTaskDefinition,
  WorkAction,
  WorkPageControllers,
  WorkActionSource,
  WorkComposerPatch,
  WorkProject,
  WorkProjectSlotLabels
} from "@/lib/lifeos-types";

const pillarIcons = {
  exercise: Activity,
  "sleep-quality": MoonStar,
  "water-intake": Droplets,
  "stress-level": Sparkle,
  weight: Scale,
  "risky-substances": ShieldCheck,
  meditation: HeartPulse
};

const allDefaultTrackedTaskIds = [
  ...studyTasks.map((task) => task.id),
  ...lifeGroups.flatMap((group) => group.items.map((item) => item.id))
];

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/life", label: "Life" },
  { href: "/study", label: "Study" },
  { href: "/money", label: "Money" },
  { href: "/notes", label: "Notes" },
  { href: "/focus", label: "Focus" },
  { href: "/todo", label: "Todo" },
  {
    href: "/rooms",
    label: "Rooms",
    children: [
      { href: "/rooms/office", label: "Office" },
      { href: "/rooms/study", label: "Study Room" }
    ]
  },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" }
];

const ATTRIBUTE_LABELS = {
  mind: "Mind",
  body: "Body",
  wealth: "Wealth",
  social: "Social"
};

const WORK_PROJECT_SLOT_LABELS: WorkProjectSlotLabels = {
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

const SIMPLE_LIFE_LOG_TASK_IDS = new Set(["exercise", "meditation", "sleep-quality", "water-intake"]);

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

const NOTE_CARD_COLORS = ["#fdf3f3", "#fef5ea", "#fff8dc", "#f4f9e9", "#edf7ef", "#ebf7f6", "#edf5fb", "#eef2ff", "#f5efff", "#f3f5f7"];
const NOTE_TEXT_COLOR = "#111111";
const NOTE_SUBTEXT_COLOR = "#6b7280";
const UTILITY_MODULE_COLOR = "#213f95";
const NOTE_FILTERS = ["All", "Pinned", "Recent", "Archived"];
const NOTE_TYPES = ["Idea", "Temporary", "Draft", "Reference"];

const FOCUS_DURATION_OPTIONS = {
  work: [25],
  study: [25, 45],
  life: [15, 25]
};

const PAGE_META = {
  dashboard: {
    title: "Dashboard",
    description: "A compact operating view for your timeline, targets, streaks, and momentum."
  },
  focus: {
    title: "Focus",
    description: "Choose Work, Study, or Life, optionally bind a task, and earn most of your XP by finishing focused sessions."
  },
  work: {
    title: "Work",
    description: "Each project should carry 3-5 concrete executable actions for today, then hand off cleanly into Focus."
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
  notes: {
    title: "Notes",
    description: "Capture ideas, drafts, and temporary thoughts quickly, then move them into action when needed."
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
};

type LifeOSView = keyof typeof PAGE_META;

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

interface LifeOSAppProps {
  view?: LifeOSView;
}

export function LifeOSApp({ view = "dashboard" }: LifeOSAppProps) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [backupCount, setBackupCount] = useState(0);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [authEmailInput, setAuthEmailInput] = useState("");
  const [moneyLogSyncStatus, setMoneyLogSyncStatus] = useState<MoneyLogSyncStatus>("idle");
  const [openNavMenu, setOpenNavMenu] = useState<NavMenuKey>("");
  const [roomsMenuPosition, setRoomsMenuPosition] = useState<NavMenuPosition>({ top: 0, left: 12 });
  const [lifeQuickAction, setLifeQuickAction] = useState("");
  const [miscTodoInput, setMiscTodoInput] = useState("");
  const [miscTodoCategory, setMiscTodoCategory] = useState<MiscTodoCategory>("work");
  const [noteDraftTitle, setNoteDraftTitle] = useState("");
  const [noteDraftContent, setNoteDraftContent] = useState("");
  const [noteDraftType, setNoteDraftType] = useState("Draft");
  const [noteFilter, setNoteFilter] = useState("All");
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [focusType, setFocusType] = useState<FocusType>("");
  const [focusTask, setFocusTask] = useState<FocusTaskOption | null>(null);
  const [focusStatus, setFocusStatus] = useState<FocusTimerStatus>("idle");
  const [focusDurationMinutes, setFocusDurationMinutes] = useState(25);
  const [focusRemainingSeconds, setFocusRemainingSeconds] = useState(25 * 60);
  const [focusStartedAt, setFocusStartedAt] = useState<number | null>(null);
  const [focusEndsAt, setFocusEndsAt] = useState<number | null>(null);
  const [focusCompletion, setFocusCompletion] = useState<FocusSessionCompletion | null>(null);
  const [focusTaskModalOpen, setFocusTaskModalOpen] = useState(false);
  const [workActionModalProjectId, setWorkActionModalProjectId] = useState("");
  const [workActionDraft, setWorkActionDraft] = useState("");
  const [officePresence, setOfficePresence] = useState<OfficePresenceState>({
    x: 108,
    y: 138,
    zoneId: "open-desks",
    seatId: "open-1",
    status: "Working"
  });
  const [studyPresence, setStudyPresence] = useState<StudyPresenceState>({
    zoneId: "quiet-zone",
    seatId: "A3",
    mode: "Deep Focus"
  });
  const todayKey = getTodayKey();
  const pathname = usePathname();
  const router = useRouter();
  const pollingRef = useRef<number | undefined>(undefined);
  const pushTimeoutRef = useRef<number | undefined>(undefined);
  const moneyPushTimeoutRef = useRef<number | undefined>(undefined);
  const moneyPullUserRef = useRef<string>("");
  const officeMapRef = useRef<HTMLDivElement | null>(null);
  const roomsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const roomsDropdownRef = useRef<HTMLDivElement | null>(null);
  const noteContentRef = useRef<HTMLTextAreaElement | null>(null);
  const [executionNow, setExecutionNow] = useState(Date.now());
  const focusTimerRef = useRef<number | undefined>(undefined);
  const focusCompletionPendingRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const migrated = migrateState(JSON.parse(raw));
        setState(migrated);
        applySyncLocalPatch(buildSyncCodeInputPatch(migrated.sync.syncCode || ""));
      }
    } catch {}
    applySyncLocalPatch(buildBackupCountPatch(readBackups().length));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  useEffect(() => {
    let cancelled = false;

    const loadAuthSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store"
        });
        const payload = await response.json();
        if (cancelled) return;
        setAuthUser(payload.user ?? null);
        setAuthStatus(payload.user ? "signed-in" : "signed-out");
      } catch {
        if (cancelled) return;
        setAuthUser(null);
        setAuthStatus("error");
      }
    };

    loadAuthSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authUser?.id) return;
    setState((current) =>
      current.sync.userId === authUser.id
        ? current
        : {
            ...current,
            sync: {
              ...current.sync,
              userId: authUser.id
            }
          }
    );
  }, [authUser?.id]);

  useEffect(() => {
    if (!ready || !authUser?.id) return;
    if (moneyPullUserRef.current === authUser.id) return;
    moneyPullUserRef.current = authUser.id;

    let cancelled = false;

    const pullMoneyLogs = async () => {
      setMoneyLogSyncStatus("pulling");
      try {
        const remoteLogs = await fetchMoneyLifeLogs();
        if (cancelled) return;
        setState((current) => {
          const mergedLogs = mergeLifeOSLogs(current.logs, remoteLogs);
          if (JSON.stringify(mergedLogs) === JSON.stringify(current.logs)) return current;
          saveSafetyBackupSnapshot(current);
          return {
            ...current,
            logs: mergedLogs
          };
        });
        setMoneyLogSyncStatus("synced");
      } catch {
        if (!cancelled) setMoneyLogSyncStatus("error");
      }
    };

    pullMoneyLogs();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, ready]);

  useEffect(() => {
    if (!ready || !authUser?.id) return;
    const moneyLogs = pickMoneyLogs(state.logs);
    if (!Object.keys(moneyLogs).length) return;

    window.clearTimeout(moneyPushTimeoutRef.current);
    moneyPushTimeoutRef.current = window.setTimeout(async () => {
      setMoneyLogSyncStatus("pushing");
      try {
        await pushMoneyLifeLogs(moneyLogs);
        setMoneyLogSyncStatus("synced");
      } catch {
        setMoneyLogSyncStatus("error");
      }
    }, 800);

    return () => window.clearTimeout(moneyPushTimeoutRef.current);
  }, [authUser?.id, ready, state.logs]);

  useEffect(() => {
    if (view !== "office-room") return;

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) return;
      event.preventDefault();
      const step = event.shiftKey ? 24 : 16;
      applyOfficePresencePatch(
        buildOfficeKeyboardMovePatch({
          current: officePresence,
          key,
          step,
          width: OFFICE_MAP.width,
          height: OFFICE_MAP.height
        })
      );
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [officePresence, view]);

  useEffect(() => {
    if (view !== "office-room") return;
    applyOfficePresencePatch(buildOfficeZoneSyncPatch(officePresence, OFFICE_ZONES));
  }, [view, officePresence.x, officePresence.y, officePresence.zoneId, officePresence.seatId]);

  useEffect(() => {
    if (state.execution.status !== "active") return;
    const timer = window.setInterval(() => applyExecutionLocalPatch(buildExecutionNowPatch(Date.now())), 1000);
    return () => window.clearInterval(timer);
  }, [state.execution.status]);

  useEffect(() => {
    if (focusStatus !== "running" || !focusEndsAt) return;

    // Use an absolute deadline so backgrounded mobile tabs can catch up instantly.
    const syncFocusTimer = () => {
      const nextRemaining = Math.max(0, Math.ceil((focusEndsAt - Date.now()) / 1000));
      setFocusRemainingSeconds(nextRemaining);

      if (nextRemaining > 0 || focusCompletionPendingRef.current) return;

      focusCompletionPendingRef.current = true;
      window.clearInterval(focusTimerRef.current);
      window.setTimeout(() => {
        completeFocusSession();
      }, 0);
    };

    syncFocusTimer();
    focusTimerRef.current = window.setInterval(syncFocusTimer, 1000);
    document.addEventListener("visibilitychange", syncFocusTimer);
    window.addEventListener("focus", syncFocusTimer);

    return () => {
      window.clearInterval(focusTimerRef.current);
      document.removeEventListener("visibilitychange", syncFocusTimer);
      window.removeEventListener("focus", syncFocusTimer);
    };
  }, [focusEndsAt, focusStatus]);

  const lifeTaskMap = useMemo(() => buildTaskMap(lifeGroups.flatMap((group) => group.items)), []);
  const studyTaskMap = useMemo(() => buildTaskMap(studyTasks), []);
  const moneyTaskMap = useMemo(() => buildTaskMap(moneyTasks), []);
  const lifePageTasks = useMemo(() => buildLifePageTasks(lifeTaskMap), [lifeTaskMap]);

  const focusTaskOptions = useMemo(
    () => buildFocusTaskOptions(state, todayKey, lifePageTasks, studyTasks),
    [lifePageTasks, state, todayKey]
  );

  useEffect(() => {
    if (view !== "focus") return;
    if (!state.focusPrefill?.type) return;

    applyFocusLocalPatch(
      buildFocusPrefillPatch({
        prefillType: state.focusPrefill.type,
        prefillTaskId: state.focusPrefill.taskId,
        focusTaskOptions,
        durationOptions: FOCUS_DURATION_OPTIONS
      })
    );

    commitState((current) => resetFocusPrefill(current));
  }, [view, state.focusPrefill, focusTaskOptions]);

  useEffect(() => {
    if (openNavMenu !== "rooms") return;

    const updatePosition = () => {
      const trigger = roomsTriggerRef.current;
      if (!trigger) return;
      applyNavLocalPatch(buildRoomsMenuPositionPatch(trigger.getBoundingClientRect(), window.innerWidth));
    };

    const onPointerDown = (event: PointerEvent) => {
      const trigger = roomsTriggerRef.current;
      const dropdown = roomsDropdownRef.current;
      if (shouldKeepRoomsMenuOpen({ trigger, dropdown, target: event.target })) return;
      applyNavLocalPatch(buildRoomsMenuClosePatch());
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

    commitState((current) => rolloverWorkProjectsForNewDay(current, todayKey));
  }, [ready, state.workDayKey, todayKey]);

  useEffect(() => {
    if (!ready || state.sync.mode !== "anonymous" || !state.sync.syncCode) return;
    const hasUnsyncedChanges = state.sync.updatedAt > (state.sync.lastSyncedAt ?? "");
    if (!hasUnsyncedChanges) return;

    window.clearTimeout(pushTimeoutRef.current);
    pushTimeoutRef.current = window.setTimeout(async () => {
      try {
        const remoteSnapshot = await fetchSyncState(state.sync.syncCode);
        const outboundState = resolveOutboundSyncState(state, remoteSnapshot);
        const remoteState = await pushSyncState(state.sync.syncCode, createSyncPayload(outboundState));
        setState((current) =>
          buildSyncSuccessState(
            resolveOutboundSyncState(current, remoteState, state.sync.syncCode),
            remoteState?.sync?.lastSyncedAt ?? new Date().toISOString()
          )
        );
      } catch {
        setState((current) => markSyncError(current, "Sync push failed."));
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
        const nextState = resolveRemoteRefreshState(state, remoteState);
        if (nextState) {
          saveSafetyBackupSnapshot(state);
          setState(nextState);
        }
      } catch {
        setState((current) => markSyncError(current, "Sync pull failed."));
      }
    };

    poll();
    pollingRef.current = window.setInterval(poll, 5000);
    return () => window.clearInterval(pollingRef.current);
  }, [ready, state.sync.mode, state.sync.syncCode, state.sync.updatedAt]);

  useEffect(() => {
    if (!ready || state.sync.mode !== "anonymous" || !state.sync.syncCode) return;

    const refreshFromRemote = async () => {
      try {
        const remoteState = await fetchSyncState(state.sync.syncCode);
        if (!remoteState) return;
        const nextState = resolveRemoteRefreshState(state, remoteState);
        if (nextState) {
          saveSafetyBackupSnapshot(state);
          setState(nextState);
        }
      } catch {}
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshFromRemote();
      }
    };

    const onWindowFocus = () => refreshFromRemote();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [ready, state.sync.mode, state.sync.syncCode, state.sync.updatedAt]);

  const commitState = (updater: (current: LifeOSState) => LifeOSState) => {
    setState((current) => touchState(updater(current)));
  };

  const dashboardOverview = useMemo(() => buildDashboardOverview(state), [state]);
  const historyDays = useMemo(
    () =>
      buildHistoryDays({
        logs: state.logs,
        todayKey,
        workProjects: state.workProjects,
        studyTaskMap,
        lifeTaskMap,
        moneyTaskMap,
        currency: state.profile.currency,
        lifeQuickActionMap: LIFE_QUICK_ACTION_MAP
      }),
    [lifeTaskMap, moneyTaskMap, state.logs, state.profile.currency, state.workProjects, studyTaskMap, todayKey]
  );
  const featuredHistoryDay = historyDays[0];
  const previousHistoryDays = historyDays.slice(1);
  const selectedLifeQuickActions = useMemo(
    () => buildSelectedLifeQuickActions(state.logs, todayKey, LIFE_QUICK_ACTION_MAP),
    [state.logs, todayKey]
  );
  const yesterdayKey = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return formatDateKey(date);
  }, []);
  const todayMoneySummary = useMemo(
    () => buildMoneySummary(state.logs, todayKey),
    [state.logs, todayKey]
  );
  const yesterdayMoneySummary = useMemo(
    () => buildMoneySummary(state.logs, yesterdayKey),
    [state.logs, yesterdayKey]
  );
  const todayStudySummary = useMemo(
    () => buildStudySummary(state.logs, todayKey, studyTasks, (task, value) => formatTaskValue(task, value, state.profile.currency)),
    [state.logs, todayKey, state.profile.currency]
  );
  const yesterdayStudySummary = useMemo(
    () => buildStudySummary(state.logs, yesterdayKey, studyTasks, (task, value) => formatTaskValue(task, value, state.profile.currency)),
    [state.logs, yesterdayKey, state.profile.currency]
  );
  const miscTodoItems = state.miscTodos ?? [];
  const miscTodoCounts = useMemo(
    () => buildMiscTodoCounts(miscTodoItems, todayKey),
    [miscTodoItems, todayKey]
  );
  const noteItems = state.noteItems ?? [];
  const noteCollections = useMemo(() => buildNoteCollections(noteItems, noteFilter), [noteItems, noteFilter]);
  const sortedNoteItems = noteCollections.sorted;
  const filteredNoteItems = noteCollections.filtered;
  const selectedNote = noteItems.find((item) => item.id === selectedNoteId) ?? null;
  const selectedNoteConversion = useMemo(() => prepareSelectedNoteConversion(selectedNote), [selectedNote]);
  const noteCounts = noteCollections.counts;
  const workPageViewModel = useMemo(
    () =>
      buildWorkPageViewModel({
        state,
        todayKey,
        slotLabels: WORK_PROJECT_SLOT_LABELS,
        modalProjectId: workActionModalProjectId,
        draft: workActionDraft
      }),
    [state, todayKey, workActionDraft, workActionModalProjectId]
  );
  const focusAvailableDurations = focusType ? FOCUS_DURATION_OPTIONS[focusType] ?? [] : [];
  const focusSessionLocked = focusStatus === "running" || focusStatus === "paused";
  const activeFocusTaskOptions = useMemo(
    () => getFocusTaskOptionsForType(focusType, focusTaskOptions),
    [focusTaskOptions, focusType]
  );
  const focusViewModel = useMemo(
    () =>
      buildFocusViewModel({
        focusType,
        focusTask,
        focusTaskOptions,
        focusRemainingSeconds,
        focusSessions: state.focusSessions,
        todayKey
      }),
    [focusRemainingSeconds, focusTask, focusTaskOptions, focusType, state.focusSessions, todayKey]
  );

  const applyFocusLocalPatch = (patch?: FocusLocalPatch | null) => {
    if (!patch) return;
    if (patch.type !== undefined) setFocusType(patch.type);
    if (patch.task !== undefined) setFocusTask(patch.task);
    if (patch.status !== undefined) setFocusStatus(patch.status);
    if (patch.durationMinutes !== undefined) setFocusDurationMinutes(patch.durationMinutes);
    if (patch.remainingSeconds !== undefined) setFocusRemainingSeconds(patch.remainingSeconds);
    if (patch.startedAt !== undefined) setFocusStartedAt(patch.startedAt);
    if (patch.endsAt !== undefined) setFocusEndsAt(patch.endsAt);
    if (patch.completion !== undefined) setFocusCompletion(patch.completion);
    if (patch.taskModalOpen !== undefined) setFocusTaskModalOpen(patch.taskModalOpen);
    if (patch.completionPending !== undefined) focusCompletionPendingRef.current = patch.completionPending;
  };

  const applyNoteLocalPatch = (patch?: NoteLocalPatch | null) => {
    if (!patch) return;
    if (patch.draftTitle !== undefined) setNoteDraftTitle(patch.draftTitle);
    if (patch.draftContent !== undefined) setNoteDraftContent(patch.draftContent);
    if (patch.draftType !== undefined) setNoteDraftType(patch.draftType);
    if (patch.noteFilter !== undefined) setNoteFilter(patch.noteFilter);
    if (patch.selectedNoteId !== undefined) setSelectedNoteId(patch.selectedNoteId);
    if (patch.focusContent) {
      setTimeout(() => {
        noteContentRef.current?.focus();
      }, 0);
    }
  };

  const applyTodoComposerPatch = (patch?: TodoComposerPatch | null) => {
    if (!patch) return;
    if (patch.input !== undefined) setMiscTodoInput(patch.input);
    if (patch.category !== undefined) setMiscTodoCategory(patch.category);
  };

  const applySyncLocalPatch = (patch?: SyncLocalPatch | null) => {
    if (!patch) return;
    if (patch.syncCodeInput !== undefined) setSyncCodeInput(patch.syncCodeInput);
    if (patch.backupCount !== undefined) setBackupCount(patch.backupCount);
  };

  const saveSafetyBackupSnapshot = (snapshot: LifeOSState) => {
    const backups = writeBackupSnapshot(snapshot);
    applySyncLocalPatch(buildBackupCountPatch(backups.length));
  };

  const applyNavLocalPatch = (patch?: NavLocalPatch | null) => {
    if (!patch) return;
    if (patch.openMenu !== undefined) setOpenNavMenu(patch.openMenu);
    if (patch.roomsMenuPosition !== undefined) setRoomsMenuPosition(patch.roomsMenuPosition);
  };

  const applyLifeQuickActionLocalPatch = (patch?: LifeQuickActionLocalPatch | null) => {
    if (!patch) return;
    if (patch.activeLabel !== undefined) setLifeQuickAction(patch.activeLabel);
  };

  const applyExecutionLocalPatch = (patch?: ExecutionLocalPatch | null) => {
    if (!patch) return;
    if (patch.nowMs !== undefined) setExecutionNow(patch.nowMs);
  };

  const applyWorkComposerPatch = (patch?: WorkComposerPatch | null) => {
    if (!patch) return;
    if (patch.modalProjectId !== undefined) setWorkActionModalProjectId(patch.modalProjectId);
    if (patch.draft !== undefined) setWorkActionDraft(patch.draft);
  };

  const applyOfficePresencePatch = (patch?: OfficePresencePatch | null) => {
    if (!patch) return;
    setOfficePresence((current) => ({
      ...current,
      ...patch
    }));
  };

  const applyStudyPresencePatch = (patch?: StudyPresencePatch | null) => {
    if (!patch) return;
    setStudyPresence((current) => ({
      ...current,
      ...patch
    }));
  };

  const logTask = (task: TrackedTaskDefinition, value: LogValue) => {
    commitState((current) => applyTrackedLogAtDate(current, task, value, todayKey));
  };

  const logTaskAtDate = (task: TrackedTaskDefinition, value: LogValue, dateKey: string) => {
    commitState((current) => applyTrackedLogAtDate(current, task, value, dateKey));
  };

  const logLifeTaskAtDate = (
    task: TrackedTaskDefinition,
    value: LogValue,
    dateKey = todayKey,
    options: { accumulate?: boolean } = {}
  ) => {
    commitState((current) => applyLifeTaskLogAtDate(current, task, value, dateKey || todayKey, options));
  };

  const toggleTodo = (projectId: string, todoId: string) => {
    commitState((current) => toggleWorkTodoLog(current, projectId, todoId, todayKey));
  };

  const moveWorkActionToToday = (projectId: string, action: WorkAction, source: WorkActionSource = "backlog") => {
    commitState((current) => moveWorkActionToTodayState(current, projectId, action, source));
  };

  const addWorkActionFromDraft = (projectId: string) => {
    const nextSubmission = prepareWorkComposerSubmission(workActionDraft, Date.now());
    if (!nextSubmission) return;

    moveWorkActionToToday(
      projectId,
      nextSubmission.action,
      "new"
    );
    applyWorkComposerPatch(nextSubmission.patch);
  };

  const renameTodayAction = (projectId: string, actionId: string, label: string) => {
    commitState((current) => renameTodayActionState(current, projectId, actionId, label));
  };

  const deleteTodayAction = (projectId: string, actionId: string) => {
    commitState((current) => deleteTodayActionState(current, projectId, actionId, todayKey));
  };

  const renameWorkProject = (projectId: string, name: string) => {
    commitState((current) => renameWorkProjectState(current, projectId, name));
  };

  const addMiscTodo = () => {
    const nextTodo = prepareMiscTodoInput(miscTodoInput, miscTodoCategory);
    if (!nextTodo) return;

    commitState((current) => addMiscTodoState(current, nextTodo.label, nextTodo.category));
    applyTodoComposerPatch(buildTodoComposerResetPatch());
  };

  const updateMiscTodo = (todoId: string, updates: Partial<MiscTodoItem>) => {
    commitState((current) => updateMiscTodoState(current, todoId, updates));
  };

  const toggleMiscTodo = (todoId: string) => {
    commitState((current) => toggleMiscTodoState(current, todoId, todayKey));
  };

  const deleteMiscTodo = (todoId: string) => {
    commitState((current) => deleteMiscTodoState(current, todoId));
  };

  const saveNote = (overrides: Partial<Pick<NoteItem, "title" | "content" | "type">> = {}) => {
    const nextNote = prepareNoteSave({
      draft: {
        title: noteDraftTitle,
        content: noteDraftContent,
        type: noteDraftType
      },
      overrides,
      paletteSize: NOTE_CARD_COLORS.length,
      createdAt: new Date().toISOString()
    });
    if (!nextNote) return;

    commitState((current) => addNote(current, nextNote.input));
    applyNoteLocalPatch(nextNote.patch);
  };

  const focusNoteComposer = (nextType = "Draft") => {
    applyNoteLocalPatch(buildNoteDraftTypePatch(nextType, { focusContent: true }));
  };

  const updateNoteItem = (noteId: string, updater: Partial<NoteItem> | ((note: NoteItem) => Partial<NoteItem>)) => {
    commitState((current) => updateNoteItemState(current, noteId, updater, new Date().toISOString()));
  };

  const toggleNotePin = (noteId: string) => {
    updateNoteItem(noteId, (note) => ({ pinned: !note.pinned }));
  };

  const toggleNoteArchive = (noteId: string) => {
    updateNoteItem(noteId, (note) => ({ archived: !note.archived, pinned: note.archived ? note.pinned : false }));
    applyNoteLocalPatch(buildNoteArchivePatch(selectedNoteId, noteId));
  };

  const moveNoteToTodo = (category: MiscTodoCategory) => {
    if (!selectedNoteConversion) return;

    commitState((current) =>
      moveNoteToTodoState(current, selectedNoteConversion.noteId, selectedNoteConversion.label, category, new Date().toISOString())
    );
    applyNoteLocalPatch(buildSelectedNoteConsumedPatch());
  };

  const convertNoteToProject = () => {
    if (!selectedNoteConversion) return;

    commitState((current) =>
      convertNoteToProjectState(current, selectedNoteConversion.noteId, selectedNoteConversion.label, new Date().toISOString())
    );
    applyNoteLocalPatch(buildSelectedNoteConsumedPatch());
  };

  const convertNoteToDailyAction = () => {
    if (!selectedNoteConversion) return;

    commitState((current) =>
      convertNoteToDailyActionState(current, selectedNoteConversion.noteId, selectedNoteConversion.label, new Date().toISOString())
    );
    applyNoteLocalPatch(buildSelectedNoteConsumedPatch());
  };

  const clearFocusSessionState = ({ keepCompletion = false }: { keepCompletion?: boolean } = {}) => {
    applyFocusLocalPatch(buildFocusResetPatch(focusDurationMinutes, { keepCompletion }));
  };

  const setFocusTypeState = (nextType: FocusType) => {
    applyFocusLocalPatch(buildFocusTypeSelectionPatch(nextType, FOCUS_DURATION_OPTIONS));
  };

  const startFocusSession = () => {
    applyFocusLocalPatch(
      buildFocusStartPatch({
        focusType,
        focusStatus,
        focusRemainingSeconds,
        focusDurationMinutes,
        nowMs: Date.now()
      })
    );
  };

  const pauseFocusSession = () => {
    applyFocusLocalPatch(
      buildFocusPausePatch({
        focusStatus,
        focusEndsAt,
        focusRemainingSeconds,
        nowMs: Date.now()
      })
    );
  };

  const stopFocusSession = () => {
    clearFocusSessionState();
  };

  const recordFocusSession = () => {
    if (!focusType) return null;

    let sessionResult = null;
    commitState((current) => {
      const timestamp = new Date().toISOString();
      const mutation = recordFocusSessionState(current, {
        focusType,
        focusTask,
        focusDurationMinutes,
        todayKey,
        timestamp,
        focusLogId: `focus-session:${Date.now()}`,
        focusSessionId: `focus-${Date.now()}`
      });
      if (!mutation) return current;
      sessionResult = mutation.result;
      return mutation.state;
    });

    return sessionResult;
  };

  const completeFocusSession = () => {
    const sessionResult = recordFocusSession();
    if (!sessionResult) return;
    applyFocusLocalPatch(buildFocusCompletionPatch(sessionResult));
  };

  const launchWorkFocus = (project: WorkProject, action: WorkAction) => {
    clearFocusSessionState();
    commitState((current) => setWorkFocusPrefill(current, project, action));
    router.push("/focus");
  };

  const workProjectActions = buildWorkProjectActionControllers({
    renameProject: renameWorkProject,
    renameTodayAction,
    deleteTodayAction,
    launchFocus: launchWorkFocus,
    toggleTodo
  });

  const workComposerControls = buildWorkComposerControllers({
    open: (projectId: string) => applyWorkComposerPatch(buildWorkComposerModalPatch(projectId)),
    close: () => applyWorkComposerPatch(buildWorkComposerClosePatch()),
    updateDraft: (value: string) => applyWorkComposerPatch(buildWorkComposerDraftPatch(value)),
    moveActionToToday: moveWorkActionToToday,
    addDraftAction: addWorkActionFromDraft
  });

  const workPageControllers: WorkPageControllers = buildWorkPageControllers({
    projectActions: workProjectActions,
    composerControls: workComposerControls
  });

  const updateProfile = <Key extends EditableProfileField>(key: Key, value: LifeOSState["profile"][Key]) => {
    commitState((current) => updateProfileField(current, key, value));
  };

  const updateProfileFromInput = (key: EditableProfileField, rawValue: string) => {
    const nextField = prepareProfileFieldUpdate(key, rawValue);
    updateProfile(nextField.key, nextField.value);
  };

  const sendLoginLink = async () => {
    const email = authEmailInput.trim();
    if (!email) return;

    setAuthStatus("checking");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error("Unable to send login link.");
      setAuthStatus("signed-out");
    } catch {
      setAuthStatus("error");
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
    } finally {
      setAuthUser(null);
      setAuthStatus("signed-out");
      setMoneyLogSyncStatus("idle");
      moneyPullUserRef.current = "";
      setState((current) => ({
        ...current,
        sync: {
          ...current.sync,
          userId: null
        }
      }));
    }
  };

  const enableAnonymousSync = async (requestedCode = "") => {
    const start = prepareAnonymousSyncStart(state, requestedCode, generateSyncCode());
    setState(start.nextState);
    applySyncLocalPatch(start.patch);

    try {
      const remoteState = await fetchSyncState(start.code);
      if (remoteState) {
        const resolution = resolveAnonymousSyncRemoteState(start.nextState, remoteState, start.code);
        if (resolution.shouldPush) {
          const pushedState = await pushSyncState(start.code, createSyncPayload(resolution.nextState));
          setState(buildSyncSuccessState(resolution.nextState, pushedState?.sync?.lastSyncedAt ?? new Date().toISOString()));
        } else {
          setState(resolution.nextState);
        }
      } else {
        const pushedState = await pushSyncState(start.code, createSyncPayload(start.nextState));
        setState((current) => buildSyncSuccessState(current, pushedState?.sync?.lastSyncedAt ?? new Date().toISOString()));
      }
    } catch {
      setState((current) => markSyncError(current, "Unable to connect sync code."));
    }
  };

  const saveBackup = () => {
    const backups = writeBackupSnapshot(state);
    const result = buildBackupSaveResult(state, backups.length, new Date().toISOString());
    applySyncLocalPatch(result.patch);
    setState(result.nextState);
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
      saveSafetyBackupSnapshot(state);
      setState(resolveManualPullState(state, remoteState, remoteState.sync?.lastSyncedAt ?? new Date().toISOString()));
    } catch {
      setState((current) => markSyncError(current, "Manual pull failed."));
    }
  };

  const pushNow = async () => {
    if (!state.sync.syncCode) return;
    try {
      const remoteSnapshot = await fetchSyncState(state.sync.syncCode);
      const outboundState = resolveOutboundSyncState(state, remoteSnapshot);
      const remoteState = await pushSyncState(state.sync.syncCode, createSyncPayload(outboundState));
      setState((current) =>
        buildSyncSuccessState(
          resolveOutboundSyncState(current, remoteState, state.sync.syncCode),
          remoteState?.sync?.lastSyncedAt ?? new Date().toISOString()
        )
      );
    } catch {
      setState((current) => markSyncError(current, "Manual push failed."));
    }
  };

  const triggerLifeQuickAction = (label: string, dateKey = todayKey) => {
    setState((current) => {
      const result = applyLifeQuickActionWithPersistence(current, label, dateKey);
      applyLifeQuickActionLocalPatch(result.patch);
      return result.nextState;
    });
  };

  const dashboardTasks = useMemo(
    () => buildDashboardTasks(state, todayKey, studyTasks, lifeGroups),
    [state, todayKey]
  );

  const mainTask = useMemo(
    () => getMainDashboardTask(dashboardTasks, state.execution.mainTaskId),
    [dashboardTasks, state.execution.mainTaskId]
  );

  const activeExecutionTask = useMemo(
    () => getActiveExecutionTask(dashboardTasks, state.execution),
    [dashboardTasks, state.execution]
  );

  const formattedExecutionTime = useMemo(
    () => formatExecutionElapsedTime(state.execution, executionNow),
    [executionNow, state.execution]
  );

  const pageMeta = PAGE_META[view as keyof typeof PAGE_META] ?? PAGE_META.dashboard;

  const activePath = pathname === "/" ? "/dashboard" : pathname;
  const activeOfficeZone = OFFICE_ZONES.find((zone) => zone.id === officePresence.zoneId) ?? OFFICE_ZONES[0];
  const activeStudyZone = STUDY_ROOM_ZONES.find((zone) => zone.id === studyPresence.zoneId) ?? STUDY_ROOM_ZONES[0];

  const moveToSeat = (zoneId: string, seat: { id: string; x: number; y: number }) => {
    applyOfficePresencePatch(buildOfficeSeatPatch(zoneId, seat));
  };

  const setOfficeStatus = (status: string) => {
    applyOfficePresencePatch(buildOfficeStatusPatch(status));
  };

  const moveToStudySeat = (zoneId: string, seat: { id: string }) => {
    applyStudyPresencePatch(buildStudySeatPatch(zoneId, seat));
  };

  const setStudyMode = (mode: string) => {
    applyStudyPresencePatch(buildStudyModePatch(mode));
  };

  const startExecution = (task: DashboardTask) => {
    commitState((current) => startExecutionState(current, task, new Date().toISOString()));
  };

  const toggleExecutionPause = () => {
    commitState((current) => toggleExecutionPauseState(current, Date.now()));
  };

  const completeExecution = () => {
    if (!activeExecutionTask) return;

    const sourceTask =
      activeExecutionTask.sourceType === "tracked-task"
        ? activeExecutionTask.category === "Study"
          ? studyTasks.find((task) => task.id === activeExecutionTask.sourceId)
          : lifeGroups.flatMap((group) => group.items).find((task) => task.id === activeExecutionTask.sourceId)
        : null;

    commitState((current) => completeExecutionState(current, { activeTask: activeExecutionTask, sourceTask, todayKey }));
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
            <strong>LV {dashboardOverview.level.level}</strong>
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
              <RoomsNavGroup
                key={item.href}
                item={item}
                isActive={isActive}
                isOpen={openNavMenu === "rooms"}
                roomsMenuPosition={roomsMenuPosition}
                activePath={activePath}
                roomsTriggerRef={roomsTriggerRef}
                roomsDropdownRef={roomsDropdownRef}
                onToggle={() => applyNavLocalPatch(buildRoomsMenuTogglePatch(openNavMenu))}
                onClose={() => applyNavLocalPatch(buildRoomsMenuClosePatch())}
              />
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
                  <span style={{ width: `${dashboardOverview.lifeUsedRatio * 100}%` }} />
                </div>
                <CompactStatGrid
                  className="compact-stat-grid-keep-mobile"
                  columns={3}
                  items={[
                    { label: "Life Used", value: `${Math.round(dashboardOverview.lifeUsedRatio * 100)}%` },
                    { label: "Days Left", value: formatNumber(dashboardOverview.daysLeft) },
                    { label: "To Retirement", value: `${dashboardOverview.yearsToRetirement} yrs` }
                  ]}
                />
              </Card>

              <Card title="Your Goal" icon={CircleDollarSign} className="card-year-goal dashboard-rail-card">
                <div className="metric-row">
                  <span className="muted">Year Goal</span>
                  <strong>
                    {state.profile.currency}
                    {formatNumber(state.profile.yearGoal)}
                  </strong>
                </div>
                <div className="timeline-track">
                  <span style={{ width: `${dashboardOverview.income.progress * 100}%` }} />
                </div>
                <CompactStatGrid
                  className="compact-stat-grid-keep-mobile"
                  columns={3}
                  items={[
                    { label: "Daily Target", value: `${state.profile.currency}${formatNumber(dashboardOverview.income.dailyTarget)}` },
                    { label: "Monthly Target", value: `${state.profile.currency}${formatNumber(dashboardOverview.income.monthlyTarget)}` },
                    { label: "Should Be At", value: `${state.profile.currency}${formatNumber(dashboardOverview.income.shouldHaveMade)}` }
                  ]}
                />
              </Card>

              <Card title="Streak" icon={Flame} className="card-streaks dashboard-rail-card">
                <div className="streak-widget">
                  {dashboardOverview.coreStreaks.map((item) => (
                    <StreakMini key={item.label} label={item.label} history={item.history} streak={item.streak} />
                  ))}
                </div>
              </Card>
            </aside>
          </section>
        </>
      ) : (
        <>
          {view === "focus" ? (
            <section className="focus-page-shell">
              <div className="focus-page-core">
                <div className="focus-type-selector">
                  {(["work", "study", "life"] as const).map((type) => (
                    <button
                      key={type}
                      className={`focus-type-chip ${focusType === type ? "is-active" : ""}`}
                      onClick={() => setFocusTypeState(type)}
                      disabled={focusSessionLocked}
                    >
                      {type === "work" ? "Work" : type === "study" ? "Study" : "Life"}
                    </button>
                  ))}
                </div>

                <div className="focus-setup-summary">
                  <p className="muted">
                    Choose a lane first. Task binding is optional, but binding a task adds XP and makes work handoff cleaner.
                  </p>
                  <div className="money-summary-grid is-compact-four">
                    <div className="money-summary-item">
                      <span>Base</span>
                      <strong>{FOCUS_XP_V1.baseXP} XP</strong>
                    </div>
                    <div className="money-summary-item">
                      <span>Type</span>
                      <strong>{focusType ? `x${focusViewModel.rewardPreview.typeMultiplier.toFixed(1)}` : "Pick one"}</strong>
                    </div>
                    <div className="money-summary-item">
                      <span>Binding</span>
                      <strong>{focusTask ? `+${focusViewModel.rewardPreview.taskBindingBonusPct}%` : "+0%"}</strong>
                    </div>
                    <div className="money-summary-item">
                      <span>Streak</span>
                      <strong>{focusType ? `+${focusViewModel.rewardPreview.streakBonusPct}%` : "+0%"}</strong>
                    </div>
                  </div>
                </div>

                <div className="focus-task-selector">
                  <div className="focus-task-copy">
                    <span className="eyebrow">Task Binding</span>
                    <strong>{focusTask ? focusTask.label : "No task bound"}</strong>
                    <p className="muted">
                      {focusTask
                        ? `${focusTask.meta} · Bound for this session`
                        : focusType
                          ? focusViewModel.availableTaskCount
                            ? `${focusViewModel.availableTaskCount} available. Optional, but binding adds +${focusViewModel.rewardPreview.taskBindingBonusPct}% XP.`
                            : "Optional. No available tasks right now, so you can start without binding."
                          : "Select Work, Study, or Life first."}
                    </p>
                  </div>
                  <div className="focus-task-actions">
                    <button
                      className="ghost-button"
                      onClick={() => setFocusTaskModalOpen(true)}
                      disabled={!focusType || focusSessionLocked}
                    >
                      {focusTask ? "Change Binding" : "Bind Task"}
                    </button>
                    <button
                      className="ghost-button"
                      onClick={() => setFocusTask(null)}
                      disabled={!focusTask || focusSessionLocked}
                    >
                      Clear Binding
                    </button>
                  </div>
                </div>

                <div className="focus-loop-stats">
                  <div className="money-summary-grid is-compact-four">
                    <div className="money-summary-item">
                      <span>Projected</span>
                      <strong>{focusType ? `${focusViewModel.rewardPreview.xpEarned} XP` : "0 XP"}</strong>
                    </div>
                    <div className="money-summary-item">
                      <span>Focus Streak</span>
                      <strong>{focusType ? `${focusViewModel.rewardPreview.streakCount} day${focusViewModel.rewardPreview.streakCount === 1 ? "" : "s"}` : `${focusViewModel.dayStreak} day${focusViewModel.dayStreak === 1 ? "" : "s"}`}</strong>
                    </div>
                    <div className="money-summary-item">
                      <span>Today</span>
                      <strong>{focusViewModel.sessionsTodayCount} session{focusViewModel.sessionsTodayCount === 1 ? "" : "s"}</strong>
                    </div>
                    <div className="money-summary-item">
                      <span>Flow</span>
                      <strong>{focusTask?.sourceType === "work-todo" ? "Close action" : "Focus XP"}</strong>
                    </div>
                  </div>
                </div>

                <div className="focus-timer-shell">
                  {focusAvailableDurations.length > 1 ? (
                    <div className="focus-duration-toggle">
                      {focusAvailableDurations.map((duration) => (
                        <button
                          key={duration}
                          className={`focus-duration-chip ${focusDurationMinutes === duration ? "is-active" : ""}`}
                          onClick={() => applyFocusLocalPatch(buildFocusDurationSelectionPatch(duration))}
                          disabled={focusSessionLocked}
                        >
                          {duration} min
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="focus-timer-display">{focusViewModel.formattedTime}</div>
                  <p className="muted focus-status-text">
                    {focusStatus === "idle"
                      ? "Ready to start"
                      : focusStatus === "running"
                        ? "In session"
                        : focusStatus === "paused"
                          ? "Paused"
                          : "Session complete"}
                  </p>
                  {focusCompletion ? (
                    <div className="focus-completion-feedback">
                      <strong>+{focusCompletion.xpEarned} XP</strong>
                      <span>
                        {focusCompletion.typeLabel} focus complete{focusCompletion.taskLabel ? ` · ${focusCompletion.taskLabel}` : ""}
                      </span>
                      <small>
                        Base {focusCompletion.baseXP} · Type x{focusCompletion.typeMultiplier.toFixed(1)} · Binding +
                        {focusCompletion.taskBindingBonusPct}% · Streak +{focusCompletion.streakBonusPct}%
                      </small>
                      {focusCompletion.closesBoundAction ? <small>Bound work action marked done.</small> : null}
                    </div>
                  ) : null}
                </div>

                <div className="focus-controls">
                  <button className="ghost-button focus-primary-button" onClick={startFocusSession} disabled={!focusType || focusStatus === "running"}>
                    <Play size={16} />
                    Start
                  </button>
                  <button className="ghost-button" onClick={pauseFocusSession} disabled={focusStatus !== "running"}>
                    <Pause size={16} />
                    Pause
                  </button>
                  <button className="ghost-button" onClick={stopFocusSession} disabled={focusStatus === "idle" && !focusCompletion}>
                    Stop
                  </button>
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
                      {activeFocusTaskOptions.length ? (
                        activeFocusTaskOptions.map((item) => (
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
            {view === "notes" ? (
              <NotesPageSection
                Card={Card}
                ModuleCard={ModuleCard}
                utilityColor={UTILITY_MODULE_COLOR}
                noteDraftType={noteDraftType}
                noteDraftTitle={noteDraftTitle}
                noteDraftContent={noteDraftContent}
                noteContentRef={noteContentRef}
                canSaveNote={Boolean(noteDraftTitle.trim() || noteDraftContent.trim())}
                filteredNoteItems={filteredNoteItems}
                selectedNoteId={selectedNoteId}
                noteCardColors={NOTE_CARD_COLORS}
                noteTextColor={NOTE_TEXT_COLOR}
                noteSubtextColor={NOTE_SUBTEXT_COLOR}
                noteFilter={noteFilter}
                noteFilters={NOTE_FILTERS}
                noteCounts={noteCounts}
                noteTypes={NOTE_TYPES}
                hasSelectedNote={Boolean(selectedNote)}
                selectedNoteConversion={selectedNoteConversion}
                formatNoteDate={formatNoteDate}
                onDraftTitleChange={(value) => applyNoteLocalPatch(buildNoteDraftPatch({ title: value }))}
                onDraftContentChange={(value) => applyNoteLocalPatch(buildNoteDraftPatch({ content: value }))}
                onSaveNote={() => saveNote()}
                onSelectNote={(noteId) => applyNoteLocalPatch(buildNoteSelectionPatch(noteId))}
                onToggleNotePin={toggleNotePin}
                onToggleNoteArchive={toggleNoteArchive}
                onQuickCapture={focusNoteComposer}
                onFilterSelect={(filterLabel) => applyNoteLocalPatch(buildNoteFilterPatch(filterLabel))}
                onTypeSelect={(type) => applyNoteLocalPatch(buildNoteDraftTypePatch(type))}
                onMoveNoteToTodo={moveNoteToTodo}
                onConvertNoteToProject={convertNoteToProject}
                onConvertNoteToDailyAction={convertNoteToDailyAction}
              />
            ) : null}

            {view === "todo" ? (
              <section className="life-page-layout">
                <div className="life-page-primary">
                  <ModuleCard title="Todo" color={UTILITY_MODULE_COLOR} icon={ListTodo}>
                    <div className="misc-todo-stack">
                    <div className="misc-todo-composer">
                        <select
                          value={miscTodoCategory}
                          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                            applyTodoComposerPatch(buildTodoComposerCategoryPatch(event.currentTarget.value as MiscTodoCategory))
                          }
                        >
                          <option value="work">Work</option>
                          <option value="study">Study</option>
                          <option value="life">Life</option>
                          <option value="daily">Daily</option>
                        </select>
                        <input
                          className="misc-todo-input"
                          value={miscTodoInput}
                          placeholder="Add a small loose task"
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            applyTodoComposerPatch(buildTodoComposerInputPatch(event.currentTarget.value))
                          }
                          onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
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
                          miscTodoItems.map((item) => {
                            const isDone = isMiscTodoDone(item, todayKey);
                            return (
                              <article key={item.id} className={`misc-todo-card ${isDone ? "is-done" : ""}`}>
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
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                      updateMiscTodo(item.id, { label: event.currentTarget.value })
                                    }
                                  />
                                  <button className={`ghost-button ${isDone ? "is-active" : ""}`} onClick={() => toggleMiscTodo(item.id)}>
                                    {isDone ? "Done" : "Mark"}
                                  </button>
                                </div>
                              </article>
                            );
                          })
                        ) : (
                          <div className="misc-todo-empty">
                            <p className="muted">Add a loose task, tag it to Work, Study, Life, or Daily, and clear it here.</p>
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
                        <div className="money-summary-item">
                          <span>Daily</span>
                          <strong>{formatNumber(miscTodoCounts.daily)}</strong>
                        </div>
                      </div>
                    </Card>
                  </div>
                </aside>
              </section>
            ) : null}

            {view === "work" ? (
              <WorkPageSection
                Card={Card}
                ModuleCard={ModuleCard}
                workModuleColor={MODULE_COLORS.work}
                workPageViewModel={workPageViewModel}
                workPageControllers={workPageControllers}
                formatNumber={formatNumber}
              />
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
                    <LifeTaskGrid
                      tasks={lifePageTasks}
                      logs={state.logs}
                      todayKey={todayKey}
                      onLog={logLifeTaskAtDate}
                    />
                  </ModuleCard>
                </div>

                <aside className="life-page-secondary">
                  <Card title="Today Actions" icon={History} className="life-quick-card">
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
                      <p className="muted">No quick actions logged today yet.</p>
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
                              onClick={() => triggerLifeQuickAction(item.label)}
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
                    <LifeTaskGrid
                      tasks={moneyTasks}
                      logs={state.logs}
                      todayKey={todayKey}
                      onLog={logTaskAtDate}
                      currency={state.profile.currency}
                      defaultInputs={MONEY_DEFAULT_INPUTS}
                      showMonthTotals
                    />
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
              <ModuleCard title="History" color={UTILITY_MODULE_COLOR} icon={History}>
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
              <ModuleCard title="Settings" color={UTILITY_MODULE_COLOR} icon={Timer}>
                <div className="settings-stack">
                  <SettingsSyncSection
                    syncCodeInput={syncCodeInput}
                    syncState={state.sync}
                    backupCount={backupCount}
                    authUser={authUser}
                    authStatus={authStatus}
                    authEmailInput={authEmailInput}
                    onSyncCodeChange={(value) => applySyncLocalPatch(buildSyncCodeInputPatch(value))}
                    onAuthEmailChange={setAuthEmailInput}
                    onSendLoginLink={sendLoginLink}
                    onSignOut={signOut}
                    onCreateSyncCode={() => enableAnonymousSync()}
                    onConnectCode={() => enableAnonymousSync(syncCodeInput)}
                    onPushNow={pushNow}
                    onPullNow={pullNow}
                    onSaveBackup={saveBackup}
                    onExportBackup={exportBackup}
                  />

                  <SettingsProfileSection
                    profile={state.profile}
                    currencies={CURRENCIES}
                    onProfileInput={updateProfileFromInput}
                  />

                  <SettingsTimelineSection
                    profile={state.profile}
                    onProfileInput={updateProfileFromInput}
                  />

                  <SettingsTargetsSection
                    profile={state.profile}
                    onProfileInput={updateProfileFromInput}
                  />
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
                          style={{ "--map-width": `${OFFICE_MAP.width}px`, "--map-height": `${OFFICE_MAP.height}px` } as OfficeMapSurfaceStyle}
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
                          style={
                            {
                              "--study-map-width": `${STUDY_ROOM_MAP.width}px`,
                              "--study-map-height": `${STUDY_ROOM_MAP.height}px`
                            } as StudyMapSurfaceStyle
                          }
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

function Card({ title, icon: Icon, children, className = "" }: CardShellProps) {
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

function ModuleCard({ title, color, icon: Icon, children }: ModuleCardShellProps) {
  return (
    <section className="module-card" style={{ "--module-color": color } as ModuleCardStyle}>
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

function OfficeZoneDecor({ zone }: { zone: OfficeZone }) {
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
        {zone.seats.map((seat: { id: string; x: number; y: number }) => (
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

function StudyZoneDecor({ zone }: { zone: StudyRoomZone }) {
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

type OfficeZone = (typeof OFFICE_ZONES)[number];
type StudyRoomZone = (typeof STUDY_ROOM_ZONES)[number];
type CssVariableStyle<Key extends string> = CSSProperties & Record<Key, string | number>;
type OfficeMapSurfaceStyle = CssVariableStyle<"--map-width" | "--map-height">;
type StudyMapSurfaceStyle = CssVariableStyle<"--study-map-width" | "--study-map-height">;
type ModuleCardStyle = CssVariableStyle<"--module-color">;
type CompactStatGridStyle = CssVariableStyle<"--compact-columns">;

function TaskList({
  tasks,
  logs,
  todayKey,
  notes,
  onLog,
  currency,
  showStreaks = false
}: {
  tasks: TrackedTaskDefinition[];
  logs: LifeOSLogs;
  todayKey: string;
  notes?: NotesByTaskId;
  onLog: (task: TrackedTaskDefinition, value: LogValue) => void;
  currency: string;
  showStreaks?: boolean;
}) {
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

function LifeTaskGrid({
  tasks,
  logs,
  todayKey,
  onLog,
  currency,
  showStreaks = false,
  defaultInputs = LIFE_DEFAULT_INPUTS,
  showMonthTotals = false
}: {
  tasks: TrackedTaskDefinition[];
  logs: LifeOSLogs;
  todayKey: string;
  onLog: (task: TrackedTaskDefinition, value: LogValue, dateKey: string, options?: { accumulate?: boolean }) => void;
  currency?: string;
  showStreaks?: boolean;
  defaultInputs?: TaskDefaultInputMap;
  showMonthTotals?: boolean;
}) {
  const [customValues, setCustomValues] = useState<TaskDraftInputMap>({});
  const [selectedDates, setSelectedDates] = useState<TaskDraftInputMap>({});
  const [openCalendarTaskId, setOpenCalendarTaskId] = useState("");
  const [calendarMonths, setCalendarMonths] = useState<Record<string, Date>>({});

  return (
    <div className="life-task-grid">
      {tasks.map((task) => {
        const selectedDateKey = selectedDates[task.id] ?? todayKey;
        const value = getLogValue(logs, selectedDateKey, task.id);
        const isStressLevel = task.id === "stress-level";
        const isRating = task.type === "rating" || task.type === "ratingReverse";
        const isStandardRating = isRating && !isStressLevel;
        const isCustomOnly = task.inputMode === "customOnly";
        const allowsNegative = Boolean(task.allowNegative);
        const allowsZero = Boolean(task.allowZero);
        const shouldShowStreak = showStreaks || task.id === "exercise" || task.id === "meditation";
        const shouldShowSleepHistory = task.id === "sleep-quality";
        const usesSimpleLog = SIMPLE_LIFE_LOG_TASK_IDS.has(task.id);
        const defaultInput = defaultInputs[task.id];
        const dropdownPresets = (task.presets ?? []).filter((preset) => preset !== defaultInput);
        const customValue = customValues[task.id] ?? "";
        const inputStep = task.inputStep ?? (typeof task.decimalPlaces === "number" ? 1 / 10 ** task.decimalPlaces : 1);
        const inputMode = inputStep < 1 ? "decimal" : "numeric";
        const calendarMonth = calendarMonths[task.id] ?? parseDateKey(selectedDateKey);
        const calendarDays = buildTaskCalendarDays(logs, task, calendarMonth);
        const monthTotal = showMonthTotals ? getTaskMonthTotal(logs, task.id, selectedDateKey) : 0;
        const selectedStressState = isStressLevel ? getStressLevelOption(value) : undefined;
        const handleTaskLog = (nextValue: LogValue, options: { accumulate?: boolean } = {}) =>
          onLog(task, nextValue, selectedDateKey, options);
        const parseCustomValue = () => normalizeTaskNumber(task, Number(customValue));
        const canLogValue = (nextValue: number) =>
          allowsNegative ? (allowsZero ? !Number.isNaN(nextValue) : nextValue !== 0) : allowsZero ? nextValue >= 0 : nextValue > 0;

        return (
          <article key={task.id} className={`life-task-card ${isStressLevel ? "is-stress" : ""}`}>
            <div className="life-task-head">
              <div className="life-task-head-copy">
                <strong>{task.label}</strong>
                <small className="life-task-date-label">{formatShortDate(parseDateKey(selectedDateKey))}</small>
              </div>
              <div className="life-task-head-actions">
                <span className="task-value">{formatTaskValue(task, value, currency)}</span>
                <button
                  type="button"
                  className="icon-button life-task-calendar-trigger"
                  aria-label={`Open ${task.label} calendar`}
                  onClick={() => {
                    setOpenCalendarTaskId((current) => (current === task.id ? "" : task.id));
                    setCalendarMonths((current) => ({
                      ...current,
                      [task.id]: current[task.id] ?? parseDateKey(selectedDateKey)
                    }));
                  }}
                >
                  <CalendarDays size={15} />
                </button>
              </div>
            </div>

            {showMonthTotals ? (
              <div className="life-task-month-row">
                <span>Month Total</span>
                <strong>{formatCurrencyValue(monthTotal, currency)}</strong>
              </div>
            ) : null}

            {openCalendarTaskId === task.id ? (
              <div className="life-task-calendar-popover">
                <div className="life-task-calendar-head">
                  <button
                    type="button"
                    className="ghost-button life-task-calendar-nav"
                    onClick={() =>
                      setCalendarMonths((current) => ({
                        ...current,
                        [task.id]: shiftMonth(calendarMonth, -1)
                      }))
                    }
                  >
                    ‹
                  </button>
                  <strong>{formatMonthLabel(calendarMonth)}</strong>
                  <button
                    type="button"
                    className="ghost-button life-task-calendar-nav"
                    onClick={() =>
                      setCalendarMonths((current) => ({
                        ...current,
                        [task.id]: shiftMonth(calendarMonth, 1)
                      }))
                    }
                  >
                    ›
                  </button>
                </div>
                <div className="life-task-calendar-weekdays">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="life-task-calendar-grid">
                  {calendarDays.map((day, index) =>
                    day ? (
                      <button
                        type="button"
                        key={day.key}
                        className={`life-task-calendar-day ${selectedDateKey === day.key ? "is-selected" : ""}`}
                        onClick={() => {
                          setSelectedDates((current) => ({
                            ...current,
                            [task.id]: day.key
                          }));
                          setOpenCalendarTaskId("");
                        }}
                      >
                        <span className="life-task-calendar-date">{day.day}</span>
                        <strong className={`life-task-calendar-value ${day.hasValue ? "has-value" : ""}`}>{day.displayValue}</strong>
                      </button>
                    ) : (
                      <span key={`empty-${task.id}-${index}`} className="life-task-calendar-empty" />
                    )
                  )}
                </div>
              </div>
            ) : null}

            {isStressLevel ? (
              <div className="stress-state-panel">
                <div className={`stress-state-result ${selectedStressState ? `is-${selectedStressState.tone}` : "is-empty"}`}>
                  <span className="stress-state-kicker">Current State</span>
                  <strong>{selectedStressState?.label ?? "Not logged"}</strong>
                  <p>{selectedStressState?.description ?? "Choose the state that best matches how you feel right now."}</p>
                </div>

                <div className="stress-state-selector" role="group" aria-label="Stress level state">
                  {STRESS_LEVEL_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      className={`stress-state-segment is-${option.tone} ${selectedStressState?.value === option.value ? "is-active" : ""}`}
                      onClick={() => handleTaskLog(option.value)}
                      aria-pressed={selectedStressState?.value === option.value}
                    >
                      <span className="stress-state-segment-label">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : defaultInput && usesSimpleLog ? (
              <div className="life-task-input-stack is-simple">
                <button type="button" className="chip life-task-default-chip life-task-default-display" onClick={() => handleTaskLog(defaultInput, { accumulate: true })}>
                  {defaultInput}
                  {task.unit !== "$" ? task.unit : ""}
                </button>
                <input
                  className="life-task-input"
                  inputMode={inputMode}
                  type="number"
                  step={inputStep}
                  min={allowsNegative || allowsZero ? undefined : "0"}
                  placeholder="Custom"
                  value={customValue}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const nextDraftValue = event.currentTarget.value;
                    setCustomValues((current) => ({
                      ...current,
                      [task.id]: nextDraftValue
                    }));
                  }}
                  onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    if (customValue === "") return;
                    const nextValue = parseCustomValue();
                    if (!canLogValue(nextValue)) return;
                    handleTaskLog(nextValue, { accumulate: true });
                    setCustomValues((current) => ({
                      ...current,
                      [task.id]: ""
                    }));
                  }}
                />
                <button
                  type="button"
                  className="ghost-button life-task-custom-button"
                  onClick={() => {
                    if (customValue === "") return;
                    const nextValue = parseCustomValue();
                    if (!canLogValue(nextValue)) return;
                    handleTaskLog(nextValue, { accumulate: true });
                    setCustomValues((current) => ({
                      ...current,
                      [task.id]: ""
                    }));
                  }}
                >
                  Log
                </button>
              </div>
            ) : isCustomOnly ? (
              <div className="life-task-input-stack is-custom-only">
                <input
                  className="life-task-input"
                  inputMode={inputMode}
                  type="number"
                  step={inputStep}
                  min={allowsNegative || allowsZero ? undefined : "0"}
                  placeholder={task.unit}
                  value={customValue}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const nextDraftValue = event.currentTarget.value;
                    setCustomValues((current) => ({
                      ...current,
                      [task.id]: nextDraftValue
                    }));
                  }}
                  onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    if (customValue === "") return;
                    const nextValue = parseCustomValue();
                    if (!canLogValue(nextValue)) return;
                    handleTaskLog(nextValue);
                    setCustomValues((current) => ({
                      ...current,
                      [task.id]: ""
                    }));
                  }}
                />
                <button
                  type="button"
                  className="ghost-button life-task-custom-button"
                  onClick={() => {
                    if (customValue === "") return;
                    const nextValue = parseCustomValue();
                    if (!canLogValue(nextValue)) return;
                    handleTaskLog(nextValue);
                    setCustomValues((current) => ({
                      ...current,
                      [task.id]: ""
                    }));
                  }}
                >
                  Log
                </button>
              </div>
            ) : defaultInput ? (
              <div className="life-task-input-stack">
                <button type="button" className="chip life-task-default-chip" onClick={() => handleTaskLog(defaultInput)}>
                  {defaultInput}
                  {task.unit !== "$" ? task.unit : ""}
                </button>
                <select
                  className="life-task-select"
                  value=""
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                    const rawValue = event.currentTarget.value;
                    if (rawValue === "") return;
                    const nextValue = Number(rawValue);
                    const canLog = allowsNegative ? (allowsZero ? !Number.isNaN(nextValue) : nextValue !== 0) : allowsZero ? nextValue >= 0 : nextValue > 0;
                    if (canLog) handleTaskLog(nextValue);
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
                    inputMode={inputMode}
                    type="number"
                    step={inputStep}
                    min={allowsNegative || allowsZero ? undefined : "0"}
                    placeholder={task.unit}
                    value={customValue}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const nextDraftValue = event.currentTarget.value;
                      setCustomValues((current) => ({
                        ...current,
                        [task.id]: nextDraftValue
                      }));
                    }}
                    onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      if (customValue === "") return;
                      const nextValue = parseCustomValue();
                      if (!canLogValue(nextValue)) return;
                      handleTaskLog(nextValue);
                      setCustomValues((current) => ({
                        ...current,
                        [task.id]: ""
                      }));
                    }}
                  />
                  <button
                    type="button"
                    className="ghost-button life-task-custom-button"
                    onClick={() => {
                      if (customValue === "") return;
                      const nextValue = parseCustomValue();
                      if (!canLogValue(nextValue)) return;
                      handleTaskLog(nextValue);
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
              <div className={`life-task-actions ${isStandardRating ? "is-rating" : ""}`}>
                {task.presets?.map((preset) => (
                  <button type="button" key={preset} className="chip" onClick={() => handleTaskLog(preset)}>
                    {currency && task.unit === "$" ? currency : ""}
                    {preset}
                    {task.unit !== "$" ? task.unit : ""}
                  </button>
                ))}
              </div>
            ) : null}

            {isStandardRating ? (
              <div className="life-task-actions is-rating">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button type="button" key={rating} className={`chip ${value === rating ? "is-active" : ""}`} onClick={() => handleTaskLog(rating)}>
                    {rating}★
                  </button>
                ))}
              </div>
            ) : null}

            {task.type === "boolean" ? (
              <button type="button" className={`boolean-log life-task-boolean ${value ? "is-active" : ""}`} onClick={() => handleTaskLog(!value)}>
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

type TaskCalendarCell =
  | {
      key: string;
      day: number;
      hasValue: boolean;
      displayValue: string;
    }
  | null;

function parseDateKey(dateKey: string) {
  const [year, month, day] = String(dateKey || formatDateKey(new Date()))
    .split("-")
    .map((value) => Number(value));
  return new Date(year, Math.max(0, (month || 1) - 1), day || 1);
}

function shiftMonth(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatNoteDate(timestamp?: string | null) {
  const date = timestamp ? new Date(timestamp) : new Date();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function buildTaskCalendarDays(logs: LifeOSLogs, task: TrackedTaskDefinition, monthDate: Date): TaskCalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyCount = firstDay.getDay();
  const cells: TaskCalendarCell[] = Array.from({ length: leadingEmptyCount }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = formatDateKey(date);
    const rawValue = logs?.[key]?.[task.id]?.value;
    const hasValue = typeof rawValue === "boolean" ? rawValue : Number(rawValue) > 0 || Number(rawValue) < 0;
    const displayValue =
      task.id === "stress-level"
        ? formatStressLevelShortValue(rawValue)
        : typeof rawValue === "boolean"
        ? rawValue
          ? "1"
          : ""
        : formatTaskNumber(task, rawValue);

    cells.push({
      key,
      day,
      hasValue,
      displayValue: hasValue ? String(displayValue) : ""
    });
  }

  return cells;
}

function getTaskMonthTotal(logs: LifeOSLogs, taskId: string, dateKey: string) {
  const monthDate = parseDateKey(dateKey);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let total = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = formatDateKey(new Date(year, month, day));
    total += Number(logs?.[key]?.[taskId]?.value ?? 0);
  }

  return total;
}

function getSleepScoreHistory(logs: LifeOSLogs, taskId: string, days = 14) {
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

function formatTaskValue(task: TrackedTaskDefinition, value: LogValue | undefined, currency = "$") {
  if (task.type === "boolean") {
    return value ? "Clean" : "Pending";
  }

  if (task.id === "stress-level") {
    return formatStressLevelValue(value);
  }

  if (task.unit === "$" && Number(value || 0) !== 0) {
    return formatCurrencyValue(Number(value || 0), currency);
  }

  const separator = task.compactUnit ? "" : " ";
  const formattedValue = formatTaskNumber(task, value);
  if (formattedValue !== "0" || value === 0) {
    return `${currency && task.unit === "$" ? currency : ""}${formattedValue}${task.unit !== "$" ? `${separator}${task.unit}` : ""}`;
  }

  return `0${task.unit !== "$" ? `${separator}${task.unit}` : ""}`;
}

function normalizeTaskNumber(task: TrackedTaskDefinition, value: number) {
  if (!Number.isFinite(value)) return Number.NaN;
  if (typeof task.decimalPlaces !== "number") return value;
  return Number(value.toFixed(task.decimalPlaces));
}

function formatTaskNumber(task: TrackedTaskDefinition, value: LogValue | undefined) {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return "0";
  if (typeof task.decimalPlaces === "number") {
    return numericValue.toFixed(task.decimalPlaces);
  }
  return String(numericValue);
}

function formatCurrencyValue(value: number | string | boolean | undefined, currency = "$") {
  const numericValue = Number(value || 0);
  const absValue = formatNumber(Math.abs(numericValue));
  if (numericValue < 0) return `-${currency}${absValue}`;
  return `${currency}${absValue}`;
}

function TimelineMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="timeline-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CompactStatGrid({
  items,
  columns = 3,
  className = ""
}: {
  items: { label: string; value: ReactNode }[];
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`compact-stat-grid ${className}`.trim()} style={{ "--compact-columns": columns } as CompactStatGridStyle}>
      {items.map((item) => (
        <div key={item.label} className="compact-stat-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function StreakMini({ label, history, streak }: { label: string; history: TaskHistoryEntry[]; streak: number }) {
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
