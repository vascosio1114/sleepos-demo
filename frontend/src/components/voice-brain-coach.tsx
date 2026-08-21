"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MicrophoneIcon,
  PauseIcon,
  PlayIcon,
  SpeakerSimpleHighIcon,
  StopIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useDemoControl } from "@/lib/demo-control";
import { cryptoRandomUUID, generateMockAdvice, voiceAdviceApi, type AdviceOutput, type HealthCheckin, type TranscriptResult } from "@/lib/voice-advice";
import styles from "./voice-brain-coach.module.css";

type CoachStage = "ready" | "recording" | "transcribing" | "answering" | "answered";

const STABLE_QUESTION = "What brain training should I do if I slept badly and feel unfocused today?";
const MAX_RECORD_SECONDS = 45;
const MIN_TRANSCRIPT_WORDS = 4;

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
  return btoa(binary);
}

export function VoiceBrainCoach() {
  const { mode, setMode } = useDemoControl();
  const [stage, setStage] = useState<CoachStage>("ready");
  const [transcriptText, setTranscriptText] = useState("");
  const [typedQuestion, setTypedQuestion] = useState("");
  const [answer, setAnswer] = useState<AdviceOutput | null>(null);
  const [recommendedHref, setRecommendedHref] = useState("/plan?start=brain-training");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sampleRateRef = useRef(16000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  const isMicSupported = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
  const isLive = mode === "live";

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") audioCtxRef.current.close().catch(() => undefined);
    audioCtxRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => () => cleanupRecording(), [cleanupRecording]);

  const askCoach = useCallback(async (question: string) => {
    setError(null);
    setStage("answering");
    setTranscriptText(question);
    setAnswer(null);
    try {
      const result = await voiceAdviceApi.runBrainCoach({ transcriptText: question });
      setTranscriptText(result.transcriptText);
      setAnswer(result.answer);
      setRecommendedHref(result.recommendedTrainingHref);
      setStage("answered");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Brain coach could not answer right now.");
      setStage("ready");
    }
  }, []);

  const finishRecording = useCallback(async () => {
    setStage("transcribing");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0]?.type ?? "audio/webm" });
      let pcmBytesBase64: string | undefined;
      let sampleRateHz = Math.round(sampleRateRef.current);
      if (audioBlob.size > 0 && typeof window !== "undefined" && typeof window.OfflineAudioContext !== "undefined") {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const decodeCtx = new OfflineAudioContext(1, 1, sampleRateHz);
        const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
        sampleRateHz = Math.round(decoded.sampleRate);
        const mono = decoded.numberOfChannels > 1 ? mixToMono(decoded) : decoded.getChannelData(0);
        pcmBytesBase64 = pcmFloat32ToInt16Base64(mono);
      }
      cleanupRecording();
      const open = await voiceAdviceApi.openSession({ language: "en-US", userId: "demo_001" });
      const finished = await voiceAdviceApi.finishSession({
        sessionId: open.session.sessionId,
        audioDurationSeconds: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        pcmBytesBase64,
        sampleRateHz,
      });
      const question = transcriptToText(finished.transcript);
      setTranscriptText(question);
      if (!isUsableTranscript(question)) {
        setError(question ? `I only heard "${question}". Try again, speak for 3-5 seconds, or type the question below.` : "I could not hear enough audio. Try again, speak for 3-5 seconds, or type the question below.");
        setStage("ready");
        return;
      }
      await askCoach(question);
    } catch (err) {
      cleanupRecording();
      setError(err instanceof Error ? err.message : "Could not transcribe the recording.");
      setStage("ready");
    }
  }, [askCoach, cleanupRecording]);

  const runStableQuestion = useCallback(() => {
    setMode("stable");
    setError(null);
    setTranscriptText(STABLE_QUESTION);
    setTypedQuestion(STABLE_QUESTION);
    setAnswer(generateMockAdvice({
      adviceRunId: cryptoRandomUUID(),
      transcriptText: STABLE_QUESTION,
      checkin: buildStableCoachCheckin(STABLE_QUESTION),
      scenarioId: "voice-brain-coach-stable",
    }));
    setRecommendedHref("/plan?start=brain-training");
    setStage("answered");
  }, [setMode]);

  const startRecording = useCallback(async () => {
    setMode("live");
    setError(null);
    setAnswer(null);
    setTranscriptText("");
    setRecordingSeconds(0);
    if (!isMicSupported) {
      setError("Microphone is unavailable in this browser. Use Stable Demo instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { autoGainControl: true, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      sampleRateRef.current = audioCtx.sampleRate;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        void finishRecording();
      }, { once: true });
      startedAtRef.current = Date.now();
      recorder.start(100);
      setStage("recording");
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setRecordingSeconds(elapsed);
        if (elapsed >= MAX_RECORD_SECONDS && recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
      }, 250);
    } catch (err) {
      cleanupRecording();
      setError(err instanceof Error ? `Microphone unavailable: ${err.message}` : "Microphone unavailable.");
      setStage("ready");
    }
  }, [cleanupRecording, finishRecording, isMicSupported, setMode]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  }, []);

  const handleOrbClick = useCallback(() => {
    if (stage === "recording") {
      stopRecording();
      return;
    }
    if (stage === "transcribing" || stage === "answering") return;
    if (isLive) {
      void startRecording();
      return;
    }
    runStableQuestion();
  }, [isLive, runStableQuestion, stage, startRecording, stopRecording]);

  const askTypedQuestion = useCallback(() => {
    const question = typedQuestion.trim();
    if (!question) {
      setError("Type a brain training, sleep, focus, or stress question first.");
      return;
    }
    void askCoach(question);
  }, [askCoach, typedQuestion]);

  const playAnswer = useCallback(() => {
    if (!answer || typeof window === "undefined" || !window.speechSynthesis) {
      setError("Speech playback is unavailable in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answer.speakableText);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [answer]);

  const stopPlayback = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    cleanupRecording();
    stopPlayback();
    setStage("ready");
    setTranscriptText("");
    setTypedQuestion("");
    setAnswer(null);
    setError(null);
    setRecordingSeconds(0);
  }, [cleanupRecording, stopPlayback]);

  return (
    <div className={`page-container ${styles.page}`}>
      <header className={styles.header}>
        <Link className={styles.back} href="/">
          <ArrowLeftIcon size={18} aria-hidden="true" /> Back to Home
        </Link>
        <div>
          <p className="eyebrow">Voice Brain Coach</p>
          <h1>Ask SleepOS by voice.</h1>
          <p>Mic in, brain coach answer out.</p>
        </div>
      </header>

      <section className={styles.coachPanel} aria-labelledby="coach-title">
        <div className={styles.topBar}>
          <div className={styles.modeSwitch} role="group" aria-label="Brain coach mode">
            <button type="button" data-active={mode === "stable" || undefined} onClick={() => setMode("stable")}>Stable<span>Demo-safe</span></button>
            <button type="button" data-active={mode === "live" || undefined} onClick={() => setMode("live")}>Live<span>Mic + AI</span></button>
          </div>
          <button className={styles.resetButton} type="button" onClick={reset}>Reset</button>
        </div>

        <div className={styles.voiceStage}>
          <div className={styles.brainVisual} aria-label="3D brain performance profile">
            <iframe src="/brain-coach/brain-performance-star.html" title="3D brain performance profile" />
          </div>
          <div className={styles.orbDock}>
            <button
              type="button"
              className={styles.voiceOrb}
              data-stage={stage}
              onClick={handleOrbClick}
              disabled={stage === "transcribing" || stage === "answering"}
              aria-label={stage === "recording" ? "Stop recording" : isLive ? "Ask with microphone" : "Run stable demo question"}
            >
              <span className={styles.orbRing} aria-hidden="true" />
              <span className={styles.orbCore}>
                {stage === "recording" ? <StopIcon size={46} aria-hidden="true" /> : <MicrophoneIcon size={46} aria-hidden="true" />}
              </span>
            </button>
            <h2 id="coach-title">{statusTitle(stage, isLive)}</h2>
            <p>{statusCopy(stage, isLive, recordingSeconds)}</p>
          </div>
        </div>

        <div className={styles.quickQuestion}>
          <span>Demo question</span>
          <button type="button" onClick={runStableQuestion}>{STABLE_QUESTION}</button>
        </div>

        <div className={styles.typedFallback}>
          <textarea
            value={typedQuestion}
            onChange={(event) => setTypedQuestion(event.target.value)}
            placeholder="Or type: What brain training should I do if I slept badly?"
            rows={2}
          />
          <button className="button button-primary" type="button" onClick={askTypedQuestion} disabled={stage === "recording" || stage === "transcribing" || stage === "answering"}>
            Ask typed question <ArrowRightIcon size={18} aria-hidden="true" />
          </button>
        </div>

        {stage !== "ready" && stage !== "answered" ? (
          <p className={styles.loading} role="status">
            {stage === "recording" ? `Listening... ${recordingSeconds}s` : stage === "transcribing" ? "Transcribing with configured STT..." : "Asking the brain coach..."}
          </p>
        ) : null}

        {error ? <p className={styles.error} role="alert"><WarningCircleIcon size={18} aria-hidden="true" /> {error}</p> : null}
      </section>

      {transcriptText ? (
        <section className={styles.transcript}>
          <p className="eyebrow">Transcript</p>
          <blockquote>{transcriptText}</blockquote>
        </section>
      ) : null}

      {answer ? (
        <section className={styles.answer} aria-labelledby="answer-title">
          <header>
            <p className="eyebrow">AI answer · scoped wellness</p>
            <h2 id="answer-title">{answer.summary}</h2>
            <span data-safety={answer.safetyLevel}>{answer.safetyLevel}</span>
          </header>
          <p>{answer.speakableText}</p>
          <div className={styles.recommendation}>
            <strong>{recommendedActionTitle(answer)}</strong>
            <span>{recommendedActionReason(answer)}</span>
          </div>
          <div className={styles.answerActions}>
            <button className={`button ${isPlaying ? "button-secondary" : "button-primary"}`} onClick={isPlaying ? stopPlayback : playAnswer}>
              {isPlaying ? <><PauseIcon size={18} aria-hidden="true" /> Stop voice</> : <><PlayIcon size={18} aria-hidden="true" /> Play voice answer</>}
            </button>
            <Link className="button button-primary" href={recommendedHref}>
              Start brain training <ArrowRightIcon size={18} aria-hidden="true" />
            </Link>
          </div>
          <p className={styles.voiceNote}><SpeakerSimpleHighIcon size={18} aria-hidden="true" /> Playback uses browser speech synthesis; Live AI can still use MiniMax for the answer.</p>
        </section>
      ) : null}
    </div>
  );
}

function transcriptToText(transcript: TranscriptResult) {
  return transcript.segments.map((segment) => segment.text).join(" ").trim();
}

function isUsableTranscript(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return text.trim().length >= 12 && words.length >= MIN_TRANSCRIPT_WORDS;
}

function statusTitle(stage: CoachStage, isLive: boolean) {
  if (stage === "recording") return "Listening";
  if (stage === "transcribing") return "Transcribing";
  if (stage === "answering") return "Thinking";
  if (stage === "answered") return "Answer ready";
  return isLive ? "Tap to speak" : "Tap for stable demo";
}

function statusCopy(stage: CoachStage, isLive: boolean, seconds: number) {
  if (stage === "recording") return `Speak for 3-5 seconds, then tap again. ${seconds}s`;
  if (stage === "transcribing") return "Converting your voice to text with the configured STT provider.";
  if (stage === "answering") return "Keeping the answer inside brain training, sleep, focus, and stress wellness.";
  if (stage === "answered") return "Play the answer or jump straight into brain training.";
  return isLive ? "Live uses your mic, STT, then the MiniMax brain coach path." : "Stable gives the judge-safe preset result instantly.";
}

function buildStableCoachCheckin(question: string): HealthCheckin {
  return {
    checkinId: cryptoRandomUUID(),
    userId: "demo_001",
    localDate: new Date().toISOString().slice(0, 10),
    schemaVersion: "health-checkin-v1",
    source: "voice_confirmed",
    capturedAt: new Date().toISOString(),
    sleepQualityScore: 58,
    sleepMinutes: 390,
    stressScore: 7,
    moodScore: 6,
    focusScore: 52,
    confirmedNote: question,
    sourceSegmentIds: [],
  };
}

function recommendedActionTitle(answer: AdviceOutput) {
  return answer.adviceItems.find((item) => item.actionType === "brain_training")?.title ?? "Start a 3-minute attention reset";
}

function recommendedActionReason(answer: AdviceOutput) {
  return answer.adviceItems.find((item) => item.actionType === "brain_training")?.reason ?? "This opens the SleepOS brain-training task.";
}
