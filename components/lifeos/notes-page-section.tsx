"use client";

import type { ChangeEvent, CSSProperties, MouseEvent, RefObject } from "react";
import { Archive, Command, FileText, Pin, Plus, RefreshCw, Save } from "lucide-react";
import type { CardShellComponent, ModuleCardShellComponent } from "@/components/lifeos/section-shell-types";
import type { MiscTodoCategory, NoteCollections, NoteItem, SelectedNoteConversion } from "@/lib/lifeos-types";

type NotesSidebarCategory = Exclude<MiscTodoCategory, "daily">;

interface NotesPageSectionProps {
  Card: CardShellComponent;
  ModuleCard: ModuleCardShellComponent;
  utilityColor: string;
  noteDraftType: string;
  noteDraftTitle: string;
  noteDraftContent: string;
  noteContentRef: RefObject<HTMLTextAreaElement | null>;
  canSaveNote: boolean;
  filteredNoteItems: NoteItem[];
  selectedNoteId: string;
  noteCardColors: string[];
  noteTextColor: string;
  noteSubtextColor: string;
  noteFilter: string;
  noteFilters: string[];
  noteCounts: NoteCollections["counts"];
  noteTypes: string[];
  hasSelectedNote: boolean;
  selectedNoteConversion: SelectedNoteConversion | null;
  formatNoteDate: (value: string) => string;
  onDraftTitleChange: (value: string) => void;
  onDraftContentChange: (value: string) => void;
  onSaveNote: () => void;
  onSelectNote: (noteId: string) => void;
  onToggleNotePin: (noteId: string) => void;
  onToggleNoteArchive: (noteId: string) => void;
  onQuickCapture: (type: string) => void;
  onFilterSelect: (filterLabel: string) => void;
  onTypeSelect: (type: string) => void;
  onMoveNoteToTodo: (category: NotesSidebarCategory) => void;
  onConvertNoteToProject: () => void;
  onConvertNoteToDailyAction: () => void;
}

type NoteCardStyle = CSSProperties & {
  "--note-bg": string;
  "--note-text": string;
  "--note-subtext": string;
};

export function NotesPageSection({
  Card,
  ModuleCard,
  utilityColor,
  noteDraftType,
  noteDraftTitle,
  noteDraftContent,
  noteContentRef,
  canSaveNote,
  filteredNoteItems,
  selectedNoteId,
  noteCardColors,
  noteTextColor,
  noteSubtextColor,
  noteFilter,
  noteFilters,
  noteCounts,
  noteTypes,
  hasSelectedNote,
  selectedNoteConversion,
  formatNoteDate,
  onDraftTitleChange,
  onDraftContentChange,
  onSaveNote,
  onSelectNote,
  onToggleNotePin,
  onToggleNoteArchive,
  onQuickCapture,
  onFilterSelect,
  onTypeSelect,
  onMoveNoteToTodo,
  onConvertNoteToProject,
  onConvertNoteToDailyAction
}: NotesPageSectionProps) {
  return (
    <section className="life-page-layout">
      <div className="life-page-primary">
        <ModuleCard title="Notes" color={utilityColor} icon={FileText}>
          <div className="notes-stack">
            <section className="note-composer">
              <div className="note-composer-head">
                <div>
                  <p className="eyebrow">Quick Add</p>
                  <strong>Notes</strong>
                </div>
                <span className="note-type-pill">{noteDraftType}</span>
              </div>

              <input
                className="note-title-input"
                value={noteDraftTitle}
                placeholder="Optional title"
                onChange={(event: ChangeEvent<HTMLInputElement>) => onDraftTitleChange(event.currentTarget.value)}
              />
              <textarea
                ref={noteContentRef}
                className="note-content-input"
                value={noteDraftContent}
                placeholder="Capture a thought, draft, or temporary note"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onDraftContentChange(event.currentTarget.value)}
              />
              <div className="note-composer-actions">
                <span className="muted">Type · {noteDraftType}</span>
                <button className="ghost-button" onClick={onSaveNote} disabled={!canSaveNote}>
                  <Save size={16} />
                  Save
                </button>
              </div>
            </section>

            <div className="notes-grid">
              {filteredNoteItems.length ? (
                filteredNoteItems.map((note) => (
                  <article
                    key={note.id}
                    className={`note-card ${selectedNoteId === note.id ? "is-selected" : ""}`}
                    style={{
                      "--note-bg": noteCardColors[note.colorIndex % noteCardColors.length],
                      "--note-text": noteTextColor,
                      "--note-subtext": noteSubtextColor
                    } as NoteCardStyle}
                    onClick={() => onSelectNote(note.id)}
                  >
                    <div className="note-card-head">
                      <span className="note-type-badge">{note.type}</span>
                      <div className="note-card-actions">
                        <button
                          className={`note-card-action-button ${note.pinned ? "is-active" : ""}`}
                          aria-label="Pin note"
                          onClick={(event: MouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            onToggleNotePin(note.id);
                          }}
                        >
                          <Pin size={13} strokeWidth={1.9} />
                        </button>
                        <button
                          className="note-card-action-button"
                          aria-label={note.archived ? "Restore note" : "Archive note"}
                          onClick={(event: MouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            onToggleNoteArchive(note.id);
                          }}
                        >
                          <Archive size={13} strokeWidth={1.9} />
                        </button>
                      </div>
                    </div>
                    {note.title ? <h3>{note.title}</h3> : null}
                    <p className="note-card-preview">{note.content || "Untitled note"}</p>
                    <div className="note-card-meta">
                      <span>Created {formatNoteDate(note.createdAt)}</span>
                      <span>Updated {formatNoteDate(note.updatedAt)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="note-empty-card">
                  <strong>No notes yet</strong>
                  <p className="muted">Capture quick ideas here before moving them into Work, Study, or Life.</p>
                </div>
              )}
            </div>
          </div>
        </ModuleCard>
      </div>

      <aside className="life-page-secondary">
        <div className="money-sidebar-stack notes-sidebar-stack">
          <Card title="Quick Capture" icon={Plus} className="notes-sidebar-card">
            <div className="notes-sidebar-actions is-inline-row">
              <button className="ghost-button notes-sidebar-button" onClick={() => onQuickCapture("Draft")}>
                New Note
              </button>
              <button className="ghost-button notes-sidebar-button" onClick={() => onQuickCapture("Idea")}>
                Quick Idea
              </button>
              <button className="ghost-button notes-sidebar-button" onClick={() => onQuickCapture("Temporary")}>
                Temporary Note
              </button>
            </div>
          </Card>

          <Card title="Filters" icon={Command} className="notes-sidebar-card">
            <div className="notes-sidebar-actions is-inline-row">
              {noteFilters.map((filterLabel) => (
                <button
                  key={filterLabel}
                  className={`ghost-button notes-sidebar-button ${noteFilter === filterLabel ? "is-active" : ""}`}
                  onClick={() => onFilterSelect(filterLabel)}
                >
                  <span>{filterLabel}</span>
                  <strong>
                    {filterLabel === "All"
                      ? noteCounts.all
                      : filterLabel === "Pinned"
                        ? noteCounts.pinned
                        : filterLabel === "Recent"
                          ? noteCounts.recent
                          : noteCounts.archived}
                  </strong>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Note Types" icon={FileText} className="notes-sidebar-card">
            <div className="notes-sidebar-actions is-inline-row">
              {noteTypes.map((type) => (
                <button
                  key={type}
                  className={`ghost-button notes-sidebar-button ${noteDraftType === type ? "is-active" : ""}`}
                  onClick={() => onTypeSelect(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Convert / Move" icon={RefreshCw} className="notes-sidebar-card">
            <div className="notes-sidebar-actions">
              <button className="ghost-button notes-sidebar-button" disabled={!hasSelectedNote} onClick={() => onMoveNoteToTodo("work")}>
                Move to Work
              </button>
              <button className="ghost-button notes-sidebar-button" disabled={!hasSelectedNote} onClick={() => onMoveNoteToTodo("study")}>
                Move to Study
              </button>
              <button className="ghost-button notes-sidebar-button" disabled={!hasSelectedNote} onClick={() => onMoveNoteToTodo("life")}>
                Move to Life
              </button>
              <button className="ghost-button notes-sidebar-button" disabled={!hasSelectedNote} onClick={onConvertNoteToProject}>
                Turn into Project
              </button>
              <button className="ghost-button notes-sidebar-button" disabled={!hasSelectedNote} onClick={onConvertNoteToDailyAction}>
                Turn into Daily Action
              </button>
            </div>
            <p className="muted notes-sidebar-helper">
              {selectedNoteConversion ? `Selected: ${selectedNoteConversion.label}` : "Select a note first to convert or move it."}
            </p>
          </Card>
        </div>
      </aside>
    </section>
  );
}
