/**
 * Seed script — populates the database with demo users and financial records.
 * Run: node src/utils/seed.js
 */

const { bootstrap, getDb } = require("../models/db");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

async function seed() {
  await bootstrap();
  const db = getDb();

  db.prepare("DELETE FROM financial_records").run();
  db.prepare("DELETE FROM users").run();

  const users = [
    { name: "Admin User",   email: "admin@finance.com",   password: "admin123",   role: "admin"   },
    { name: "Analyst User", email: "analyst@finance.com", password: "analyst123", role: "analyst" },
    { name: "Viewer User",  email: "viewer@finance.com",  password: "viewer123",  role: "viewer"  },
  ];

  const createdUsers = users.map((u) => {
    const id = uuidv4();
    const hashed = bcrypt.hashSync(u.password, 10);
    db.prepare(
      "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)"
    ).run(id, u.name, u.email, hashed, u.role);
    return { ...u, id };
  });

  const adminId = createdUsers[0].id;

  const records = [
    { amount: 75000, type: "income",  category: "Salary",        date: "2026-04-01", notes: "Monthly salary" },
    { amount: 15000, type: "expense", category: "Rent",          date: "2026-04-02", notes: "April rent" },
    { amount: 2500,  type: "expense", category: "Utilities",     date: "2026-04-03", notes: "Electricity & water" },
    { amount: 8000,  type: "expense", category: "Food",          date: "2026-04-03", notes: "Grocery run" },
    { amount: 12000, type: "income",  category: "Freelance",     date: "2026-04-04", notes: "Design project" },
    { amount: 1800,  type: "expense", category: "Transport",     date: "2026-03-28", notes: "Fuel & cab" },
    { amount: 3200,  type: "expense", category: "Healthcare",    date: "2026-03-25", notes: "Clinic visit" },
    { amount: 5000,  type: "expense", category: "Entertainment", date: "2026-03-20", notes: "Weekend trip" },
    { amount: 70000, type: "income",  category: "Salary",        date: "2026-03-01", notes: "March salary" },
    { amount: 15000, type: "expense", category: "Rent",          date: "2026-03-02", notes: "March rent" },
    { amount: 9500,  type: "income",  category: "Freelance",     date: "2026-03-15", notes: "Logo design" },
    { amount: 2200,  type: "expense", category: "Utilities",     date: "2026-03-10", notes: "Internet bill" },
    { amount: 6800,  type: "expense", category: "Food",          date: "2026-03-08", notes: "Monthly groceries" },
    { amount: 70000, type: "income",  category: "Salary",        date: "2026-02-01", notes: "Feb salary" },
    { amount: 15000, type: "expense", category: "Rent",          date: "2026-02-02", notes: "Feb rent" },
  ];

  for (const r of records) {
    db.prepare(
      "INSERT INTO financial_records (id, amount, type, category, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(uuidv4(), r.amount, r.type, r.category, r.date, r.notes, adminId);
  }

  console.log("Seed complete!");
  console.log("\nDemo credentials:");
  for (const u of createdUsers) {
    console.log(`  ${u.role.padEnd(8)} -> ${u.email} / ${u.password}`);
  }
  console.log("\nRun the server: npm start");
}

seed().catch((err) => { console.error(err); process.exit(1); });
