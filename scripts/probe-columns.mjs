const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndm9xbnl5ZnpxemtleG9ydHFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2NzYzMywiZXhwIjoyMDg5NjQzNjMzfQ.Yy7Km3rGeIjNOVZ0CizHEUkOgyYXvrMsz-MYxqsMJPI";
const url = "https://sgvoqnyyfzqzkexortqc.supabase.co/rest/v1/rpc/get_table_columns"; // We don't have this RPC, using information_schema directly if possible

// Using standard REST to query information_schema if enabled, but usually it's not.
// Instead, I'll try to query columns of the leads table using a dummy select.

const checkUrl = "https://sgvoqnyyfzqzkexortqc.supabase.co/rest/v1/leads?select=*&limit=0";

try {
  const resp = await fetch(checkUrl, {
    method: 'GET',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });

  const data = await resp.json();
  console.log("TABLE COLUMNS PROBING:", data);
} catch (err) {
  console.error(err);
}
