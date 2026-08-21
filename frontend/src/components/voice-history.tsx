"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, MicrophoneIcon, TrashIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useVoiceAdvice } from "@/lib/voice-advice";
import styles from "./voice-history.module.css";

export function VoiceHistorySection() {
  const { voiceSessions, latestCheckin, latestAdvice, isHydrated, deleteVoiceSession, resetAll } = useVoiceAdvice();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <section className={styles.section}>
        <h2>Voice history</h2>
        <p className={styles.muted}>Loading your local voice history…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <h2>Voice history</h2>
          <p>Stored only in this browser. Demo history keeps transcripts and results, not raw audio.</p>
        </div>
        <div className={styles.summary}>
          <span><CheckIcon size={16} aria-hidden="true" />{latestCheckin ? `Check-in captured · ${formatLocalDate(latestCheckin.localDate)}` : "No check-in yet"}</span>
          {latestAdvice ? <span>Latest run: {latestAdvice.safetyLevel}</span> : null}
        </div>
      </header>
      {voiceSessions.length === 0 ? (
        <p className={styles.empty}>
          <MicrophoneIcon size={18} aria-hidden="true" />
          No voice sessions yet. <Link href="/check-in">Run your first check-in</Link> to see them here.
        </p>
      ) : (
        <ul className={styles.list}>
          {voiceSessions.map((session) => (
            <li key={session.sessionId} className={styles.item} data-state={session.state}>
              <div>
                <strong>{new Date(session.startedAt).toLocaleString()}</strong>
                <p>
                  {session.language} · {session.sttProviderKey} · {session.confirmedSegmentCount} confirmed · {session.flaggedSegmentCount} flagged
                </p>
              </div>
              <span className={styles.state}>{session.state}</span>
              {confirmDelete === session.sessionId ? (
                <div className={styles.confirm}>
                  <span><WarningCircleIcon size={16} aria-hidden="true" /> Delete this session?</span>
                  <button
                    className="button button-secondary"
                    onClick={() => {
                      deleteVoiceSession(session.sessionId);
                      setConfirmDelete(null);
                    }}
                  >
                    <TrashIcon size={14} aria-hidden="true" /> Confirm
                  </button>
                  <button className="button button-secondary" onClick={() => setConfirmDelete(null)}>
                    <XIcon size={14} aria-hidden="true" /> Cancel
                  </button>
                </div>
              ) : (
                <button className="button button-secondary" onClick={() => setConfirmDelete(session.sessionId)} aria-label={`Delete voice session from ${new Date(session.startedAt).toLocaleString()}`}>
                  <TrashIcon size={14} aria-hidden="true" /> Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className={styles.footer}>
        <Link className="button button-primary" href="/check-in">Start a new check-in</Link>
        <button
          className="button button-secondary"
          onClick={() => {
            if (window.confirm("Reset voice history, check-ins, advice runs, and brain scores for Alex?")) {
              resetAll();
            }
          }}
        >
          Reset all demo voice data
        </button>
      </div>
    </section>
  );
}

function formatLocalDate(value: string) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}
