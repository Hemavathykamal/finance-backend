/**
 * Integration tests — run: npm test
 * Tests are run sequentially against a live server.
 * Make sure the server is running on port 3000.
 */

const BASE = "http://localhost:3000/api";

let adminToken, analystToken, viewerToken;
let createdRecordId;

async function request(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, body: json };
}

function pass(label) {
  console.log(`  ✅ PASS: ${label}`);
}
function fail(label, got) {
  console.error(`  ❌ FAIL: ${label}`, got);
  process.exitCode = 1;
}
function assert(label, condition, got) {
  condition ? pass(label) : fail(label, got);
}

async function runTests() {
  console.log("\n🧪 Finance Backend Integration Tests\n");

  // Auth 
  console.log("─ Auth");

  const reg = await request("POST", "/auth/register", {
    name: "Test Admin",
    email: `testadmin_${Date.now()}@test.com`,
    password: "secret123",
    role: "admin",
  });
  assert("Register new admin user", reg.status === 201, reg);

  const badLogin = await request("POST", "/auth/login", {
    email: "nobody@test.com",
    password: "wrongpass",
  });
  assert("Login with wrong credentials returns 401", badLogin.status === 401, badLogin);

  // Login seeded users (requires seed to have been run first)
  const adminLogin = await request("POST", "/auth/login", {
    email: "admin@finance.com",
    password: "admin123",
  });
  if (adminLogin.status !== 200) {
    console.warn("  ⚠️  Seeded admin not found — run `npm run seed` first and re-run tests");
    return;
  }
  adminToken = adminLogin.body.token;
  assert("Admin login returns token", !!adminToken, adminLogin.body);

  const analystLogin = await request("POST", "/auth/login", {
    email: "analyst@finance.com",
    password: "analyst123",
  });
  analystToken = analystLogin.body.token;

  const viewerLogin = await request("POST", "/auth/login", {
    email: "viewer@finance.com",
    password: "viewer123",
  });
  viewerToken = viewerLogin.body.token;

  const me = await request("GET", "/auth/me", null, adminToken);
  assert("GET /auth/me returns current user", me.status === 200 && me.body.user.role === "admin", me);

  // Records CRUD 
  console.log("\n─ Financial Records");

  const create = await request(
    "POST",
    "/records",
    { amount: 5000, type: "income", category: "Test", date: "2026-04-04", notes: "Test record" },
    adminToken
  );
  assert("Admin can create record", create.status === 201, create);
  createdRecordId = create.body.data?.id;

  const viewerCreate = await request(
    "POST",
    "/records",
    { amount: 100, type: "expense", category: "Test", date: "2026-04-04" },
    viewerToken
  );
  assert("Viewer cannot create record (403)", viewerCreate.status === 403, viewerCreate);

  const list = await request("GET", "/records?page=1&limit=5", null, viewerToken);
  assert("Viewer can list records", list.status === 200 && Array.isArray(list.body.data), list);

  const filtered = await request("GET", "/records?type=income&from=2026-04-01", null, adminToken);
  assert("Filter records by type and date", filtered.status === 200, filtered);

  const one = await request("GET", `/records/${createdRecordId}`, null, analystToken);
  assert("Get single record", one.status === 200, one);

  const update = await request("PATCH", `/records/${createdRecordId}`, { amount: 9999 }, adminToken);
  assert("Admin can update record", update.status === 200 && update.body.data.amount === 9999, update);

  const analystUpdate = await request("PATCH", `/records/${createdRecordId}`, { notes: "x" }, analystToken);
  assert("Analyst cannot update record (403)", analystUpdate.status === 403, analystUpdate);

  const del = await request("DELETE", `/records/${createdRecordId}`, null, adminToken);
  assert("Admin can soft-delete record", del.status === 200, del);

  const afterDel = await request("GET", `/records/${createdRecordId}`, null, adminToken);
  assert("Deleted record is no longer accessible", afterDel.status === 404, afterDel);

  // Validation 
  console.log("\n─ Validation");

  const badRecord = await request("POST", "/records", { type: "income" }, adminToken);
  assert("Missing required fields returns 400", badRecord.status === 400, badRecord);

  const negAmount = await request(
    "POST",
    "/records",
    { amount: -50, type: "income", category: "X", date: "2026-04-04" },
    adminToken
  );
  assert("Negative amount is rejected", negAmount.status === 400, negAmount);

  const badDate = await request(
    "POST",
    "/records",
    { amount: 100, type: "expense", category: "X", date: "not-a-date" },
    adminToken
  );
  assert("Invalid date format is rejected", badDate.status === 400, badDate);

  // Dashboard 
  console.log("\n─ Dashboard");

  const summary = await request("GET", "/dashboard/summary", null, viewerToken);
  assert("Viewer can access summary", summary.status === 200, summary);

  const cats = await request("GET", "/dashboard/categories", null, analystToken);
  assert("Analyst can access category totals", cats.status === 200, cats);

  const catsViewer = await request("GET", "/dashboard/categories", null, viewerToken);
  assert("Viewer cannot access category totals (403)", catsViewer.status === 403, catsViewer);

  const monthly = await request("GET", "/dashboard/trends/monthly?months=3", null, adminToken);
  assert("Admin can access monthly trends", monthly.status === 200, monthly);

  const weekly = await request("GET", "/dashboard/trends/weekly", null, analystToken);
  assert("Analyst can access weekly trends", weekly.status === 200, weekly);

  const recent = await request("GET", "/dashboard/recent?limit=5", null, adminToken);
  assert("Admin can access recent activity", recent.status === 200, recent);

  // User Management
  console.log("\n─ User Management");

  const userList = await request("GET", "/users", null, adminToken);
  assert("Admin can list users", userList.status === 200, userList);

  const viewerListUsers = await request("GET", "/users", null, viewerToken);
  assert("Viewer cannot list users (403)", viewerListUsers.status === 403, viewerListUsers);

  const firstUser = userList.body.data?.[0];
  if (firstUser) {
    const updateUser = await request("PATCH", `/users/${firstUser.id}`, { status: "active" }, adminToken);
    assert("Admin can update user status", updateUser.status === 200, updateUser);
  }

  // Unauthenticated 
  console.log("\n─ Authentication Guard");

  const noToken = await request("GET", "/records", null, null);
  assert("Request without token is rejected (401)", noToken.status === 401, noToken);

  const invalidToken = await request("GET", "/records", null, "invalid.token.here");
  assert("Request with invalid token is rejected (401)", invalidToken.status === 401, invalidToken);

  console.log("\n────────────────────────────────────────────");
  if (process.exitCode === 1) {
    console.log("Some tests FAILED. See output above.");
  } else {
    console.log("All tests PASSED ✅");
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
