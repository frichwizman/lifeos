"use client";

import type { ChangeEvent } from "react";
import { Download, Link2, RefreshCw, Save } from "lucide-react";
import type { AuthStatus, AuthUser, EditableProfileField, ProfileState, SyncState } from "@/lib/lifeos-types";

interface SettingsSyncSectionProps {
  syncCodeInput: string;
  syncState: SyncState;
  backupCount: number;
  authUser: AuthUser | null;
  authStatus: AuthStatus;
  authEmailInput: string;
  onSyncCodeChange: (value: string) => void;
  onAuthEmailChange: (value: string) => void;
  onSendLoginLink: () => void;
  onSignOut: () => void;
  onCreateSyncCode: () => void;
  onConnectCode: () => void;
  onPushNow: () => void;
  onPullNow: () => void;
  onSaveBackup: () => void;
  onExportBackup: () => void;
}

export function SettingsSyncSection({
  syncCodeInput,
  syncState,
  backupCount,
  authUser,
  authStatus,
  authEmailInput,
  onSyncCodeChange,
  onAuthEmailChange,
  onSendLoginLink,
  onSignOut,
  onCreateSyncCode,
  onConnectCode,
  onPushNow,
  onPullNow,
  onSaveBackup,
  onExportBackup
}: SettingsSyncSectionProps) {
  return (
    <div className="settings-group">
      <div className="group-title">Sync</div>
      <div className="controls-grid">
        <label>
          Account
          <input
            value={authUser?.email ?? (authStatus === "checking" ? "Checking..." : "Not signed in")}
            readOnly
          />
        </label>
        {!authUser ? (
          <label>
            Email
            <input
              type="email"
              value={authEmailInput}
              placeholder="you@example.com"
              onChange={(event: ChangeEvent<HTMLInputElement>) => onAuthEmailChange(event.currentTarget.value)}
            />
          </label>
        ) : null}
        <label>
          Sync Code
          <input value={syncCodeInput} onChange={(event: ChangeEvent<HTMLInputElement>) => onSyncCodeChange(event.currentTarget.value)} />
        </label>
        <label>
          Status
          <input value={syncState.mode === "anonymous" ? syncState.status : "local only"} readOnly />
        </label>
      </div>
      <div className="preset-row">
        {authUser ? (
          <button className="ghost-button" onClick={onSignOut}>
            Sign Out
          </button>
        ) : (
          <button className="ghost-button" onClick={onSendLoginLink} disabled={!authEmailInput.trim()}>
            Send Login Link
          </button>
        )}
        <button className="ghost-button" onClick={onCreateSyncCode}>
          <Link2 size={16} />
          Create Sync Code
        </button>
        <button className="ghost-button" onClick={onConnectCode}>
          <RefreshCw size={16} />
          Connect Code
        </button>
        <button className="ghost-button" onClick={onPushNow} disabled={!syncState.syncCode}>
          <RefreshCw size={16} />
          Push Now
        </button>
        <button className="ghost-button" onClick={onPullNow} disabled={!syncState.syncCode}>
          <Download size={16} />
          Pull Now
        </button>
        <button className="ghost-button" onClick={onSaveBackup}>
          <Save size={16} />
          Save Backup
        </button>
        <button className="ghost-button" onClick={onExportBackup}>
          <Download size={16} />
          Export JSON
        </button>
      </div>
      <p className="muted">
        Email sign-in syncs Money daily logs by account. Sync code remains as a compatibility fallback while the rest
        of LifeOS is migrated safely.
      </p>
      {syncState.syncCode ? (
        <p className="muted">
          Active code: <strong>{syncState.syncCode}</strong>
          {syncState.lastSyncedAt ? ` · Last sync ${new Date(syncState.lastSyncedAt).toLocaleTimeString()}` : ""}
        </p>
      ) : null}
      <p className="muted">
        Local backups: {backupCount}
        {syncState.lastBackupAt ? ` · Last backup ${new Date(syncState.lastBackupAt).toLocaleTimeString()}` : ""}
      </p>
      {syncState.error ? <p className="muted">{syncState.error}</p> : null}
    </div>
  );
}

interface SettingsProfileInputProps {
  profile: ProfileState;
  onProfileInput: (key: EditableProfileField, value: string) => void;
}

interface SettingsProfileSectionProps extends SettingsProfileInputProps {
  currencies: readonly string[];
}

export function SettingsProfileSection({ profile, currencies, onProfileInput }: SettingsProfileSectionProps) {
  return (
    <div className="settings-group">
      <div className="group-title">Profile</div>
      <div className="controls-grid">
        <label>
          Name
          <input value={profile.name || ""} onChange={(event: ChangeEvent<HTMLInputElement>) => onProfileInput("name", event.currentTarget.value)} />
        </label>
        <label>
          Currency
          <select value={profile.currency} onChange={(event: ChangeEvent<HTMLSelectElement>) => onProfileInput("currency", event.currentTarget.value)}>
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function SettingsTimelineSection({ profile, onProfileInput }: SettingsProfileInputProps) {
  return (
    <div className="settings-group">
      <div className="group-title">Timeline</div>
      <div className="controls-grid">
        <label>
          Age
          <input type="number" value={profile.age} onChange={(event: ChangeEvent<HTMLInputElement>) => onProfileInput("age", event.currentTarget.value)} />
        </label>
        <label>
          Retirement Age
          <input
            type="number"
            value={profile.retirementAge}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onProfileInput("retirementAge", event.currentTarget.value)}
          />
        </label>
      </div>
    </div>
  );
}

export function SettingsTargetsSection({ profile, onProfileInput }: SettingsProfileInputProps) {
  return (
    <div className="settings-group">
      <div className="group-title">Targets</div>
      <div className="controls-grid">
        <label>
          Year Goal
          <input
            type="number"
            value={profile.yearGoal}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onProfileInput("yearGoal", event.currentTarget.value)}
          />
        </label>
      </div>
    </div>
  );
}
