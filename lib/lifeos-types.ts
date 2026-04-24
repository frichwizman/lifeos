export type ISODateString = string;

export type SyncMode = "local" | "anonymous";
export type SyncStatus = "idle" | "connecting" | "synced" | "error";

export interface SyncState {
  syncCode: string;
  userId: string | null;
  mode: SyncMode;
  status: SyncStatus;
  updatedAt: ISODateString;
  lastSyncedAt: ISODateString | null;
  lastBackupAt: ISODateString | null;
  error: string;
}

export type ExecutionStatus = "idle" | "active" | "paused";

export interface ExecutionState {
  status: ExecutionStatus;
  currentTaskId: string;
  currentTaskLabel: string;
  currentCategory: string;
  sourceType: string;
  sourceId: string;
  projectId: string;
  startTime: ISODateString | null;
  elapsedMs: number;
  xpReward: number;
  attributeKey: string;
  attributeDelta: number;
  mainTaskId: string;
}

export type FocusType = "" | "work" | "study" | "life";

export interface FocusPrefillState {
  type: FocusType;
  taskId: string;
  label: string;
  meta: string;
  sourceType: string;
  projectId: string;
  logTaskId: string;
}

export interface AttributesState {
  mind: number;
  body: number;
  wealth: number;
  social: number;
}

export interface ProfileState {
  name: string;
  totalXP: number;
  age: number;
  lifeExpectancy: number;
  retirementAge: number;
  yearGoal: number;
  currency: string;
  pbXP: number;
}

export type LogValue = number | boolean;

export interface DailyLogRecord {
  value: LogValue;
  xp: number;
  ts: number;
  focusXp?: number;
  type?: string;
}

export type DailyLogs = Record<string, DailyLogRecord>;
export type LifeOSLogs = Record<string, DailyLogs>;
export type NotesByTaskId = Record<string, string>;
export type WorkProjectSlotLabels = Record<string, string>;
export type TaskDraftInputMap = Record<string, string>;
export type TaskDefaultInputMap = Record<string, number>;

export interface FocusSession {
  id: string;
  type: FocusType;
  duration: number;
  taskId: string;
  taskLabel: string;
  sourceType: string;
  projectId: string;
  xpEarned: number;
  streakBonusPct: number;
  timestamp: ISODateString;
}

export interface FocusTaskOption {
  id: string;
  logTaskId: string;
  taskId: string;
  label: string;
  meta: string;
  type: Exclude<FocusType, "">;
  sourceType: string;
  projectId?: string;
}

export interface FocusTaskOptions {
  work: FocusTaskOption[];
  study: FocusTaskOption[];
  life: FocusTaskOption[];
}

export type MiscTodoCategory = "work" | "study" | "life" | "daily";

export interface MiscTodoItem {
  id: string;
  label: string;
  category: MiscTodoCategory;
  done: boolean;
  createdAt: number;
  completedAt: number | null;
  completedDayKey: string | null;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  type: string;
  pinned: boolean;
  archived: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  colorIndex: number;
}

export interface WorkAction {
  id: string;
  label: string;
}

export type WorkActionSource = "backlog" | "candidate" | "new";

export interface WorkProject {
  id: string;
  name: string;
  color: string;
  todayActions: WorkAction[];
  backlog: WorkAction[];
  nextDayCandidates: WorkAction[];
}

export interface LifeOSState {
  sync: SyncState;
  execution: ExecutionState;
  focusPrefill: FocusPrefillState;
  attributes: AttributesState;
  profile: ProfileState;
  workDayKey: string;
  logs: LifeOSLogs;
  focusSessions: FocusSession[];
  miscTodos: MiscTodoItem[];
  noteCursor: number;
  noteItems: NoteItem[];
  notes: NotesByTaskId;
  workProjects: WorkProject[];
}

export type SyncPayload = LifeOSState;

export interface SyncSnapshot {
  state: SyncPayload;
  savedAt: ISODateString;
}

export interface BackupSnapshot {
  createdAt: ISODateString;
  state: SyncPayload;
}

export type TrackedTaskType = "number" | "boolean" | "rating" | "ratingReverse";

export interface TrackedTaskDefinition {
  id: string;
  label: string;
  unit: string;
  type: TrackedTaskType;
  xpPerUnit: number;
  presets?: number[];
  compactUnit?: boolean;
  allowZero?: boolean;
  allowNegative?: boolean;
}

export interface LifeGroup {
  title: string;
  items: TrackedTaskDefinition[];
}

export interface LifePillar {
  id: string;
  pillar: string;
  short: string;
  color: string;
}

export interface LevelProgress {
  level: number;
  current: number;
  needed: number;
}

export interface TaskHistoryEntry {
  key: string;
  done: boolean;
}

export interface HistoryEntry {
  key: string;
  category: string;
  label: string;
  value: string;
  meta: string;
  xp: number;
}

export interface HistoryDay {
  key: string;
  label: string;
  dateKey: string;
  isToday: boolean;
  xp: number;
  count: number;
  entries: HistoryEntry[];
}

export interface FocusReward {
  baseXP: number;
  typeLabel: string;
  typeMultiplier: number;
  taskBindingBonusPct: number;
  streakCount: number;
  streakBonusPct: number;
  xpEarned: number;
}

export interface FocusSessionCompletion extends FocusReward {
  duration: number;
  taskLabel: string;
  taskMeta: string;
  closesBoundAction: boolean;
}

export type FocusTimerStatus = "idle" | "running" | "paused" | "completed";

export interface FocusLocalPatch {
  type?: FocusType;
  task?: FocusTaskOption | null;
  status?: FocusTimerStatus;
  durationMinutes?: number;
  remainingSeconds?: number;
  startedAt?: number | null;
  endsAt?: number | null;
  completion?: FocusSessionCompletion | null;
  taskModalOpen?: boolean;
  completionPending?: boolean;
}

export interface ExecutionLocalPatch {
  nowMs?: number;
}

export interface ComputeFocusRewardInput {
  type: FocusType;
  taskBound?: boolean;
  focusSessions?: FocusSession[];
  dateKey?: string;
}

export interface IncomeStats {
  dayOfYear: number;
  daysInYear: number;
  progress: number;
  dailyTarget: number;
  monthlyTarget: number;
  shouldHaveMade: number;
  remainingDays: number;
}

export interface QuickActionSummary {
  id: string;
  label: string;
  group: string;
}

export interface MoneySummary {
  income: number;
  expense: number;
  savings: number;
  investment: number;
}

export interface StudySummaryItem {
  id: string;
  label: string;
  value: string;
}

export interface MiscTodoCounts {
  total: number;
  open: number;
  done: number;
  work: number;
  study: number;
  life: number;
  daily: number;
}

export interface NoteCollections {
  sorted: NoteItem[];
  filtered: NoteItem[];
  counts: {
    all: number;
    pinned: number;
    recent: number;
    archived: number;
  };
}

export interface PreparedMiscTodoInput {
  label: string;
  category: MiscTodoCategory;
}

export interface TodoComposerPatch {
  input?: string;
  category?: MiscTodoCategory;
}

export interface SyncLocalPatch {
  syncCodeInput?: string;
  backupCount?: number;
}

export type EditableProfileField = "name" | "currency" | "age" | "retirementAge" | "yearGoal";

export interface PreparedProfileFieldUpdate<Key extends EditableProfileField = EditableProfileField> {
  key: Key;
  value: ProfileState[Key];
}

export type NavMenuKey = "" | "rooms";
export type MoneyLogSyncStatus = "idle" | "pulling" | "pushing" | "synced" | "error";

export interface NavMenuPosition {
  top: number;
  left: number;
}

export interface NavLocalPatch {
  openMenu?: NavMenuKey;
  roomsMenuPosition?: NavMenuPosition;
}

export interface LifeQuickActionLocalPatch {
  activeLabel?: string;
}

export interface PreparedAnonymousSyncStart {
  code: string;
  nextState: LifeOSState;
  patch: SyncLocalPatch;
}

export interface AnonymousSyncRemoteResolution {
  shouldPush: boolean;
  nextState: LifeOSState;
}

export interface BackupSaveResult {
  nextState: LifeOSState;
  patch: SyncLocalPatch;
}

export interface WorkComposerPatch {
  modalProjectId?: string;
  draft?: string;
}

export interface PreparedWorkActionDraft {
  id: string;
  label: string;
}

export interface WorkProjectActionControllers {
  renameProject: (projectId: string, name: string) => void;
  renameTodayAction: (projectId: string, actionId: string, label: string) => void;
  deleteTodayAction: (projectId: string, actionId: string) => void;
  launchFocus: (project: WorkProject, action: WorkAction) => void;
  toggleTodo: (projectId: string, actionId: string) => void;
}

export interface WorkComposerControllers {
  open: (projectId: string) => void;
  close: () => void;
  updateDraft: (draft: string) => void;
  moveActionToToday: (projectId: string, action: WorkAction, source?: WorkActionSource) => void;
  addDraftAction: (projectId: string) => void;
}

export interface WorkPageControllers {
  projectActions: WorkProjectActionControllers;
  composerControls: WorkComposerControllers;
}

export interface NoteDraftValues {
  title: string;
  content: string;
  type: string;
}

export interface NoteLocalPatch {
  draftTitle?: string;
  draftContent?: string;
  draftType?: string;
  noteFilter?: string;
  selectedNoteId?: string;
  focusContent?: boolean;
}

export interface PreparedNoteInput extends NoteDraftValues {
  paletteSize: number;
  createdAt: ISODateString;
}

export interface NoteComposerResetState {
  title: string;
  content: string;
  selectedNoteId: string;
  noteFilter: string;
}

export interface SelectedNoteConversion {
  noteId: string;
  label: string;
}

export interface OfficePresenceState {
  x: number;
  y: number;
  zoneId: string;
  seatId: string;
  status: string;
}

export interface StudyPresenceState {
  zoneId: string;
  seatId: string;
  mode: string;
}

export interface OfficePresencePatch {
  x?: number;
  y?: number;
  zoneId?: string;
  seatId?: string;
  status?: string;
}

export interface StudyPresencePatch {
  zoneId?: string;
  seatId?: string;
  mode?: string;
}

export interface DashboardCoreStreak {
  label: string;
  history: TaskHistoryEntry[];
  streak: number;
}

export interface DashboardOverview {
  level: LevelProgress;
  income: IncomeStats;
  lifeUsedRatio: number;
  daysLeft: number;
  yearsToRetirement: number;
  coreStreaks: DashboardCoreStreak[];
}

export interface FocusViewModel {
  formattedTime: string;
  sessionsTodayCount: number;
  dayStreak: number;
  availableTaskCount: number;
  rewardPreview: FocusReward;
}

export interface WorkSidebarProjectSummary {
  id: string;
  label: string;
  total: number;
  done: number;
  open: number;
  backlog: number;
  candidates: number;
}

export interface WorkSidebarSummary {
  total: number;
  done: number;
  open: number;
  projects: WorkSidebarProjectSummary[];
}

export interface WorkExecutionSummary {
  readyProjects: number;
  projectsNeedingActions: number;
  missingActions: number;
}

export interface ProjectDailyActionStatus {
  tone: "is-ready" | "is-light" | "is-full";
  message: string;
}

export interface WorkProjectActionViewModel {
  action: WorkAction;
  done: boolean;
}

export interface WorkProjectViewModel {
  project: WorkProject;
  slotLabel: string;
  todayCount: number;
  status: ProjectDailyActionStatus;
  todayActions: WorkProjectActionViewModel[];
}

export interface WorkComposerViewModel {
  isOpen: boolean;
  projectId: string;
  title: string;
  draft: string;
  activeProject: WorkProject | null;
  nextDayCandidates: WorkAction[];
  backlog: WorkAction[];
}

export interface WorkPageViewModel {
  sidebarSummary: WorkSidebarSummary;
  executionSummary: WorkExecutionSummary;
  projectViewModels: WorkProjectViewModel[];
  composerViewModel: WorkComposerViewModel;
}

export interface DashboardTask {
  id: string;
  sourceType: string;
  sourceId: string;
  projectId: string;
  label: string;
  category: string;
  context: string;
  xpReward: number;
  attributeKey: keyof AttributesState;
  attributeDelta: number;
  completionValue?: number | boolean;
  task?: TrackedTaskDefinition;
}

export interface ActiveExecutionTask extends DashboardTask {}

export interface MigratableWorkProject extends Partial<WorkProject> {
  todos?: unknown;
}

export interface MigratableLifeOSState {
  sync?: Partial<SyncState> | null;
  execution?: Partial<ExecutionState> | null;
  focusPrefill?: Partial<FocusPrefillState> | null;
  attributes?: Partial<AttributesState> | null;
  profile?: Partial<ProfileState> | null;
  workDayKey?: string;
  logs?: LifeOSLogs;
  noteCursor?: number;
  notes?: NotesByTaskId;
  workProjects?: unknown;
  miscTodos?: unknown;
  focusSessions?: unknown;
  noteItems?: unknown;
}

export interface SyncApiResponse {
  state?: SyncPayload | null;
  savedAt?: ISODateString | null;
  error?: string;
}

export interface SyncErrorResponse {
  error?: string;
}

export interface SyncSessionRow {
  sync_code: string;
  user_id: string | null;
  state: SyncPayload | string;
  updated_at: ISODateString;
}

export interface AuthUser {
  id: string;
  email: string | null;
}

export type AuthStatus = "checking" | "signed-in" | "signed-out" | "error";

export interface AuthSessionResponse {
  user: AuthUser | null;
  error?: string;
}

export interface AuthActionResponse {
  ok?: boolean;
  error?: string;
}

export interface LifeLogRow {
  user_id: string;
  date_key: string;
  task_id: string;
  value: LogValue;
  xp: number;
  ts: number;
  updated_at?: ISODateString;
}

export interface LifeLogsApiResponse {
  logs?: LifeOSLogs;
  savedAt?: ISODateString;
  error?: string;
}
