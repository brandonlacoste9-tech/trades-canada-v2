const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndm9xbnl5ZnpxemtleG9ydHFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2NzYzMywiZXhwIjoyMDg5NjQzNjMzfQ.Yy7Km3rGeIjNOVZ0CizHEUkOgyYXvrMsz-MYxqsMJPI";
const checkUrl = "https://sgvoqnyyfzqzkexortqc.supabase.co/rest/v1/leads?select=*&limit=1";

try {
  const resp = await fetch(checkUrl, {
    method: 'GET',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });

  const data = await resp.json();
  if (data.length > 0) {
    console.log("ACTUAL PRODUCTION COLUMNS:", Object.keys(data[0]));
  } else {
    console.log("No data found in production leads table.");
  }
} catch (err) {
  console.error(err);
}
