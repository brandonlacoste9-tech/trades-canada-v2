import { createServer } from "node:http";

const recordedRequests = [];

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    let jsonBody = null;
    try {
      if (body) jsonBody = JSON.parse(body);
    } catch {}

    const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    recordedRequests.push({
      method: req.method,
      pathname,
      headers: req.headers,
      body: jsonBody,
      query: Object.fromEntries(url.searchParams),
    });

    console.log(`[Mock Supabase] ${req.method} ${pathname}`);

    res.setHeader("Content-Type", "application/json");

    if (pathname === "/get-recorded-requests") {
      res.writeHead(200);
      res.end(JSON.stringify(recordedRequests));
      return;
    }

    if (pathname === "/reset-recorded-requests") {
      recordedRequests.length = 0;
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // Rate limit RPC
    if (pathname === "/rest/v1/rpc/check_rate_limit") {
      res.writeHead(200);
      res.end(JSON.stringify({ limited: false, remaining: 8 }));
      return;
    }

    // Lead Insertion
    if (pathname === "/rest/v1/leads" && req.method === "POST") {
      res.writeHead(201);
      res.end(JSON.stringify({ id: "123e4567-e89b-12d3-a456-426614174000" }));
      return;
    }

    // Lead Contact Insertion
    if (pathname === "/rest/v1/lead_contacts" && req.method === "POST") {
      res.writeHead(201);
      res.end(JSON.stringify([]));
      return;
    }

    // Lead Qualification Patch
    if (pathname === "/rest/v1/leads" && req.method === "PATCH") {
      res.writeHead(200);
      res.end(JSON.stringify([]));
      return;
    }

    // Automated Logs
    if (pathname === "/rest/v1/automated_logs" && req.method === "POST") {
      res.writeHead(201);
      res.end(JSON.stringify([]));
      return;
    }

    // Email RPC
    if (pathname === "/rest/v1/rpc/enqueue_email") {
      res.writeHead(200);
      res.end(JSON.stringify(1));
      return;
    }

    // Edge Functions
    if (pathname === "/functions/v1/send-email-queue" || pathname === "/functions/v1/telegram-lead-alert") {
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // Default fallback
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Mock Supabase server listening on http://127.0.0.1:${PORT}`);
});
