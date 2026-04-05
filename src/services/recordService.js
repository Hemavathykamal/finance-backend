const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../models/db");

// base condition used in every query - we never show deleted records
const BASE_WHERE = "deleted_at IS NULL";

// builds WHERE clause dynamically based on whatever filters are passed
function buildFilters(query) {
  const conditions = [BASE_WHERE];
  const params = [];

  if (query.type) {
    conditions.push("type = ?");
    params.push(query.type);
  }
  if (query.category) {
    // partial match so user can search "sal" and get "Salary"
    conditions.push("category LIKE ?");
    params.push(`%${query.category}%`);
  }
  if (query.from) {
    conditions.push("date >= ?");
    params.push(query.from);
  }
  if (query.to) {
    conditions.push("date <= ?");
    params.push(query.to);
  }

  return { where: conditions.join(" AND "), params };
}

function createRecord({ amount, type, category, date, notes }, userId) {
  const db = getDb();
  const id = uuidv4();
  db.prepare(
    `INSERT INTO financial_records (id, amount, type, category, date, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, Number(amount), type, category.trim(), date, notes?.trim() || null, userId);

  return getRecordById(id);
}

function listRecords(query) {
  const db = getDb();
  const { where, params } = buildFilters(query);

  // pagination defaults: page 1, 20 per page, max 100 per page
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM financial_records WHERE ${where}`)
    .get(...params).count;

  const records = db
    .prepare(
      `SELECT r.*, u.name as created_by_name
       FROM financial_records r
       JOIN users u ON r.created_by = u.id
       WHERE ${where}
       ORDER BY r.date DESC, r.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  return {
    data: records,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

function getRecordById(id) {
  const db = getDb();
  const record = db
    .prepare(
      `SELECT r.*, u.name as created_by_name
       FROM financial_records r
       JOIN users u ON r.created_by = u.id
       WHERE r.id = ? AND r.deleted_at IS NULL`
    )
    .get(id);
  if (!record) {
    const err = new Error("Record not found");
    err.status = 404;
    throw err;
  }
  return record;
}

function updateRecord(id, updates) {
  const db = getDb();
  getRecordById(id); // throws 404 if not found or already deleted

  const allowed = ["amount", "type", "category", "date", "notes"];
  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === "amount" ? Number(updates[key]) : updates[key]);
    }
  }

  if (fields.length === 0) {
    const err = new Error("No valid fields to update");
    err.status = 400;
    throw err;
  }

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE financial_records SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getRecordById(id);
}

// soft delete - we set deleted_at instead of actually removing the row
// this is important for financial data because you may need an audit trail
function softDeleteRecord(id) {
  const db = getDb();
  getRecordById(id);
  db.prepare(
    "UPDATE financial_records SET deleted_at = datetime('now') WHERE id = ?"
  ).run(id);
  return { message: "Record deleted successfully" };
}

module.exports = { createRecord, listRecords, getRecordById, updateRecord, softDeleteRecord };
