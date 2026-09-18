import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test("successful voice demo report requires confirmation and creates a reference", async ({ page }) => {
  await page.goto("/report?scenario=pothole");
  await page.getByLabel("I consent to live transcription").check();
  await page.getByRole("button", { name: "Start listening" }).click();
  await expect(page.getByText("Transcript ready")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /Review extracted details/ }).click();
  await expect(page.getByRole("heading", { name: "Check every detail" })).toBeVisible();
  await page.getByRole("button", { name: "Keep separate" }).click();
  const createButton = page.getByRole("button", { name: /Confirm & create demo report/ });
  await expect(createButton).toBeDisabled();
  await page.getByLabel("Yes, the read-back is correct").check();
  await createButton.click();
  await expect(page.getByText("FSA-2026-1948")).toBeVisible();
  await expect(page.getByText(/not been dispatched/i)).toBeVisible();
});

test("manual text fallback completes the same workflow", async ({ page }) => {
  await page.goto("/report");
  await page.getByRole("button", { name: /Use keyboard/ }).click();
  await page.getByLabel("What happened?").fill("A deep pothole on Republic Road near the taxi rank is making cars swerve.");
  await page.getByRole("button", { name: /Analyse typed report/ }).click();
  await expect(page.getByLabel("Category")).toHaveValue("pothole");
});

test("duplicate report explains the match and supports explicit merge", async ({ page }) => {
  await page.goto("/report?scenario=duplicate");
  await page.getByLabel("I consent to live transcription").check();
  await page.getByRole("button", { name: "Start listening" }).click();
  await expect(page.getByText("Transcript ready")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /Review extracted details/ }).click();
  await expect(page.getByText(/nearby report may match/i)).toBeVisible();
  await expect(page.getByText("FSA-2026-1842")).toBeVisible();
  await page.getByLabel("Yes, the read-back is correct").check();
  await page.getByRole("button", { name: /Confirm & merge evidence/ }).click();
  await expect(page.getByRole("heading", { name: /evidence strengthened/i })).toBeVisible();
});

test("dangerous electricity scenario stops ordinary automation", async ({ page }) => {
  await page.goto("/report?scenario=electricity");
  await page.getByLabel("I consent to live transcription").check();
  await page.getByRole("button", { name: "Start listening" }).click();
  await expect(page.getByText(/ordinary automation stopped/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: /Review extracted details/ })).toHaveCount(0);
  await expect(page.getByText(/official local emergency service/i).last()).toBeVisible();
});

test("public tracking lookup shows timeline and keeps private fields hidden", async ({ page }) => {
  await page.goto("/track?ref=FSA-2026-1842");
  await expect(page.getByRole("heading", { name: "Water leak" })).toBeVisible();
  await expect(page.getByText("In progress", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Synthetic hackathon record; not dispatched/i)).toHaveCount(0);
  await page.getByLabel("Follow-up note").fill("Water is now crossing both lanes.");
  await page.getByRole("button", { name: "Attach demo note" }).click();
  await expect(page.getByText(/private to the demo operator view/i)).toBeVisible();
});

test("Proof of Fix reopens a partial repair and exposes the public audit outcome", async ({ page }) => {
  await page.goto("/verify?ref=FSA-2026-1811");
  await expect(page.getByRole("heading", { name: "Trust is the product." })).toBeVisible();
  await page.getByRole("radio", { name: /Only partly fixed/ }).click();
  await page.getByRole("button", { name: /Confirm resident response/ }).click();
  await expect(page.getByRole("heading", { name: /Work order reopened/ })).toBeVisible();
  await page.getByRole("link", { name: "See public proof" }).click();
  await expect(page.getByText("Resident challenged the closure")).toBeVisible();
  await expect(page.getByText(/One streetlight is working/)).toBeVisible();
});

test("operator can safely triage and audit a report", async ({ page }) => {
  await page.goto("/ops/reports/rpt-pothole-002");
  await expect(page).toHaveURL(/\/operator-access/);
  await expect(page.getByText(/not production authentication/i)).toBeVisible();
  await page.getByRole("button", { name: /Enter demo operator workspace/ }).click();
  await page.goto("/ops/reports/rpt-pothole-002");
  await expect(page.getByRole("heading", { name: "Pothole" })).toBeVisible();
  await page.getByLabel("Status").selectOption("assigned");
  await page.getByLabel("Assignee").selectOption({ label: "Roads · Crew 3" });
  await expect(page.getByText(/immutable audit event/i)).toBeVisible();
});

test("mobile navigation exposes all primary destinations", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await page.getByRole("link", { name: "Track", exact: true }).click();
  await expect(page.getByRole("heading", { name: /See what happens next/i })).toBeVisible();
});

test("microphone denial has a clear keyboard recovery path", async ({ page }) => {
  await page.goto("/status/microphone-denied");
  await expect(page.getByRole("heading", { name: /Microphone access is blocked/i })).toBeVisible();
  await page.getByRole("link", { name: /Open keyboard report/i }).click();
  await expect(page.getByRole("button", { name: /Use keyboard/i })).toBeVisible();
});

test("AssemblyAI token failure leaves a usable fallback", async ({ page }) => {
  await page.route("**/api/voice/token", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "AssemblyAI token service is temporarily unavailable." }) }));
  await page.goto("/report?mode=real");
  await page.getByLabel("I consent to live transcription").check();
  await page.getByRole("button", { name: "Start listening" }).click();
  await expect(page.getByText(/temporarily unavailable/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue with keyboard/i })).toBeVisible();
});
