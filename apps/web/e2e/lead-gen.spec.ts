import { test, expect } from "@playwright/test";
import { fork, ChildProcess } from "child_process";
import { resolve } from "path";

let mockServerProcess: ChildProcess;

test.beforeAll(async () => {
  // Start the mock Supabase server
  const mockServerPath = resolve(__dirname, "mock-supabase.mjs");
  mockServerProcess = fork(mockServerPath, [], { stdio: "inherit" });

  // Wait a moment for server to start
  await new Promise((resolve) => setTimeout(resolve, 1500));
});

test.afterAll(async () => {
  if (mockServerProcess) {
    mockServerProcess.kill();
  }
});

test.describe("Lead Generation Flow E2E Test", () => {
  test("successfully submits a lead and triggers qualification/notifications", async ({ page, request }) => {
    // Reset recorded requests on the mock server
    await request.post("http://127.0.0.1:4000/reset-recorded-requests");

    // 1. Go to the landing page
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    // Wait for hydration to complete and event handlers to attach
    await page.waitForTimeout(2000);

    // 2. Find and fill in the lead form
    // The inputs have autocomplete attributes or placeholders:
    // Name placeholder: "Full Name"
    // Phone placeholder: "Phone Number (recommended)"
    // Email placeholder: "Email Address"
    const nameInput = page.getByPlaceholder("Full Name");
    const phoneInput = page.getByPlaceholder("Phone Number (recommended)");
    const emailInput = page.getByPlaceholder("Email Address");
    const projectSelect = page.locator("select");

    await expect(nameInput).toBeVisible();

    await nameInput.fill("John Doe");
    await phoneInput.fill("514-555-0199");
    await emailInput.fill("johndoe@example.com");
    await projectSelect.selectOption("plumbing");

    // Wait a brief moment to pass the MIN_FORM_FILL_MS = 1200 check
    await page.waitForTimeout(1500);

    // 3. Submit the form
    const submitButton = page.getByRole("button", { name: "Request Access" });
    await submitButton.click();

    // 4. Verify the UI updates to show the success card
    // The success card contains the heading "Request Received!"
    await expect(page.getByText("Request Received!")).toBeVisible({ timeout: 10000 });

    // 5. Query the mock Supabase server to verify database queries and edge function calls
    const recordedRes = await request.get("http://127.0.0.1:4000/get-recorded-requests");
    expect(recordedRes.ok()).toBeTruthy();
    const recorded = await recordedRes.json();

    console.log("Recorded Requests on Mock Supabase:", JSON.stringify(recorded, null, 2));

    // Verify rate limit check was made
    const rateLimitReq = recorded.find((r: any) => r.pathname === "/rest/v1/rpc/check_rate_limit");
    expect(rateLimitReq).toBeDefined();

    // Verify lead insertion was made with correct project_type
    const leadInsertReq = recorded.find((r: any) => r.method === "POST" && r.pathname === "/rest/v1/leads");
    expect(leadInsertReq).toBeDefined();
    expect(leadInsertReq.body).toEqual(expect.objectContaining({
      project_type: "plumbing",
      language: "en",
      source: "web",
    }));

    // Verify lead contact details were saved
    const contactInsertReq = recorded.find((r: any) => r.method === "POST" && r.pathname === "/rest/v1/lead_contacts");
    expect(contactInsertReq).toBeDefined();
    expect(contactInsertReq.body).toEqual(expect.objectContaining({
      lead_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "John Doe",
      email: "johndoe@example.com",
      phone: "514-555-0199",
    }));

    // Verify lead was updated with qualification info (heuristic fallback score = 70 since phone + project, no city)
    const leadUpdateReq = recorded.find((r: any) => r.method === "PATCH" && r.pathname === "/rest/v1/leads");
    expect(leadUpdateReq).toBeDefined();
    expect(leadUpdateReq.body).toEqual(expect.objectContaining({
      score: 70,
    }));
    expect(leadUpdateReq.body.message).toContain("Auto-qualified lead");

    // Verify email was enqueued via RPC
    const emailEnqueueReq = recorded.find((r: any) => r.pathname === "/rest/v1/rpc/enqueue_email");
    expect(emailEnqueueReq).toBeDefined();
    expect(emailEnqueueReq.body.payload.to).toBe("johndoe@example.com");

    // Verify send-email-queue Edge Function was triggered
    const sendEmailFn = recorded.find((r: any) => r.pathname === "/functions/v1/send-email-queue");
    expect(sendEmailFn).toBeDefined();

    // Verify telegram-lead-alert Edge Function was triggered
    const telegramAlertFn = recorded.find((r: any) => r.pathname === "/functions/v1/telegram-lead-alert");
    expect(telegramAlertFn).toBeDefined();
    expect(telegramAlertFn.body).toEqual({ lead_id: "123e4567-e89b-12d3-a456-426614174000" });
  });
});
