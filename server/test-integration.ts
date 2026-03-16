const API_BASE = "http://localhost:5000/api";

async function runTests() {
    console.log("🚀 Starting StuFi Integration Tests...\n");

    const testUser = {
        name: "Integration Test Bob",
        email: `test-${Date.now()}@stufi.app`,
        password: "Password123!",
        allowanceAmount: "1000",
        frequency: "monthly",
        categories: [{ name: "Food" }, { name: "Transport" }, { name: "Data" }]
    };

    let cookies: string[] = [];

    const headers = () => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (cookies.length) {
            h["Cookie"] = cookies.join("; ");
        }
        return h;
    };

    const assert = (condition: boolean, message: string) => {
        if (!condition) {
            console.error(`❌ FAILED: ${message}`);
            process.exit(1);
        }
        console.log(`✅ PASSED: ${message}`);
    };

    try {
        // 1. Onboard / Register Flow
        console.log("--- TEST: Onboarding Flow ---");
        const onboardRes = await fetch(`${API_BASE}/onboard`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(testUser)
        });
        const onboardData = await onboardRes.json().catch(() => ({}));
        if (!onboardRes.ok) {
            console.error("ONBOARD ERROR:", onboardData);
        }
        assert(onboardRes.ok, `Registration successful (${onboardRes.status})`);
        assert(!!onboardData.token, "Received auth token");

        // Save token for Bearer auth
        const token = onboardData.token;
        const authHeaders = { ...headers(), "Authorization": `Bearer ${token}` };

        // 2. Fetch User Profile
        console.log("\n--- TEST: Profile Fetch ---");
        const profileRes = await fetch(`${API_BASE}/me`, { headers: authHeaders });
        const profileData = await profileRes.json();
        assert(profileRes.ok, "Profile fetched properly");
        assert(profileData.user.email === testUser.email, "Profile email matches");

        // 3. Transactions Flow
        console.log("\n--- TEST: Transaction Flow ---");

        // Fetch categories first to get an ID for the transaction
        const cRes = await fetch(`${API_BASE}/categories`, { headers: authHeaders });
        const cData = await cRes.json();
        assert(cRes.ok, "Categories fetched");
        assert(cData.length > 0, "User has categories from onboarding");
        const categoryId = cData.find((c: any) => c.kind === "expense" || c.kind === "both")?.id;

        const tRes = await fetch(`${API_BASE}/transactions`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                amount: "50",
                type: "expense",
                categoryId,
                occurredAt: new Date().toISOString(),
                note: "Integration Test Lunch"
            })
        });
        const tData = await tRes.json();
        assert(tRes.ok, `Added expense successful (${tRes.status})`);
        assert(tData.amount === "50.00" || tData.amount === "50", "Expense amount correct");

        // 4. Analytics Summary
        console.log("\n--- TEST: Analytics Flow ---");
        const aRes = await fetch(`${API_BASE}/analytics/summary`, { headers: authHeaders });
        const aData = await aRes.json();
        assert(aRes.ok, "Analytics summary fetched");
        assert(parseFloat(aData.currentBalance) === 950, `Balance updated correctly (expected 950, got ${aData.currentBalance})`);

        // 5. Settings / Daily Cap
        console.log("\n--- TEST: Settings Flow ---");
        const sRes = await fetch(`${API_BASE}/settings`, { headers: authHeaders });
        const sData = await sRes.json();
        assert(sRes.ok, "Settings fetched");

        const updateSRes = await fetch(`${API_BASE}/settings`, {
            method: "PUT",
            headers: authHeaders,
            body: JSON.stringify({ dailyCapEnabled: true, dailyCapAmount: "100" })
        });
        const updateSData = await updateSRes.json().catch(() => ({}));
        if (!updateSRes.ok) console.error("SETTINGS ERROR:", updateSData);
        assert(updateSRes.ok, "Settings updated with daily cap");

        console.log("\n🎉 ALL TESTS PASSED!");
    } catch (err: any) {
        console.error(`💥 ERROR: ${err.message}`);
        process.exit(1);
    }
}

runTests();
