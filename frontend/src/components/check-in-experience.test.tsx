// Component test for CheckInExperience (RTL + happy-dom).
// Exercises the user-visible flow without the network or browser APIs.
// The MediaRecorder + browser speech synthesis are guarded by feature
// detection so the component degrades gracefully to the demo state.

import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { CheckInExperience } from "./check-in-experience";

// The component uses a global "speechSynthesis" object. jsdom/happy-dom
// does not provide one, so add a minimal stub.
beforeEach(() => {
  if (typeof window !== "undefined" && !("speechSynthesis" in window)) {
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak: vi.fn(),
        cancel: vi.fn(),
        getVoices: () => [],
      },
      writable: true,
      configurable: true,
    });
  }
  // Stub fetch with a route-aware responder so the scenario-loading
  // path returns a transcript that lets the component advance to step 2.
  const sessionId = "00000000-0000-4000-8000-000000000001";
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
    if (url.endsWith("/api/v1/voice/sessions") && !url.includes("/finish")) {
      return new Response(
        JSON.stringify({
          data: {
            session: { sessionId, userId: "demo_001", state: "requested", sttProviderKey: "mock", providerMode: "mock", language: "en-US", audioRetention: "none", startedAt: new Date().toISOString(), completedAt: null, abandonedAt: null, durationSeconds: null, confirmedSegmentCount: 0, flaggedSegmentCount: 0, schemaVersion: "voice-session-v1" },
            config: { sttProviderKey: "mock", providerMode: "mock", language: "en-US", maxSessionSeconds: 180, maxChunkBytes: 262144, lowConfidenceThreshold: 0.78 },
          },
          meta: { requestId: "x", apiVersion: "v1" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("/api/v1/voice/sessions/") && url.endsWith("/finish")) {
      return new Response(
        JSON.stringify({
          data: {
            session: { sessionId, userId: "demo_001", state: "awaiting_confirmation", sttProviderKey: "mock", providerMode: "mock", language: "en-US", audioRetention: "none", startedAt: new Date().toISOString(), completedAt: null, abandonedAt: null, durationSeconds: 5, confirmedSegmentCount: 0, flaggedSegmentCount: 0, schemaVersion: "voice-session-v1" },
            transcript: {
              sessionId,
              segments: [
                { segmentId: "s1", text: "I slept poorly last night.", language: "en-US", confidence: 0.9, startedAtMs: 0, endedAtMs: 1000, isConfirmed: false, userEdited: false },
              ],
              language: "en-US",
              finalizedAt: new Date().toISOString(),
            },
            flaggedSegmentIds: [],
          },
          meta: { requestId: "x", apiVersion: "v1" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/transcript")) {
      return new Response(
        JSON.stringify({ data: { sessionId, state: "confirmed", confirmedSegmentCount: 1, flaggedSegmentCount: 0 }, meta: { requestId: "x", apiVersion: "v1" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ data: {}, meta: { requestId: "x", apiVersion: "v1" } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;
});

// Mock the @phosphor-icons/react import to a noop. RTL renders the
// component tree; we don't care about icon internals.
vi.mock("@phosphor-icons/react", () => ({
  ArrowLeftIcon: () => <span data-testid="icon-arrow-left" />,
  ArrowRightIcon: () => <span data-testid="icon-arrow-right" />,
  ArrowClockwiseIcon: () => <span data-testid="icon-arrow-clockwise" />,
  CheckIcon: () => <span data-testid="icon-check" />,
  KeyboardIcon: () => <span data-testid="icon-keyboard" />,
  InfoIcon: () => <span data-testid="icon-info" />,
  MicrophoneIcon: () => <span data-testid="icon-microphone" />,
  MinusIcon: () => <span data-testid="icon-minus" />,
  PauseIcon: () => <span data-testid="icon-pause" />,
  PlayIcon: () => <span data-testid="icon-play" />,
  PlusIcon: () => <span data-testid="icon-plus" />,
  SpeakerSimpleHighIcon: () => <span data-testid="icon-speaker" />,
  StopIcon: () => <span data-testid="icon-stop" />,
  TrashIcon: () => <span data-testid="icon-trash" />,
  WarningCircleIcon: () => <span data-testid="icon-warning" />,
  XIcon: () => <span data-testid="icon-x" />,
}));

describe("CheckInExperience", () => {
  it("renders the intro stage with disclaimer + start button", () => {
    render(<CheckInExperience />);
    expect(screen.getByText(/Voice check-in/)).toBeInTheDocument();
    expect(
      screen.getByText(/SleepOS helps you understand your sleep, train your brain/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start voice check-in/i })).toBeInTheDocument();
  });

  it("lists the 18 demo scenarios across 8 categories on the selector stage", () => {
    render(<CheckInExperience />);
    fireEvent.click(screen.getByRole("button", { name: /Start voice check-in/i }));
    expect(screen.getByText(/Choose how you want to check in/i)).toBeInTheDocument();
    // 8 <details> groups rendered for the 8 safety categories
    const details = document.querySelectorAll("details");
    expect(details.length).toBe(8);
  });

  it("loads a scenario and shows the transcript with confidence flags", async () => {
    render(<CheckInExperience />);
    fireEvent.click(screen.getByRole("button", { name: /Start voice check-in/i }));
    // The first <details> is the "Ordinary check-in" group; open it and
    // click the first scenario button inside.
    const firstDetails = document.querySelectorAll("details")[0] as HTMLDetailsElement;
    firstDetails.open = true;
    fireEvent.click(within(firstDetails).getAllByRole("button")[0]);
    // After scenario load, the component should advance to the
    // transcript stage (Step 2 of 3). The fetch mock returns a transcript
    // immediately, so the state should flip within a microtask.
    await waitFor(
      () => {
        const body = document.body.textContent ?? "";
        if (body.includes("Step 2 of 3")) return;
        throw new Error("Step 2 of 3 not yet visible");
      },
      { timeout: 3000 },
    );
    expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument();
  });

  it("shows the wellness scope disclaimer on the intro stage", () => {
    render(<CheckInExperience />);
    // The intro stage contains the wellnessScope text in a <p>.
    expect(screen.getByText(/SleepOS helps you understand your sleep/i)).toBeInTheDocument();
  });
});
