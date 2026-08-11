/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const baseUrl = "http://localhost:3100";
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const evidenceDir = "test-results/manual";

function assert(condition, message, evidence) {
  if (!condition) {
    const error = new Error(message);
    error.evidence = evidence;
    throw error;
  }
}

async function instrument(context, viewport) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  const errors = [];
  const failedRequests = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? "failed"}`));
  return { page, errors, failedRequests };
}

async function checkRoutes(browser) {
  const context = await browser.newContext();
  const { page, errors, failedRequests } = await instrument(context, { width: 390, height: 844 });
  const routes = ["/", "/explore", "/insights", "/plan", "/profile"];
  const results = [];
  for (const route of routes) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: route === "/explore" ? "domcontentloaded" : "networkidle" });
    if (route === "/explore") await page.waitForTimeout(4500);
    const dimensions = await page.evaluate(() => ({ innerWidth, documentWidth: document.documentElement.scrollWidth }));
    const navCount = await page.locator('nav[aria-label="Primary navigation"]:visible a').count();
    assert(response?.status() === 200, `${route} did not return HTTP 200`, { status: response?.status() });
    assert(dimensions.documentWidth <= dimensions.innerWidth, `${route} overflows the mobile viewport`, dimensions);
    assert(navCount === 5, `${route} does not expose five mobile destinations`, { navCount });
    results.push({ route, status: response.status(), ...dimensions, navCount });
  }
  assert(errors.length === 0, "Route audit produced console/page errors", errors);
  const actionableFailures = failedRequests.filter((failure) => !failure.includes("/explore/bodyparts3d.html net::ERR_ABORTED"));
  assert(actionableFailures.length === 0, "Route audit produced failed requests", actionableFailures);
  await page.screenshot({ path: `${evidenceDir}/audit-mobile-routes.png`, fullPage: true });
  await context.close();
  return results;
}

async function checkMetricDeepLinks(browser) {
  const context = await browser.newContext();
  const { page, errors } = await instrument(context, { width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /HRV 42 ms/ }).click();
  await page.waitForURL("**/explore?system=heart_autonomic");
  await page.getByRole("dialog").waitFor({ state: "visible" });
  assert(await page.getByRole("heading", { name: "Heart + autonomic" }).isVisible(), "HRV metric did not open Heart detail");
  await page.getByRole("button", { name: "Close system details" }).click();
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Reaction 312 ms/ }).click();
  await page.waitForURL("**/explore?system=brain");
  await page.getByRole("dialog").waitFor({ state: "visible" });
  assert(await page.getByRole("heading", { name: "Brain" }).isVisible(), "Reaction metric did not open Brain detail");
  assert(errors.length === 0, "Metric deep-link audit produced browser errors", errors);
  await context.close();
  return { hrv: "heart_autonomic", reaction: "brain" };
}

async function checkProfileSectionDeepLinks(browser) {
  const context = await browser.newContext();
  const { page, errors, failedRequests } = await instrument(context, { width: 390, height: 844 });
  const cases = [
    { system: "Gut + nutrition", action: "View assessment", hash: "assessments" },
    { system: "Metabolic + labs", action: "View records", hash: "records" },
  ];
  const results = [];
  for (const item of cases) {
    await page.goto(`${baseUrl}/explore`, { waitUntil: "domcontentloaded" });
    await page.locator('aside[aria-label="Body systems"] button').filter({ hasText: item.system }).click();
    await page.getByRole("link", { name: item.action }).click();
    await page.waitForURL(`**/profile#${item.hash}`);
    const target = page.locator(`#${item.hash}`);
    await target.waitFor({ state: "visible" });
    const position = await target.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return { top: Math.round(bounds.top), bottom: Math.round(bounds.bottom), viewport: innerHeight };
    });
    assert(position.top >= 0 && position.top < position.viewport, `${item.action} did not reveal its Profile section`, position);
    results.push({ action: item.action, hash: item.hash, top: position.top });
  }
  assert(errors.length === 0, "Profile section deep-link audit produced browser errors", errors);
  const actionableFailures = failedRequests.filter((failure) => !failure.includes("/explore/bodyparts3d.html net::ERR_ABORTED"));
  assert(actionableFailures.length === 0, "Profile section deep-link audit produced failed requests", actionableFailures);
  await context.close();
  return results;
}

async function reachAssessmentStep(page) {
  await page.goto(`${baseUrl}/onboarding`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Continue as Alex" }).click();
  await page.getByRole("button", { name: "Sleep longer" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: "3" }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "Measure attention, or skip for now." }).waitFor();
}

async function checkOnboarding(browser) {
  const context = await browser.newContext();
  const { page, errors, failedRequests } = await instrument(context, { width: 390, height: 844 });
  const startedAt = Date.now();
  await page.goto(`${baseUrl}/onboarding`, { waitUntil: "networkidle" });
  let dimensions = await page.evaluate(() => ({ innerWidth, documentWidth: document.documentElement.scrollWidth }));
  assert(dimensions.documentWidth <= dimensions.innerWidth, "Onboarding welcome overflows mobile", dimensions);
  await page.getByRole("button", { name: "Continue as Alex" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  assert(await page.getByRole("alert").getByText("Choose at least one goal").isVisible(), "Goal validation did not block an empty choice");
  await page.getByRole("button", { name: "Sleep longer" }).click();
  await page.getByRole("button", { name: "Sharpen focus" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Usual bedtime").fill("");
  await page.getByRole("radio", { name: "4" }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  assert(await page.getByRole("alert").getByText("Enter a valid bedtime and wake time.").isVisible(), "Baseline validation accepted an empty time");
  await page.getByLabel("Usual bedtime").fill("22:30");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("sleepos.onboarding.v1"))?.step === 3);
  await page.reload({ waitUntil: "networkidle" });
  assert(await page.getByRole("heading", { name: "Measure attention, or skip for now." }).isVisible(), "Onboarding did not resume its accepted step after refresh");
  await page.getByRole("button", { name: "Skip assessment" }).click();
  await page.getByRole("button", { name: "Use demo wearable" }).click();
  assert(await page.getByText("Demo values", { exact: true }).isVisible(), "Wearable decision is absent from the onboarding summary");
  assert(await page.evaluate(() => document.activeElement?.textContent === "Your Alex view is ready."), "Onboarding did not transfer focus to the completed step heading");
  await page.screenshot({ path: `${evidenceDir}/audit-onboarding-complete.png`, fullPage: true });
  await page.getByRole("button", { name: "Enter Home" }).click();
  await page.waitForURL(`${baseUrl}/`);
  const completed = await page.evaluate(() => JSON.parse(localStorage.getItem("sleepos.onboarding.v1")));
  assert(completed.isComplete && completed.assessment === "skipped" && completed.wearable === "demo", "Onboarding completion snapshot is inconsistent", completed);
  assert(Date.now() - startedAt < 120000, "Representative onboarding path exceeded two minutes", { elapsedMs: Date.now() - startedAt });
  assert(errors.length === 0, "Onboarding produced console/page errors", errors);
  assert(failedRequests.length === 0, "Onboarding produced failed requests", failedRequests);
  await context.close();

  const invalidContext = await browser.newContext();
  await invalidContext.addInitScript(() => localStorage.setItem("sleepos.onboarding.v1", JSON.stringify({ version: 1, step: 99 })));
  const invalid = await instrument(invalidContext, { width: 390, height: 844 });
  await invalid.page.goto(`${baseUrl}/onboarding`, { waitUntil: "networkidle" });
  assert(await invalid.page.getByRole("status").getByText(/invalid and has been reset/i).isVisible(), "Invalid onboarding draft did not reset visibly");
  await invalidContext.close();

  const assessmentContext = await browser.newContext();
  const assessment = await instrument(assessmentContext, { width: 390, height: 844 });
  await reachAssessmentStep(assessment.page);
  await assessment.page.getByRole("button", { name: "Start assessment" }).click();
  await assessment.page.getByRole("button", { name: "Begin task" }).click();
  for (let trial = 0; trial < 5; trial += 1) {
    const target = assessment.page.locator('button[data-visible="true"]');
    await target.waitFor({ state: "visible", timeout: 5000 });
    await target.click();
  }
  await assessment.page.getByRole("button", { name: "Save session" }).click();
  await assessment.page.getByRole("heading", { name: "Use the demo wearable or skip." }).waitFor();
  const measured = await assessment.page.evaluate(() => ({ onboarding: JSON.parse(localStorage.getItem("sleepos.onboarding.v1")), plan: JSON.parse(localStorage.getItem("sleepos.demo.v1")) }));
  assert(measured.onboarding.assessment === "completed" && measured.plan.plan.sessions.length === 1, "Measured assessment did not update onboarding and Plan exactly once", measured);
  assert(assessment.errors.length === 0, "Measured onboarding assessment produced browser errors", assessment.errors);
  await assessmentContext.close();

  return { elapsedMs: Date.now() - startedAt, resumedStep: 3, invalidReset: true, measuredSessions: 1 };
}

async function checkConsultation(browser) {
  const context = await browser.newContext();
  const { page, errors, failedRequests } = await instrument(context, { width: 390, height: 844 });
  await page.goto(`${baseUrl}/plan`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "View demo options" }).click();
  const dialog = page.getByRole("dialog", { name: "Talk through the pattern, not a diagnosis." });
  await dialog.waitFor();
  assert(await dialog.getByText("No booking created").isVisible(), "Consultation modal does not expose its simulated boundary");
  await dialog.getByRole("button", { name: /Tomorrow/ }).click();
  assert(await dialog.getByRole("status").getByText(/Nothing has been booked/).isVisible(), "Consultation slot implied a real booking");
  await dialog.getByRole("button", { name: "Contact option · Demo" }).click();
  assert(await dialog.getByRole("status").getByText(/Contact team selected for preview/).isVisible(), "Consultation contact option lacks a truthful result");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "detached" });
  assert(errors.length === 0, "Consultation audit produced browser errors", errors);
  assert(failedRequests.length === 0, "Consultation audit produced failed requests", failedRequests);
  await context.close();
  return { simulatedSlots: 2, contactOption: true, escapeDismissal: true };
}

async function completePlan(browser) {
  const context = await browser.newContext();
  const { page, errors, failedRequests } = await instrument(context, { width: 390, height: 844 });
  await page.goto(`${baseUrl}/plan`, { waitUntil: "networkidle" });
  await page.locator("article").filter({ hasText: "Brain Training" }).getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Begin task" }).click();
  for (let trial = 0; trial < 5; trial += 1) {
    const target = page.locator('button[data-visible="true"]');
    await target.waitFor({ state: "visible", timeout: 5000 });
    await target.click();
  }
  await page.getByRole("button", { name: "Save session" }).click();
  await page.locator("article").filter({ hasText: "Breathing" }).getByRole("button", { name: "Start" }).click();
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: "Finish" }).click();
  await page.getByRole("button", { name: "Better" }).click();
  await page.locator("article").filter({ hasText: "Sleep Goal" }).getByRole("button", { name: "Set goal" }).click();
  await page.getByLabel("Target time").fill("22:45");
  await page.getByRole("button", { name: "Confirm sleep goal" }).click();
  await page.waitForTimeout(150);
  const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem("sleepos.demo.v1")));
  assert(snapshot.version === 1, "Demo snapshot version is incorrect", snapshot);
  assert(snapshot.plan.actions.every((action) => action.status === "completed"), "Not all plan actions persisted as completed", snapshot.plan.actions);
  assert(snapshot.plan.sessions.length === 2, "Expected two persisted intervention sessions", snapshot.plan.sessions);
  assert(snapshot.plan.sessions.every((session) => session.durationSeconds >= 1), "A session persisted an invalid duration", snapshot.plan.sessions);
  await page.reload({ waitUntil: "networkidle" });
  assert((await page.locator('[aria-live="polite"]').innerText()).includes("3/3"), "Plan progress did not restore after reload");
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  assert((await page.locator(".progress-quiet").innerText()).includes("3/3"), "Home did not reflect restored completion state");
  assert(errors.length === 0, "Closed-loop audit produced console/page errors", errors);
  assert(failedRequests.length === 0, "Closed-loop audit produced failed requests", failedRequests);
  await page.screenshot({ path: `${evidenceDir}/audit-closed-loop.png`, fullPage: true });
  await context.close();
  return { actions: 3, sessions: snapshot.plan.sessions.length, homeProgress: "3/3" };
}

async function checkNavigationAbandon(browser) {
  const context = await browser.newContext();
  const { page } = await instrument(context, { width: 390, height: 844 });
  await page.goto(`${baseUrl}/plan`, { waitUntil: "networkidle" });
  await page.locator("article").filter({ hasText: "Brain Training" }).getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Begin task" }).click();
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.goto(`${baseUrl}/plan`, { waitUntil: "networkidle" });
  const state = await page.locator("article").filter({ hasText: "Brain Training" }).locator("span").filter({ hasText: /pending|active|completed/i }).last().innerText();
  assert(state.toLowerCase() === "pending", "Navigating away leaves an abandoned brain session active", { state });
  await context.close();
  return { state };
}

async function checkNoResponseResult(browser) {
  const context = await browser.newContext();
  const { page, errors } = await instrument(context, { width: 390, height: 844 });
  await page.goto(`${baseUrl}/plan`, { waitUntil: "networkidle" });
  await page.locator("article").filter({ hasText: "Brain Training" }).getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Begin task" }).click();
  await page.getByText("No response", { exact: true }).waitFor({ state: "visible", timeout: 20000 });
  assert(await page.getByText("Accuracy").isVisible(), "No-response completion did not render its measured state");
  await page.getByRole("button", { name: "Save session" }).click();
  await page.waitForTimeout(150);
  const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem("sleepos.demo.v1")));
  const session = snapshot.plan.sessions[0];
  assert(session.reactionTime === null, "All-missed task should persist nullable reaction time", session);
  assert(session.accuracy === 0 && session.completedTrialCount === 0 && session.missedResponses === 5, "All-missed aggregate is incorrect", session);
  assert(errors.length === 0, "No-response path produced browser errors", errors);
  await context.close();
  return { reactionTime: session.reactionTime, accuracy: session.accuracy, misses: session.missedResponses };
}

async function checkCorruptSnapshotRecovery(browser) {
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem("sleepos.demo.v1", JSON.stringify({ version: 1, plan: { actions: [], sessions: [{ id: "forged" }] } })));
  const { page, errors } = await instrument(context, { width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(100);
  const progress = page.locator(".progress-quiet");
  const label = await progress.getAttribute("aria-label");
  const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem("sleepos.demo.v1")));
  assert(label.includes("invalid") && label.includes("reset"), "Invalid snapshot reset was not exposed accessibly", { label });
  assert(snapshot.version === 1 && snapshot.plan.actions.length === 3 && snapshot.plan.sessions.length === 0, "Invalid snapshot did not reset to canonical state", snapshot);
  assert(errors.length === 0, "Snapshot recovery produced browser errors", errors);
  await context.close();
  return { notice: label, restoredActions: snapshot.plan.actions.length };
}

async function checkExploreFailure(browser) {
  const context = await browser.newContext();
  await context.route("**/explore/models/*.glb", (route) => route.abort("failed"));
  const { page, errors } = await instrument(context, { width: 390, height: 844 });
  await page.goto(`${baseUrl}/explore`, { waitUntil: "domcontentloaded" });
  await page.getByText("3D view unavailable", { exact: true }).waitFor({ state: "visible", timeout: 10000 });
  const controls = page.locator('aside[aria-label="Body systems"] button');
  assert(await controls.count() === 6, "Explore fallback lost its six accessible system controls");
  await controls.filter({ hasText: "Brain" }).click();
  assert(await page.getByRole("dialog").isVisible(), "Explore fallback system detail did not open");
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Close system details");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "detached" });
  const actionableErrors = errors.filter((error) => !error.includes("Failed to load resource"));
  assert(actionableErrors.length === 0, "Explore fallback produced unexpected browser errors", actionableErrors);
  await page.screenshot({ path: `${evidenceDir}/audit-explore-fallback.png`, fullPage: true });
  await context.close();
  return { fallback: true, controls: 6 };
}

async function checkExploreReadyAndKeyboard(browser) {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const { page, errors, failedRequests } = await instrument(context, { width: 390, height: 844 });
  await page.goto(`${baseUrl}/explore?system=brain`, { waitUntil: "domcontentloaded" });
  await page.locator('iframe[aria-hidden="false"]').waitFor({ state: "visible", timeout: 15000 });
  assert(await page.locator('aside[aria-label="Body systems"] button[aria-pressed="true"]').filter({ hasText: "Brain" }).count() === 1, "Brain deep link did not select its canonical system");
  assert(await page.getByRole("button", { name: /labeled context only/ }).count() === 2, "Regional overlays are missing");
  await page.keyboard.press("Tab");
  const focusInsideDialog = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));
  assert(focusInsideDialog, "Keyboard focus escaped the Explore modal");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "detached" });
  const dimensions = await page.evaluate(() => ({ innerWidth, documentWidth: document.documentElement.scrollWidth }));
  assert(dimensions.documentWidth <= dimensions.innerWidth, "Explore ready state overflows mobile", dimensions);
  assert(errors.length === 0, "Explore ready state produced console/page errors", errors);
  const actionableFailures = failedRequests.filter((failure) => !failure.includes("/explore/bodyparts3d.html net::ERR_ABORTED"));
  assert(actionableFailures.length === 0, "Explore ready state produced failed requests", actionableFailures);
  await context.close();
  return { ready: true, overlays: 2, ...dimensions };
}

async function checkDesktop(browser) {
  const context = await browser.newContext();
  const { page, errors } = await instrument(context, { width: 1440, height: 1000 });
  const results = [];
  for (const route of ["/", "/explore", "/insights", "/plan", "/profile"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: route === "/explore" ? "domcontentloaded" : "networkidle" });
    if (route === "/explore") await page.locator('iframe[aria-hidden="false"]').waitFor({ state: "visible", timeout: 15000 });
    const dimensions = await page.evaluate(() => ({ innerWidth, documentWidth: document.documentElement.scrollWidth }));
    assert(dimensions.documentWidth <= dimensions.innerWidth, `${route} overflows desktop`, dimensions);
    assert(await page.locator('aside[aria-label="Primary navigation"] a').count() === 6 || await page.locator('aside[aria-label="Primary navigation"] a').count() === 5, `${route} desktop navigation is missing`);
    results.push({ route, ...dimensions });
  }
  assert(errors.length === 0, "Desktop audit produced console/page errors", errors);
  await page.screenshot({ path: `${evidenceDir}/audit-desktop-profile.png`, fullPage: true });
  await context.close();
  return results;
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const report = {};
  try {
    report.routes = await checkRoutes(browser);
    report.metricDeepLinks = await checkMetricDeepLinks(browser);
    report.profileSectionDeepLinks = await checkProfileSectionDeepLinks(browser);
    report.onboarding = await checkOnboarding(browser);
    report.consultation = await checkConsultation(browser);
    report.closedLoop = await completePlan(browser);
    report.navigationAbandon = await checkNavigationAbandon(browser);
    report.noResponse = await checkNoResponseResult(browser);
    report.corruptSnapshot = await checkCorruptSnapshotRecovery(browser);
    report.exploreReady = await checkExploreReadyAndKeyboard(browser);
    report.exploreFailure = await checkExploreFailure(browser);
    report.desktop = await checkDesktop(browser);
    console.log(JSON.stringify({ ok: true, report }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, message: error.message, evidence: error.evidence ?? null, partialReport: report }, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
