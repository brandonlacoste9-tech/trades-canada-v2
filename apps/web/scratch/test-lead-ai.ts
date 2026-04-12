import { qualifyLead } from "../src/lib/ai/leadQualification";

async function runTest() {
  console.log("--- Testing Lead Qualification ---");

  const mockLeads = [
    {
      name: "John Doe",
      email: "john@example.com",
      phone: "555-0199",
      city: "Toronto",
      projectType: "roofing" as any,
      language: "en" as any,
    },
    {
      name: "Jane Smith",
      email: "jane@test.fr",
      phone: null,
      city: "Montreal",
      projectType: "electrical" as any,
      language: "fr" as any,
    },
    {
      name: "Bob Builder",
      email: "bob@spam.com",
      phone: null,
      city: null,
      projectType: "other" as any,
      language: "en" as any,
    }
  ];

  for (const lead of mockLeads) {
    console.log(`\nTesting lead: ${lead.name} (${lead.projectType})`);
    const result = await qualifyLead(lead);
    console.log(`Provider: ${result.provider}`);
    console.log(`Score: ${result.score}`);
    console.log(`Next Action: ${result.nextAction}`);
    console.log(`Summary: ${result.summary}`);
  }
}

runTest().catch(console.error);
