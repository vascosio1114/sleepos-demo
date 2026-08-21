"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  MicrophoneIcon,
  PauseIcon,
  PlayIcon,
  SpeakerSimpleHighIcon,
  StopIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { DemoControlPanel } from "@/components/demo-control-panel";
import { useDemoControl, type DemoScript } from "@/lib/demo-control";
import {
  adviceStore,
  checkinStore,
  cryptoRandomUUID,
  findScenario,
  generateMockAdvice,
  notifyVoiceAdviceStoreUpdated,
  voiceAdviceApi,
  scenariosByCategory,
  voiceStore,
  type DemoScenario,
  type HealthCheckin,
  type TranscriptResult,
  type AdviceOutput,
  type SafetyLevel,
  type VoiceSession,
  SAFETY_COPY,
} from "@/lib/voice-advice";
import styles from "./check-in-experience.module.css";

type Stage = "intro" | "select" | "recording" | "transcript" | "checkin" | "advice";
type AnalysisStep = "Saving check-in" | "Safety routing" | "Generating advice" | "Preparing audio";

interface CheckinDraft {
  sleepQualityScore: number | null;
  sleepMinutes: number | null;
  stressScore: number | null;
  moodScore: number | null;
  focusScore: number | null;
  confirmedNote: string;
}

const initialCheckin: CheckinDraft = {
  sleepQualityScore: null,
  sleepMinutes: null,
  stressScore: null,
  moodScore: null,
  focusScore: null,
  confirmedNote: "",
};

const MAX_RECORD_SECONDS = 60;

function rememberSession(session: VoiceSession) {
  const snapshot = voiceStore.load();
  snapshot.sessions = [session, ...snapshot.sessions.filter((item) => item.sessionId !== session.sessionId)].slice(0, 50);
  snapshot.activeSessionId = session.sessionId;
  voiceStore.save(snapshot);
  notifyVoiceAdviceStoreUpdated();
}

export function CheckInExperience() {
  const [stage, setStage] = useState<Stage>("intro");
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [transcriptConfirmed, setTranscriptConfirmed] = useState(false);
  const [checkin, setCheckin] = useState<CheckinDraft>(initialCheckin);
  const [, setSavedCheckin] = useState<HealthCheckin | null>(null);
  const [advice, setAdvice] = useState<AdviceOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number>(0);
  const audioChunksRef = useRef<Blob[]>([]);
  const captureSampleRateRef = useRef<number>(16000);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const groups = useMemo(() => scenariosByCategory(), []);
  const isMicSupported = useMemo(() => {
    if (typeof window === "undefined") return true;
    return typeof window.MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
  }, []);
  const { mode: demoMode, activeScript, setScript, setHighlight } = useDemoControl();
  const isLiveDemo = demoMode === "live";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSpeechSynthesis = typeof window.speechSynthesis !== "undefined";
    if (!hasSpeechSynthesis) {
      queueMicrotask(() => setError((prev) => prev ?? "Browser does not support speech synthesis. Text fallback remains."));
    }
  }, []);

  const cleanupRecording = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => undefined);
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    recorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
  }, []);

  useEffect(() => () => cleanupRecording(), [cleanupRecording]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const tick = () => {
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(99, 200, 255, 0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(99, 200, 255, 0.95)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128 - 1;
        const y = canvas.height / 2 + v * (canvas.height / 2 - 4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setSelectedScenario(null);
    if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
      setError("Recording is unavailable in this browser. Pick a demo scenario instead.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot access the microphone over HTTPS or localhost.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      audioChunksRef.current = [];
      // Prefer audio/webm; codecs vary by browser. We still record
      // here for the waveform; PCM conversion happens post-stop via
      // an AudioContext decode (handled in finishAfterRecording).
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      });
      captureSampleRateRef.current = audioCtx.sampleRate;
      recorder.start(100);
      recordingStartRef.current = Date.now();
      setIsRecording(true);
      setRecordingSeconds(0);
      setStage("recording");
      drawWaveform();
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartRef.current) / 1000);
        setRecordingSeconds(elapsed);
        if (elapsed >= MAX_RECORD_SECONDS && recorderRef.current && recorderRef.current.state !== "inactive") {
          recorderRef.current.stop();
        }
      }, 250);
    } catch (err) {
      setError(err instanceof Error ? `Microphone unavailable: ${err.message}` : "Microphone unavailable.");
      cleanupRecording();
    }
  }, [cleanupRecording, drawWaveform]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  function mixToMono(audioBuffer: AudioBuffer): Float32Array {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const out = new Float32Array(length);
    for (let c = 0; c < channels; c++) {
      const data = audioBuffer.getChannelData(c);
      for (let i = 0; i < length; i++) out[i] += data[i] / channels;
    }
    return out;
  }

  function pcmFloat32ToInt16Base64(samples: Float32Array): string {
    const buffer = new ArrayBuffer(samples.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < samples.length; i++) {
      const clamped = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    if (typeof btoa === "function") return btoa(binary);
    return Buffer.from(bytes).toString("base64");
  }

  const finishAfterRecording = useCallback(async () => {
    cleanupRecording();
    try {
      // Decode the recorded Blob (typically audio/webm) into PCM 16-bit
      // mono @ the captured sample rate, then POST to the server for
      // STT. If decode fails (e.g. unsupported codec), fall back to
      // duration-only (mock transcript on server).
      let pcmBytesBase64: string | undefined;
      const sampleRate = Math.round(captureSampleRateRef.current);
      const audioBlob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0]?.type ?? "audio/webm" });
      try {
        if (audioBlob.size > 0 && typeof window !== "undefined" && typeof window.OfflineAudioContext !== "undefined") {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const decodeCtx = new OfflineAudioContext(1, 1, sampleRate);
          const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
          const mono = decoded.numberOfChannels > 1 ? mixToMono(decoded) : decoded.getChannelData(0);
          pcmBytesBase64 = pcmFloat32ToInt16Base64(mono);
        }
      } catch (decodeErr) {
        console.warn("[check-in] PCM decode failed, falling back to mock transcript:", decodeErr);
      }

      const open = await voiceAdviceApi.openSession({ language: "en-US", userId: "demo_001" });
      rememberSession(open.session);
      setActiveSessionId(open.session.sessionId);
      const result = await voiceAdviceApi.finishSession({
        sessionId: open.session.sessionId,
        audioDurationSeconds: recordingSeconds,
        pcmBytesBase64,
        sampleRateHz: sampleRate,
      });
      voiceStore.updateSession(result.session.sessionId, result.session);
      voiceStore.saveTranscript(result.transcript.sessionId, result.transcript);
      notifyVoiceAdviceStoreUpdated();
      setTranscript(result.transcript);
      setStage("transcript");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch mock transcript.");
    }
  }, [cleanupRecording, recordingSeconds]);

  useEffect(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    const onStop = () => {
      void finishAfterRecording();
    };
    recorder.addEventListener("stop", onStop);
    return () => recorder.removeEventListener("stop", onStop);
  }, [finishAfterRecording]);

  const loadScenario = useCallback(async (scenario: DemoScenario) => {
    setError(null);
    setSelectedScenario(scenario);
    setCheckin({
      sleepQualityScore: scenario.checkin.sleepQualityScore,
      sleepMinutes: scenario.checkin.sleepMinutes,
      stressScore: scenario.checkin.stressScore,
      moodScore: scenario.checkin.moodScore,
      focusScore: scenario.checkin.focusScore,
      confirmedNote: scenario.checkin.confirmedNote ?? "",
    });
    try {
      const open = await voiceAdviceApi.openSession({ language: "en-US", userId: "demo_001" });
      rememberSession(open.session);
      setActiveSessionId(open.session.sessionId);
      const result = await voiceAdviceApi.finishSession({ sessionId: open.session.sessionId, scenarioId: scenario.id });
      voiceStore.updateSession(result.session.sessionId, result.session);
      voiceStore.saveTranscript(result.transcript.sessionId, result.transcript);
      notifyVoiceAdviceStoreUpdated();
      setTranscript(result.transcript);
      setStage("transcript");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load demo scenario.");
    }
  }, []);

  const runScript = useCallback((script: DemoScript) => {
    setScript(script.id);
    setHighlight(script.brainFocus);
    const scenario = findScenario(script.scenarioId);
    if (scenario) void loadScenario(scenario);
  }, [loadScenario, setHighlight, setScript]);

  const confirmTranscript = useCallback(async () => {
    if (!transcript || !activeSessionId) return;
    const confirmedSegments = transcript.segments.map((segment) => ({ ...segment, isConfirmed: true }));
    try {
      await voiceAdviceApi.confirmTranscript({ sessionId: activeSessionId, segments: confirmedSegments });
      voiceStore.updateSession(activeSessionId, {
        confirmedSegmentCount: confirmedSegments.filter((segment) => segment.isConfirmed).length,
        state: "confirmed",
      });
      voiceStore.saveTranscript(activeSessionId, {
        ...transcript,
        segments: confirmedSegments,
      });
      notifyVoiceAdviceStoreUpdated();
      setTranscript((prev) =>
        prev ? { ...prev, segments: confirmedSegments } : prev,
      );
      setTranscriptConfirmed(true);
      setStage("checkin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm transcript.");
    }
  }, [activeSessionId, transcript]);

  const editSegment = useCallback((segmentId: string, newText: string) => {
    setTranscript((prev) =>
      prev
        ? { ...prev, segments: prev.segments.map((s) => (s.segmentId === segmentId ? { ...s, text: newText, userEdited: true } : s)) }
        : prev,
    );
  }, []);

  const submitCheckin = useCallback(async () => {
    if (!activeSessionId || !transcript) return;
    setError(null);
    setIsAnalyzing(true);
    setAnalysisSteps(["Saving check-in"]);
    try {
      const localDate = new Date().toISOString().slice(0, 10);
      const saved = await voiceAdviceApi.saveCheckin({
        userId: "demo_001",
        localDate,
        schemaVersion: "health-checkin-v1",
        source: "voice_confirmed",
        capturedAt: new Date().toISOString(),
        sleepQualityScore: checkin.sleepQualityScore,
        sleepMinutes: checkin.sleepMinutes,
        stressScore: checkin.stressScore,
        moodScore: checkin.moodScore,
        focusScore: checkin.focusScore,
        confirmedNote: checkin.confirmedNote.trim().length > 0 ? checkin.confirmedNote.trim() : null,
        sourceSegmentIds: transcript.segments.map((s) => s.segmentId),
      });
      checkinStore.save(saved);
      notifyVoiceAdviceStoreUpdated();
      setSavedCheckin(saved);
      setAnalysisSteps(["Saving check-in", "Safety routing", "Generating advice"]);
      const sessionMarker = selectedScenario ? `scenario:${selectedScenario.id}` : activeSessionId;
      const transcriptText = transcript.segments.map((s) => s.text).join(" ");
      const result = isLiveDemo
        ? await voiceAdviceApi.runAdvice({
          checkinId: saved.checkinId,
          sessionId: sessionMarker,
          transcriptText,
        })
        : generateMockAdvice({
          adviceRunId: cryptoRandomUUID(),
          checkin: saved,
          transcriptText,
          scenarioId: selectedScenario?.id,
        });
      setAnalysisSteps(["Saving check-in", "Safety routing", "Generating advice", "Preparing audio"]);
      adviceStore.save(result);
      voiceStore.setState(activeSessionId, "completed");
      notifyVoiceAdviceStoreUpdated();
      setHighlight(activeScript?.brainFocus ?? result.brainDomains[0]?.key ?? null);
      setAdvice(result);
      setStage("advice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit check-in or generate advice.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeSessionId, activeScript, checkin, isLiveDemo, selectedScenario, setHighlight, transcript]);

  const playAdvice = useCallback(() => {
    if (!advice || typeof window === "undefined" || !window.speechSynthesis) {
      setError((prev) => prev ?? "Speech unavailable in this browser; text fallback is below.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(advice.speakableText);
    utterance.lang = "en-US";
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [advice]);

  const stopPlayback = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setIsPlaying(false);
  }, []);

  const resetAll = useCallback(() => {
    cleanupRecording();
    setStage("intro");
    setSelectedScenario(null);
    setTranscript(null);
    setActiveSessionId(null);
    setTranscriptConfirmed(false);
    setCheckin(initialCheckin);
    setSavedCheckin(null);
    setAdvice(null);
    setError(null);
    setIsAnalyzing(false);
    setAnalysisSteps([]);
    setRecordingSeconds(0);
    stopPlayback();
  }, [cleanupRecording, stopPlayback]);

  return (
    <div className={`page-container ${styles.page}`}>
      <header className={styles.header}>
        <Link className={styles.back} href="/">
          <ArrowLeftIcon size={18} aria-hidden="true" />
          Back to Home
        </Link>
        <div>
          <p className="eyebrow">Voice check-in · Demo mode</p>
          <h1>Tell SleepOS how today is going.</h1>
          <p className={styles.scope}>{SAFETY_COPY.wellnessScope.text}</p>
        </div>
        {stage !== "intro" ? (
          <button className={`button button-secondary ${styles.reset}`} onClick={resetAll}>
            <TrashIcon size={16} aria-hidden="true" /> Reset
          </button>
        ) : null}
      </header>

      <DemoControlPanel compact onRunScript={runScript} />

      {error ? (
        <p className={styles.error} role="alert">
          <WarningCircleIcon size={18} aria-hidden="true" /> {error}
        </p>
      ) : null}

      {stage === "intro" ? <IntroStage onStart={() => setStage("select")} /> : null}

      {stage === "select" ? (
        <SelectStage
          groups={groups}
          isMicSupported={isMicSupported}
          demoMode={demoMode}
          onScenario={loadScenario}
          onRecord={startRecording}
          onCancel={resetAll}
        />
      ) : null}

      {stage === "recording" ? (
        <RecordingStage
          seconds={recordingSeconds}
          canvasRef={canvasRef}
          onStop={stopRecording}
          onCancel={() => {
            cleanupRecording();
            setStage("select");
          }}
        />
      ) : null}

      {stage === "transcript" && transcript ? (
        <TranscriptStage
          transcript={transcript}
          confirmed={transcriptConfirmed}
          onEdit={editSegment}
          onConfirm={confirmTranscript}
          onBack={() => setStage("select")}
        />
      ) : null}

      {stage === "checkin" && isAnalyzing ? (
        <AnalysisStage mode={demoMode} steps={analysisSteps} />
      ) : null}

      {stage === "checkin" && !isAnalyzing ? (
        <CheckinStage
          value={checkin}
          onChange={setCheckin}
          onSubmit={submitCheckin}
          onBack={() => setStage("transcript")}
        />
      ) : null}

      {stage === "advice" && advice ? (
        <AdviceStage
          advice={advice}
          isPlaying={isPlaying}
          onPlay={playAdvice}
          onStop={stopPlayback}
          onReset={resetAll}
          scenarioTitle={selectedScenario?.title ?? null}
          nextRoute={activeScript?.nextRoute ?? "/explore?view=brain"}
        />
      ) : null}

      <p className={styles.disclaimer}>{SAFETY_COPY.wellnessDisclaimer.text}</p>
    </div>
  );
}

function IntroStage({ onStart }: Readonly<{ onStart: () => void }>) {
  return (
    <section className={styles.intro}>
      <ol>
        <li>
          <strong>1. Pick a demo scenario</strong>
          <span>Eighteen preset transcripts, one per safety category.</span>
        </li>
        <li>
          <strong>2. Review the transcript</strong>
          <span>Low-confidence numbers and negations are flagged for confirmation.</span>
        </li>
        <li>
          <strong>3. Confirm five fields</strong>
          <span>Sleep quality, sleep minutes, stress, mood, focus.</span>
        </li>
        <li>
          <strong>4. Listen to the advice</strong>
          <span>Browser-native speech reads the validated guidance.</span>
        </li>
      </ol>
      <button className="button button-primary" onClick={onStart}>
        Start voice check-in <ArrowRightIcon size={18} aria-hidden="true" />
      </button>
    </section>
  );
}

function SelectStage({
  groups,
  isMicSupported,
  demoMode,
  onScenario,
  onRecord,
  onCancel,
}: Readonly<{
  groups: ReturnType<typeof scenariosByCategory>;
  isMicSupported: boolean;
  demoMode: "stable" | "live";
  onScenario: (scenario: DemoScenario) => void;
  onRecord: () => void;
  onCancel: () => void;
}>) {
  return (
    <section className={styles.select}>
      <header>
        <p className="eyebrow">Choose how you want to check in</p>
        <h2>Pick a demo scenario or use your voice.</h2>
        <p>Each scenario maps to one safety routing level (Green / Amber / Red).</p>
      </header>
      <div className={styles.modeRow}>
        {demoMode === "stable" ? (
          <span className={styles.notice}>Stable Demo uses preset transcripts and instant mock advice.</span>
        ) : isMicSupported ? (
          <button className="button button-primary" onClick={onRecord}>
            <MicrophoneIcon size={18} aria-hidden="true" /> Use my voice
          </button>
        ) : (
          <span className={styles.notice}>Recording not supported in this browser. Pick a demo scenario below.</span>
        )}
        <button className="button button-secondary" onClick={onCancel}>
          <XIcon size={16} aria-hidden="true" /> Cancel
        </button>
      </div>
      <div className={styles.groups}>
        {Object.entries(groups).map(([category, scenarios]) => (
          <details key={category} className={styles.group} open={category === "ordinary_checkin"}>
            <summary>
              <span>{categoryLabel(category)}</span>
              <small>{scenarios.length} scenarios</small>
            </summary>
            <div className={styles.cards}>
              {scenarios.map((scenario) => (
                <button key={scenario.id} className={styles.card} onClick={() => onScenario(scenario)}>
                  <strong>{scenario.title}</strong>
                  <p>{scenario.description}</p>
                  <small>
                    Expected safety: <SafetyBadgeLabel level={scenario.expectedSafetyLevel} />
                  </small>
                </button>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function AnalysisStage({ mode, steps }: Readonly<{ mode: "stable" | "live"; steps: readonly AnalysisStep[] }>) {
  const allSteps: readonly AnalysisStep[] = ["Saving check-in", "Safety routing", "Generating advice", "Preparing audio"];

  return (
    <section className={styles.analysis} aria-live="polite" aria-busy="true">
      <header>
        <p className="eyebrow">{mode === "live" ? "Live AI Demo" : "Stable Demo"}</p>
        <h2>Analyzing your check-in...</h2>
        <p>{mode === "live" ? "MiniMax can take a moment, so the demo shows exactly what is happening." : "Stable mode is using the same safety logic with instant mock advice."}</p>
      </header>
      <ol>
        {allSteps.map((step) => (
          <li key={step} data-complete={steps.includes(step) || undefined}>
            <span>{steps.includes(step) ? <CheckIcon size={14} aria-hidden="true" /> : null}</span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}

function categoryLabel(category: string) {
  return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function SafetyBadgeLabel({ level }: Readonly<{ level: SafetyLevel }>) {
  return <span className={styles[`badge-${level}`] ?? styles.badgeGreen}>{level}</span>;
}

function SafetyDemoBadge({ level }: Readonly<{ level: SafetyLevel }>) {
  const copy: Record<SafetyLevel, { label: string; detail: string }> = {
    green: {
      label: "Green",
      detail: "Wellness advice allowed",
    },
    amber: {
      label: "Amber",
      detail: "Review suggested",
    },
    red: {
      label: "Red",
      detail: "No AI advice, escalation only",
    },
  };
  const item = copy[level];

  return (
    <p className={`${styles.safetyDemo} ${styles[`safetyDemo-${level}`] ?? ""}`}>
      <WarningCircleIcon size={18} aria-hidden="true" />
      <span>
        <strong>{item.label}</strong>
        {item.detail}
      </span>
    </p>
  );
}

function RecordingStage({
  seconds,
  canvasRef,
  onStop,
  onCancel,
}: Readonly<{ seconds: number; canvasRef: React.RefObject<HTMLCanvasElement | null>; onStop: () => void; onCancel: () => void }>) {
  return (
    <section className={styles.recording}>
      <header>
        <p className="eyebrow">Recording · Configured STT</p>
        <h2>Speak for up to {MAX_RECORD_SECONDS} seconds.</h2>
        <p>Demo scenarios use preset transcripts. Live recording follows the configured speech provider and consent settings.</p>
      </header>
      <canvas ref={canvasRef} className={styles.waveform} width={720} height={160} />
      <p className={styles.timer}>{seconds}s elapsed</p>
      <div className={styles.recordingActions}>
        <button className="button button-primary" onClick={onStop}>
          <StopIcon size={18} aria-hidden="true" /> Stop recording
        </button>
        <button className="button button-secondary" onClick={onCancel}>
          <XIcon size={16} aria-hidden="true" /> Cancel
        </button>
      </div>
      <p className={styles.notice}>After you stop, SleepOS returns a transcript with confidence flags for review before analysis.</p>
    </section>
  );
}

function TranscriptStage({
  transcript,
  confirmed,
  onEdit,
  onConfirm,
  onBack,
}: Readonly<{
  transcript: TranscriptResult;
  confirmed: boolean;
  onEdit: (segmentId: string, text: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}>) {
  return (
    <section className={styles.transcript}>
      <header>
        <p className="eyebrow">Step 2 of 3 · Review transcript</p>
        <h2>Confirm what you said.</h2>
        <p>Low-confidence, neg, and neg-flagged segments need your eye before analysis runs.</p>
      </header>
      <ul className={styles.segments}>
        {transcript.segments.map((segment) => (
          <li key={segment.segmentId} className={styles.segment} data-confidence={segment.confidence < 0.78 ? "low" : "ok"} data-confirmed={segment.isConfirmed}>
            <div className={styles.segmentMeta}>
              <span>Confidence: {(segment.confidence * 100).toFixed(0)}%</span>
              <span>{segment.startedAtMs}–{segment.endedAtMs} ms</span>
            </div>
            <textarea
              value={segment.text}
              onChange={(event) => onEdit(segment.segmentId, event.target.value)}
              rows={2}
              disabled={confirmed}
              aria-label={`Transcript segment ${segment.segmentId}`}
            />
            <small>{segment.confidence < 0.78 ? "Low confidence — please confirm." : "Looks good."}</small>
          </li>
        ))}
      </ul>
      <div className={styles.transcriptActions}>
        <button className="button button-secondary" onClick={onBack}>
          <ArrowLeftIcon size={18} aria-hidden="true" /> Back
        </button>
        <button className="button button-primary" onClick={onConfirm} disabled={confirmed}>
          <CheckIcon size={18} aria-hidden="true" /> Confirm and continue
        </button>
      </div>
    </section>
  );
}

function CheckinStage({
  value,
  onChange,
  onSubmit,
  onBack,
}: Readonly<{
  value: CheckinDraft;
  onChange: (next: CheckinDraft) => void;
  onSubmit: () => void;
  onBack: () => void;
}>) {
  return (
    <section className={styles.checkin}>
      <header>
        <p className="eyebrow">Step 3 of 3 · Five-field check-in</p>
        <h2>Confirm today&apos;s numbers.</h2>
        <p>Edit any field, or leave blank to indicate &quot;I don&apos;t know&quot;.</p>
      </header>
      <div className={styles.fields}>
        <NumberField
          label="Sleep quality"
          unit="/100"
          value={value.sleepQualityScore}
          min={0}
          max={100}
          onChange={(next) => onChange({ ...value, sleepQualityScore: next })}
        />
        <NumberField
          label="Sleep minutes"
          unit="min"
          value={value.sleepMinutes}
          min={0}
          max={1440}
          onChange={(next) => onChange({ ...value, sleepMinutes: next })}
        />
        <NumberField
          label="Stress"
          unit="/10"
          value={value.stressScore}
          min={0}
          max={10}
          onChange={(next) => onChange({ ...value, stressScore: next })}
        />
        <NumberField
          label="Mood"
          unit="/10"
          value={value.moodScore}
          min={0}
          max={10}
          onChange={(next) => onChange({ ...value, moodScore: next })}
        />
        <NumberField
          label="Focus"
          unit="/100"
          value={value.focusScore}
          min={0}
          max={100}
          onChange={(next) => onChange({ ...value, focusScore: next })}
        />
      </div>
      <label className={styles.note}>
        Note (optional)
        <textarea
          value={value.confirmedNote}
          maxLength={600}
          rows={2}
          onChange={(event) => onChange({ ...value, confirmedNote: event.target.value })}
          placeholder="One sentence is enough."
        />
      </label>
      <div className={styles.transcriptActions}>
        <button className="button button-secondary" onClick={onBack}>
          <ArrowLeftIcon size={18} aria-hidden="true" /> Back
        </button>
        <button className="button button-primary" onClick={onSubmit}>
          Submit <ArrowRightIcon size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function NumberField({
  label,
  unit,
  value,
  min,
  max,
  onChange,
}: Readonly<{ label: string; unit: string; value: number | null; min: number; max: number; onChange: (next: number | null) => void }>) {
  return (
    <label className={styles.field}>
      <span>
        {label} <em>{unit}</em>
      </span>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value.trim();
          if (raw === "") {
            onChange(null);
            return;
          }
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) {
            onChange(null);
            return;
          }
          const clamped = Math.max(min, Math.min(max, Math.round(parsed)));
          onChange(clamped);
        }}
      />
    </label>
  );
}

function AdviceStage({
  advice,
  isPlaying,
  onPlay,
  onStop,
  onReset,
  scenarioTitle,
  nextRoute,
}: Readonly<{
  advice: AdviceOutput;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onReset: () => void;
  scenarioTitle: string | null;
  nextRoute: string;
}>) {
  return (
    <section className={styles.advice}>
      <header>
        <p className="eyebrow">{scenarioTitle ? `Demo scenario · ${scenarioTitle}` : "Voice check-in · Result"}</p>
        <div className={styles.adviceHead}>
          <h2>Your guidance</h2>
          <SafetyBadgeLabel level={advice.safetyLevel} />
        </div>
        <p>{advice.summary}</p>
      </header>

      <SafetyDemoBadge level={advice.safetyLevel} />

      {advice.escalation ? (
        <p className={styles[`escalation-${advice.safetyLevel}`] ?? styles.escalation}>
          <WarningCircleIcon size={18} aria-hidden="true" /> {advice.escalation.message}
        </p>
      ) : null}

      <EvidenceSources advice={advice} />

      {advice.adviceItems.length > 0 ? (
        <ul className={styles.items}>
          {advice.adviceItems.map((item, index) => (
            <li key={`${item.actionType}-${index}`} className={styles.item}>
              <strong>{item.title}</strong>
              <p>{item.reason}</p>
              <small>
                {labelActionType(item.actionType)}
                {item.routineKey ? ` · ${labelRoutineKey(item.routineKey)}` : null}
                {item.durationMinutes > 0 ? ` · ${item.durationMinutes} min` : null}
              </small>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.audio}>
        <button className={`button ${isPlaying ? "button-secondary" : "button-primary"}`} onClick={isPlaying ? onStop : onPlay} disabled={!advice.speakableText}>
          {isPlaying ? <><PauseIcon size={18} aria-hidden="true" /> Stop</> : <><PlayIcon size={18} aria-hidden="true" /> Play</>}
        </button>
        <span className={styles.speakableLabel}>
          <SpeakerSimpleHighIcon size={18} aria-hidden="true" />
          {advice.speakableText}
        </span>
      </div>

      <div className={styles.afterActions}>
        <Link className="button button-secondary" href="/insights">
          View in Insights <ArrowRightIcon size={18} aria-hidden="true" />
        </Link>
        <Link className="button button-secondary" href={nextRoute}>
          Continue the demo <ArrowRightIcon size={18} aria-hidden="true" />
        </Link>
        <button className="button button-primary" onClick={onReset}>
          Start a new check-in
        </button>
      </div>
    </section>
  );
}

function EvidenceSources({ advice }: Readonly<{ advice: AdviceOutput }>) {
  const metricLabels: Record<string, string> = {
    sleepMinutes: "sleep minutes",
    stressScore: "stress score",
    focusScore: "focus score",
    moodScore: "mood score",
    sleepQualityScore: "sleep quality",
  };
  const metricSources = Array.from(new Set(advice.observations.flatMap((item) => item.evidenceMetricKeys)))
    .map((key) => metricLabels[key] ?? key.replace(/([A-Z])/g, " $1").toLowerCase());
  const knowledgeSources = advice.sourceIds.length > 0 ? ["approved sleep knowledge"] : [];
  const demoBaselineSources = ["sleep minutes", "stress score", "focus score"];
  const sources = Array.from(new Set([...demoBaselineSources, ...metricSources, ...knowledgeSources]));

  if (sources.length === 0) return null;

  return (
    <section className={styles.evidence} aria-label="Evidence sources">
      <strong>Based on</strong>
      <ul>
        {sources.map((source) => (
          <li key={source}>{source}</li>
        ))}
      </ul>
    </section>
  );
}

function labelActionType(actionType: string) {
  return actionType.replace(/_/g, " ");
}

function labelRoutineKey(routineKey: string) {
  return routineKey.replace(/_/g, " ");
}
