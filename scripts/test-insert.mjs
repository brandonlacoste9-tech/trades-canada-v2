import { readFileSync } from 'node:fs';

const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndm9xbnl5ZnpxemtleG9ydHFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2NzYzMywiZXhwIjoyMDg5NjQzNjMzfQ.Yy7Km3rGeIjNOVZ0CizHEUkOgyYXvrMsz-MYxqsMJPI";
const url = "https://sgvoqnyyfzqzkexortqc.supabase.co/rest/v1/leads";

const payload = {
  name: "Test User",
  email: "test@example.com",
  project_type: "hvac",
  source: "web"
};

try {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  const data = await resp.json();
  if (resp.ok) {
    console.log("SUCCESS: Lead inserted", data);
  } else {
    console.error("FAILURE: Database rejection", data);
  }
} catch (err) {
  console.error("ERROR: Fetch failed", err);
}
