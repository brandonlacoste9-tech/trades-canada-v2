async function testApolloLogic(title: string, city: string) {
  console.log(`\n--- Testing Apollo Logic for: "${title}" in ${city} ---`);
  
  const apolloKey = "mock-key";
  let enrichedName: string | null = null;
  let enrichedPhone: string | null = null;

  const searchParams: any = {
    per_page: 1,
    page: 1,
  };

  if (title && title.length > 5) {
    searchParams.q_organization_name = title;
    console.log("Searching by organization name...");
  } else if (city) {
    searchParams.person_locations = [city];
    console.log("Searching by city...");
  }

  console.log("Params:", JSON.stringify(searchParams, null, 2));

  // Mocking transition logic
  if (searchParams.q_organization_name === "ABC Roofing Ltd") {
    enrichedName = "John Smith";
    enrichedPhone = "555-123-4567";
  } else if (searchParams.person_locations?.[0] === "Toronto") {
    enrichedName = "Toronto Person";
    enrichedPhone = "416-555-0000";
  }

  if (enrichedName) {
    console.log(`RESULT: Found ${enrichedName} (${enrichedPhone})`);
  } else {
    console.log("RESULT: No match found.");
  }
}

async function runTests() {
  await testApolloLogic("ABC Roofing Ltd", "Toronto");
  await testApolloLogic("Permit 123", "Toronto");
  await testApolloLogic("Small", "Montreal");
}

runTests();
