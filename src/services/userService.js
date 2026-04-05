const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../models/db");
const { signToken } = require("../middleware/auth");

function register({ name, email, password, role }) {
  const db = getDb();

  // make sure the email isn't already taken before we create anything
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email.toLowerCase().trim());
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  // never store plain text passwords
  const hashed = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.prepare(
    `INSERT INTO users (id, name, email, password, role)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, name.trim(), email.toLowerCase().trim(), hashed, role);

  return { id, name: name.trim(), email: email.toLowerCase().trim(), role, status: "active" };
}

function login({ email, password }) {
  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim());

  // intentionally give the same error for wrong email or wrong password
  // so we don't reveal whether an email exists in the system
  if (!user || !bcrypt.compareSync(password, user.password)) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }
  if (user.status === "inactive") {
    const err = new Error("Account is inactive");
    err.status = 403;
    throw err;
  }

  const token = signToken(user.id);
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

function listUsers() {
  const db = getDb();
  // never return the password field in any listing
  return db
    .prepare("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC")
    .all();
}

function getUserById(id) {
  const db = getDb();
  const user = db
    .prepare("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?")
    .get(id);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
}

function updateUser(id, updates) {
  const db = getDb();
  getUserById(id); // will throw 404 if user doesn't exist

  // only allow these specific fields to be updated
  const allowed = ["name", "role", "status"];
  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) {
    const err = new Error("No valid fields to update");
    err.status = 400;
    throw err;
  }

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getUserById(id);
}

module.exports = { register, login, listUsers, getUserById, updateUser };
