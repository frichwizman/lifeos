"use client";

import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { BriefcaseBusiness, Command, Play, Plus, Trash2 } from "lucide-react";
import type { CardShellComponent, ModuleCardShellComponent } from "@/components/lifeos/section-shell-types";
import type { WorkPageControllers, WorkPageViewModel } from "@/lib/lifeos-types";

interface WorkPageSectionProps {
  Card: CardShellComponent;
  ModuleCard: ModuleCardShellComponent;
  workModuleColor: string;
  workPageViewModel: WorkPageViewModel;
  workPageControllers: WorkPageControllers;
  formatNumber: (value: number) => string;
}

export function WorkPageSection({
  Card,
  ModuleCard,
  workModuleColor,
  workPageViewModel,
  workPageControllers,
  formatNumber
}: WorkPageSectionProps) {
  const {
    projectViewModels,
    sidebarSummary,
    executionSummary,
    composerViewModel
  } = workPageViewModel;
  const { projectActions, composerControls } = workPageControllers;
  const { renameProject, renameTodayAction, deleteTodayAction, launchFocus, toggleTodo } = projectActions;
  const { open, close, updateDraft, moveActionToToday, addDraftAction } = composerControls;
  const activeComposerProject = composerViewModel.activeProject;

  return (
    <section className="life-page-layout">
      <div className="life-page-primary">
        <ModuleCard title="Work" color={workModuleColor} icon={BriefcaseBusiness}>
          <div className="project-list project-list-split">
            {projectViewModels.map(({ project, slotLabel, todayCount, status, todayActions }) => {

              return (
                <div key={project.id} className="project-column">
                  <div className="project-heading">
                    <strong>{slotLabel}</strong>
                    <button className="ghost-button" onClick={() => open(project.id)} disabled={todayCount >= 5}>
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
                        onChange={(event: ChangeEvent<HTMLInputElement>) => renameProject(project.id, event.currentTarget.value)}
                        aria-label={`${project.name} project name`}
                      />
                      <small>{todayCount} / 5</small>
                    </div>
                    <p className={`project-target-copy ${status.tone}`}>{status.message}</p>

                    <div className="work-action-list">
                      {todayActions.length ? (
                        todayActions.map(({ action, done }) => {
                          return (
                            <article key={action.id} className={`work-action-card ${done ? "is-done" : ""}`}>
                              <div className="work-action-copy">
                                <div className="work-action-main">
                                  <input
                                    className="work-action-input"
                                    value={action.label}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                      renameTodayAction(project.id, action.id, event.currentTarget.value)
                                    }
                                  />
                                  <button className="icon-button" aria-label="Delete action" onClick={() => deleteTodayAction(project.id, action.id)}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="work-action-controls">
                                <button className="ghost-button" onClick={() => launchFocus(project, action)} disabled={done}>
                                  <Play size={16} />
                                  Focus
                                </button>
                                <label className="work-action-check">
                                  <input type="checkbox" checked={done} onChange={() => toggleTodo(project.id, action.id)} />
                                  <span>Done</span>
                                </label>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <div className="misc-todo-empty">
                          <p className="muted">Build 3-5 concrete actions here. Each one should be executable without extra planning.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ModuleCard>
      </div>

      <aside className="life-page-secondary">
        <div className="money-sidebar-stack">
          <Card title="Today" icon={BriefcaseBusiness} className="life-quick-card">
            <div className="money-summary-grid">
              <div className="money-summary-item">
                <span>Total Actions</span>
                <strong>{formatNumber(sidebarSummary.total)}</strong>
              </div>
              <div className="money-summary-item">
                <span>Open</span>
                <strong>{formatNumber(sidebarSummary.open)}</strong>
              </div>
              <div className="money-summary-item">
                <span>Done</span>
                <strong>{formatNumber(sidebarSummary.done)}</strong>
              </div>
            </div>
          </Card>

          <Card title="Execution Rule" icon={Play} className="life-quick-card">
            <div className="money-summary-grid">
              <div className="money-summary-item">
                <span>Ready Projects</span>
                <strong>{formatNumber(executionSummary.readyProjects)}</strong>
              </div>
              <div className="money-summary-item">
                <span>Need Actions</span>
                <strong>{formatNumber(executionSummary.missingActions)}</strong>
              </div>
              <div className="money-summary-item">
                <span>Projects Short</span>
                <strong>{formatNumber(executionSummary.projectsNeedingActions)}</strong>
              </div>
            </div>
            <p className="muted">Focus completion is the main XP source. Manual done closes the action without extra focus XP.</p>
          </Card>

          <Card title="Projects" icon={Command} className="life-quick-card">
            <div className="money-summary-grid">
              {sidebarSummary.projects.map((project) => (
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

      {composerViewModel.isOpen ? (
        <div className="focus-task-modal-backdrop" onClick={close}>
          <div className="focus-task-modal" onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
            <div className="focus-task-modal-head">
              <div>
                <p className="eyebrow">Today Actions</p>
                <h3>{composerViewModel.title}</h3>
              </div>
              <button className="ghost-button" onClick={close}>
                Close
              </button>
            </div>

            {activeComposerProject ? (
              <div className="work-action-modal-stack">
                {composerViewModel.nextDayCandidates.length ? (
                  <div className="work-action-modal-section">
                    <span className="eyebrow">Next Day Candidates</span>
                    <div className="focus-task-modal-list">
                      {composerViewModel.nextDayCandidates.map((action) => (
                        <button
                          key={action.id}
                          className="focus-task-option"
                          onClick={() => {
                            moveActionToToday(activeComposerProject.id, action, "candidate");
                            close();
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
                    {composerViewModel.backlog.length ? (
                      composerViewModel.backlog.map((action) => (
                        <button
                          key={action.id}
                          className="focus-task-option"
                          onClick={() => {
                            moveActionToToday(activeComposerProject.id, action, "backlog");
                            close();
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
                      value={composerViewModel.draft}
                      placeholder="Write one concrete executable action"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => updateDraft(event.currentTarget.value)}
                      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                        if (event.key === "Enter") addDraftAction(activeComposerProject.id);
                      }}
                    />
                    <button className="ghost-button" onClick={() => addDraftAction(activeComposerProject.id)}>
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
