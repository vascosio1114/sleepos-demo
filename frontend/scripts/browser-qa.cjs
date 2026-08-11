/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  const result = {};

  const baseUrl = "http://localhost:3100";
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  result.home = {
    title: await page.title(),
    nav: await page.locator('nav[aria-label="Primary navigation"]:visible a').count(),
    hasStatus: await page.getByText("Recovery may need attention").isVisible(),
    progress: (await page.locator(".progress-quiet").innerText()).replace(/\s+/g, " "),
  };
  await page.screenshot({ path: "qa-home-mobile.png", fullPage: true });

  await page.goto(`${baseUrl}/insights`, { waitUntil: "networkidle" });
  result.insights = {
    headline: await page.getByRole("heading", { name: /Shorter sleep/ }).innerText(),
    bars: await page.locator('[role="img"] span').count(),
    alreadyPlanned: await page.getByRole("button", { name: /Already in plan/ }).isDisabled(),
  };

  await page.goto(`${baseUrl}/plan`, { waitUntil: "networkidle" });
  await page.locator("article").filter({ hasText: "Brain Training" }).getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Begin task" }).click();
  for (let index = 0; index < 5; index += 1) {
    const target = page.locator('button[data-visible="true"]');
    await target.waitFor({ state: "visible", timeout: 5000 });
    await target.click();
  }
  await page.getByRole("button", { name: "Save session" }).click();
  await page.locator("article").filter({ hasText: "Breathing" }).getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Finish" }).click();
  await page.getByRole("button", { name: "Better" }).click();
  await page.locator("article").filter({ hasText: "Sleep Goal" }).getByRole("button", { name: "Set goal" }).click();
  await page.getByLabel("Target time").fill("22:45");
  await page.getByRole("button", { name: "Confirm sleep goal" }).click();
  result.plan = {
    progress: (await page.locator('[aria-live="polite"]').innerText()).replace(/\s+/g, " "),
    completed: await page.getByText("Completed", { exact: true }).count(),
    history: await page.getByText("Latest measured result").isVisible(),
  };
  await page.screenshot({ path: "qa-plan-complete-mobile.png", fullPage: true });

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  result.homeAfter = { progress: (await page.locator(".progress-quiet").innerText()).replace(/\s+/g, " ") };

  await page.goto(`${baseUrl}/explore?system=brain`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  result.explore = {
    systems: await page.locator('aside[aria-label="Body systems"] button[aria-pressed]').count(),
    regionalOverlays: await page.getByRole("button", { name: /labeled context only/ }).count(),
    brainPressed: await page.getByRole("button", { name: /Brain/ }).getAttribute("aria-pressed"),
    detailVisible: await page.getByRole("dialog").isVisible().catch(() => false),
    fallbackVisible: await page.getByText(/3D view unavailable|still loading/i).isVisible().catch(() => false),
    viewport: await page.evaluate(() => ({ innerWidth, bodyWidth: document.body.scrollWidth, documentWidth: document.documentElement.scrollWidth })),
  };
  await page.screenshot({ path: "qa-explore-mobile.png", fullPage: true });

  result.errors = errors;
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
