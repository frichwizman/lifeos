import { applyQuickLifeAction, beginAnonymousSync, markBackupSaved, markSyncSuccess, applyRemoteSyncedState } from "@/lib/lifeos-actions";
import { choosePreferredSyncState, STORAGE_KEY } from "@/lib/lifeos-data";
import { getNoteActionLabel } from "@/lib/lifeos-selectors";
import type {
  AnonymousSyncRemoteResolution,
  BackupSaveResult,
  EditableProfileField,
  ExecutionLocalPatch,
  PreparedAnonymousSyncStart,
  PreparedProfileFieldUpdate,
  FocusLocalPatch,
  FocusSessionCompletion,
  FocusTaskOption,
  FocusTaskOptions,
  FocusTimerStatus,
  FocusType,
  LifeQuickActionLocalPatch,
  LifeOSState,
  MiscTodoCategory,
  NavLocalPatch,
  NavMenuKey,
  NavMenuPosition,
  NoteLocalPatch,
  NoteComposerResetState,
  NoteDraftValues,
  NoteItem,
  OfficePresencePatch,
  OfficePresenceState,
  PreparedMiscTodoInput,
  PreparedNoteInput,
  PreparedWorkActionDraft,
  SelectedNoteConversion,
  SyncLocalPatch,
  StudyPresencePatch,
  StudyPresenceState,
  TodoComposerPatch,
  WorkComposerControllers,
  WorkComposerPatch,
  WorkPageControllers,
  WorkProjectActionControllers
} from "@/lib/lifeos-types";

type FocusDurationOptions = Partial<Record<Exclude<FocusType, "">, number[]>>;

const DEFAULT_NOTE_RESET_STATE: NoteComposerResetState = {
  title: "",
  content: "",
  selectedNoteId: "",
  noteFilter: "All"
};

export function buildFocusResetPatch(durationMinutes: number, options: { keepCompletion?: boolean } = {}): FocusLocalPatch {
  return {
    status: "idle",
    remainingSeconds: durationMinutes * 60,
    startedAt: null,
    endsAt: null,
    completionPending: false,
    ...(options.keepCompletion ? {} : { completion: null })
  };
}

export function buildExecutionNowPatch(nowMs: number): ExecutionLocalPatch {
  return {
    nowMs
  };
}

export function buildFocusTypeSelectionPatch(
  nextType: FocusType,
  durationOptions: FocusDurationOptions
): FocusLocalPatch | null {
  if (!nextType || !durationOptions[nextType]?.length) return null;

  const nextDuration = durationOptions[nextType]?.[0] ?? 25;
  return {
    type: nextType,
    task: null,
    durationMinutes: nextDuration,
    ...buildFocusResetPatch(nextDuration)
  };
}

export function buildFocusPrefillPatch(params: {
  prefillType: FocusType;
  prefillTaskId: string;
  focusTaskOptions: FocusTaskOptions;
  durationOptions: FocusDurationOptions;
}): FocusLocalPatch | null {
  const { prefillType, prefillTaskId, focusTaskOptions, durationOptions } = params;
  if (!prefillType || !durationOptions[prefillType]?.length) return null;

  const nextDuration = durationOptions[prefillType]?.[0] ?? 25;
  const matchingTask = (focusTaskOptions[prefillType] ?? []).find((item) => item.id === prefillTaskId) ?? null;

  return {
    type: prefillType,
    task: matchingTask,
    durationMinutes: nextDuration,
    ...buildFocusResetPatch(nextDuration)
  };
}

export function buildFocusDurationSelectionPatch(durationMinutes: number): FocusLocalPatch {
  return {
    durationMinutes,
    ...buildFocusResetPatch(durationMinutes)
  };
}

export function buildFocusStartPatch(params: {
  focusType: FocusType;
  focusStatus: FocusTimerStatus;
  focusRemainingSeconds: number;
  focusDurationMinutes: number;
  nowMs: number;
}): FocusLocalPatch | null {
  const { focusType, focusStatus, focusRemainingSeconds, focusDurationMinutes, nowMs } = params;
  if (!focusType) return null;

  const nextDurationSeconds =
    focusStatus === "paused" && focusRemainingSeconds > 0 ? focusRemainingSeconds : focusDurationMinutes * 60;

  return {
    status: "running",
    remainingSeconds: nextDurationSeconds,
    startedAt: nowMs,
    endsAt: nowMs + nextDurationSeconds * 1000,
    completion: null,
    taskModalOpen: false,
    completionPending: false
  };
}

export function buildFocusPausePatch(params: {
  focusStatus: FocusTimerStatus;
  focusEndsAt: number | null;
  focusRemainingSeconds: number;
  nowMs: number;
}): FocusLocalPatch | null {
  const { focusStatus, focusEndsAt, focusRemainingSeconds, nowMs } = params;
  if (focusStatus !== "running") return null;

  const nextRemaining = focusEndsAt ? Math.max(0, Math.ceil((focusEndsAt - nowMs) / 1000)) : focusRemainingSeconds;

  return {
    status: "paused",
    remainingSeconds: nextRemaining,
    startedAt: null,
    endsAt: null
  };
}

export function buildFocusCompletionPatch(completion: FocusSessionCompletion): FocusLocalPatch {
  return {
    status: "completed",
    remainingSeconds: 0,
    startedAt: null,
    endsAt: null,
    completion
  };
}

export function prepareMiscTodoInput(input: string, category: MiscTodoCategory): PreparedMiscTodoInput | null {
  const label = input.trim();
  if (!label) return null;

  return {
    label,
    category
  };
}

export function buildTodoComposerInputPatch(input: string): TodoComposerPatch {
  return { input };
}

export function buildTodoComposerCategoryPatch(category: MiscTodoCategory): TodoComposerPatch {
  return { category };
}

export function buildTodoComposerResetPatch(): TodoComposerPatch {
  return { input: "" };
}

export function buildSyncCodeInputPatch(input: string): SyncLocalPatch {
  return {
    syncCodeInput: input.toUpperCase()
  };
}

export function buildBackupCountPatch(backupCount: number): SyncLocalPatch {
  return {
    backupCount
  };
}

export function buildRoomsMenuTogglePatch(currentMenu: NavMenuKey, targetMenu: NavMenuKey = "rooms"): NavLocalPatch {
  return {
    openMenu: currentMenu === targetMenu ? "" : targetMenu
  };
}

export function buildRoomsMenuClosePatch(): NavLocalPatch {
  return {
    openMenu: ""
  };
}

export function buildRoomsMenuPositionPatch(rect: Pick<DOMRect, "bottom" | "left">, windowWidth: number): NavLocalPatch {
  const maxLeft = Math.max(12, windowWidth - 196);
  return {
    roomsMenuPosition: {
      top: rect.bottom + 8,
      left: Math.max(12, Math.min(rect.left, maxLeft))
    }
  };
}

export function shouldKeepRoomsMenuOpen(params: {
  trigger: HTMLElement | null;
  dropdown: HTMLElement | null;
  target: EventTarget | null;
}): boolean {
  const { trigger, dropdown, target } = params;
  if (!(target instanceof Node)) return false;
  return Boolean(trigger?.contains(target) || dropdown?.contains(target));
}

export function buildLifeQuickActionPatch(activeLabel: string): LifeQuickActionLocalPatch {
  return {
    activeLabel
  };
}

export function prepareProfileFieldUpdate<Key extends EditableProfileField>(
  key: Key,
  rawValue: string
): PreparedProfileFieldUpdate<Key> {
  if (key === "name" || key === "currency") {
    return {
      key,
      value: rawValue as PreparedProfileFieldUpdate<Key>["value"]
    };
  }

  return {
    key,
    value: Number(rawValue || 0) as PreparedProfileFieldUpdate<Key>["value"]
  };
}

export function applyLifeQuickActionWithPersistence(
  state: LifeOSState,
  label: string,
  dateKey: string
): { nextState: LifeOSState; patch: LifeQuickActionLocalPatch } {
  const nextState = applyQuickLifeAction(state, label, dateKey);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch {}

  return {
    nextState,
    patch: buildLifeQuickActionPatch(label)
  };
}

export function prepareAnonymousSyncStart(
  state: LifeOSState,
  requestedCode: string | undefined,
  fallbackCode: string
): PreparedAnonymousSyncStart {
  const code = (requestedCode || fallbackCode).trim().toUpperCase();
  return {
    code,
    nextState: beginAnonymousSync(state, code),
    patch: {
      syncCodeInput: code
    }
  };
}

export function resolveAnonymousSyncRemoteState(
  nextState: LifeOSState,
  remoteState: LifeOSState,
  code: string
): AnonymousSyncRemoteResolution {
  const preferred = choosePreferredSyncState(nextState, remoteState);

  return {
    shouldPush: true,
    nextState: applyRemoteSyncedState(preferred, {
      syncCode: code,
      mode: "anonymous"
    })
  };
}

export function buildSyncSuccessState(state: LifeOSState, lastSyncedAt: string): LifeOSState {
  return markSyncSuccess(state, lastSyncedAt);
}

export function resolveRemoteRefreshState(localState: LifeOSState, remoteState: LifeOSState): LifeOSState | null {
  const preferred = choosePreferredSyncState(localState, remoteState);
  if (preferred.sync.updatedAt === remoteState.sync?.updatedAt && preferred.sync.syncCode === remoteState.sync?.syncCode) {
    return applyRemoteSyncedState(preferred);
  }

  return null;
}

export function resolveManualPullState(localState: LifeOSState, remoteState: LifeOSState, lastSyncedAt: string): LifeOSState {
  const preferred = choosePreferredSyncState(localState, remoteState);
  return applyRemoteSyncedState(preferred, {
    syncCode: localState.sync.syncCode,
    mode: "anonymous",
    lastSyncedAt
  });
}

export function resolveOutboundSyncState(
  localState: LifeOSState,
  remoteState: LifeOSState | null,
  syncCode = localState.sync.syncCode
): LifeOSState {
  const preferred = remoteState ? choosePreferredSyncState(localState, remoteState) : localState;
  return applyRemoteSyncedState(preferred, {
    syncCode,
    mode: "anonymous"
  });
}

export function buildBackupSaveResult(state: LifeOSState, backupCount: number, lastBackupAt: string): BackupSaveResult {
  return {
    nextState: markBackupSaved(state, lastBackupAt),
    patch: buildBackupCountPatch(backupCount)
  };
}

export function buildWorkComposerModalPatch(modalProjectId: string): WorkComposerPatch {
  return { modalProjectId };
}

export function buildWorkComposerClosePatch(): WorkComposerPatch {
  return buildWorkComposerModalPatch("");
}

export function buildWorkComposerDraftPatch(draft: string): WorkComposerPatch {
  return { draft };
}

export function buildWorkComposerResetPatch(): WorkComposerPatch {
  return {
    draft: "",
    modalProjectId: ""
  };
}

export function prepareWorkActionDraft(input: string, nowMs: number): PreparedWorkActionDraft | null {
  const label = input.trim();
  if (!label) return null;

  return {
    id: `work-action-${nowMs}`,
    label
  };
}

export function prepareWorkComposerSubmission(
  input: string,
  nowMs: number
): { action: PreparedWorkActionDraft; patch: WorkComposerPatch } | null {
  const action = prepareWorkActionDraft(input, nowMs);
  if (!action) return null;

  return {
    action,
    patch: buildWorkComposerResetPatch()
  };
}

export function buildWorkProjectActionControllers(
  controllers: WorkProjectActionControllers
): WorkProjectActionControllers {
  return controllers;
}

export function buildWorkComposerControllers(
  controllers: WorkComposerControllers
): WorkComposerControllers {
  return controllers;
}

export function buildWorkPageControllers(params: {
  projectActions: WorkProjectActionControllers;
  composerControls: WorkComposerControllers;
}): WorkPageControllers {
  return {
    projectActions: params.projectActions,
    composerControls: params.composerControls
  };
}

export function prepareNoteSave(params: {
  draft: NoteDraftValues;
  overrides?: Partial<NoteDraftValues>;
  paletteSize: number;
  createdAt: string;
}): { input: PreparedNoteInput; patch: NoteLocalPatch } | null {
  const { draft, overrides = {}, paletteSize, createdAt } = params;
  const title = (overrides.title ?? draft.title).trim();
  const content = (overrides.content ?? draft.content).trim();
  const type = overrides.type ?? draft.type;

  if (!title && !content) return null;

  return {
    input: {
      title,
      content,
      type,
      paletteSize,
      createdAt
    },
    patch: {
      draftTitle: DEFAULT_NOTE_RESET_STATE.title,
      draftContent: DEFAULT_NOTE_RESET_STATE.content,
      selectedNoteId: DEFAULT_NOTE_RESET_STATE.selectedNoteId,
      noteFilter: DEFAULT_NOTE_RESET_STATE.noteFilter
    }
  };
}

export function buildNoteDraftPatch(fields: Partial<Pick<NoteDraftValues, "title" | "content">>): NoteLocalPatch {
  return {
    ...(typeof fields.title === "string" ? { draftTitle: fields.title } : {}),
    ...(typeof fields.content === "string" ? { draftContent: fields.content } : {})
  };
}

export function buildNoteDraftTypePatch(nextType: string, options: { focusContent?: boolean } = {}): NoteLocalPatch {
  return {
    draftType: nextType,
    ...(options.focusContent ? { focusContent: true } : {})
  };
}

export function buildNoteFilterPatch(noteFilter: string): NoteLocalPatch {
  return { noteFilter };
}

export function buildNoteSelectionPatch(selectedNoteId: string): NoteLocalPatch {
  return { selectedNoteId };
}

export function getNextSelectedNoteIdAfterArchive(selectedNoteId: string, archivedNoteId: string): string {
  return selectedNoteId === archivedNoteId ? "" : selectedNoteId;
}

export function buildNoteArchivePatch(selectedNoteId: string, archivedNoteId: string): NoteLocalPatch {
  return {
    selectedNoteId: getNextSelectedNoteIdAfterArchive(selectedNoteId, archivedNoteId)
  };
}

export function buildSelectedNoteConsumedPatch(): NoteLocalPatch {
  return { selectedNoteId: "" };
}

export function prepareSelectedNoteConversion(note: NoteItem | null | undefined): SelectedNoteConversion | null {
  if (!note) return null;

  return {
    noteId: note.id,
    label: getNoteActionLabel(note)
  };
}

export function getFocusTaskOptionsForType(
  focusType: FocusType,
  focusTaskOptions: FocusTaskOptions
): FocusTaskOption[] {
  return focusType ? (focusTaskOptions[focusType] ?? []) : [];
}

export function buildOfficeSeatPatch(zoneId: string, seat: { id: string; x: number; y: number }): OfficePresencePatch {
  return {
    zoneId,
    seatId: seat.id,
    x: seat.x,
    y: seat.y
  };
}

export function buildOfficeStatusPatch(status: string): OfficePresencePatch {
  return { status };
}

export function buildOfficeKeyboardMovePatch(params: {
  current: OfficePresenceState;
  key: string;
  step: number;
  width: number;
  height: number;
}): OfficePresencePatch | null {
  const { current, key, step, width, height } = params;
  const normalizedKey = key.toLowerCase();
  if (!["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(normalizedKey)) return null;

  let x = current.x;
  let y = current.y;
  if (normalizedKey === "arrowup" || normalizedKey === "w") y -= step;
  if (normalizedKey === "arrowdown" || normalizedKey === "s") y += step;
  if (normalizedKey === "arrowleft" || normalizedKey === "a") x -= step;
  if (normalizedKey === "arrowright" || normalizedKey === "d") x += step;

  return {
    x: Math.max(24, Math.min(width - 24, x)),
    y: Math.max(24, Math.min(height - 24, y)),
    seatId: ""
  };
}

export function buildOfficeZoneSyncPatch(
  current: OfficePresenceState,
  zones: Array<{ id: string; x: number; y: number; width: number; height: number }>
): OfficePresencePatch | null {
  if (current.seatId) return null;

  const zone =
    zones.find(
      (item) =>
        current.x >= item.x &&
        current.x <= item.x + item.width &&
        current.y >= item.y &&
        current.y <= item.y + item.height
    ) ?? zones[0];

  if (!zone || zone.id === current.zoneId) return null;

  return {
    zoneId: zone.id
  };
}

export function buildStudySeatPatch(zoneId: string, seat: { id: string }): StudyPresencePatch {
  return {
    zoneId,
    seatId: seat.id
  };
}

export function buildStudyModePatch(mode: string): StudyPresencePatch {
  return { mode };
}
