const { getDb } = require("../models/db");

// reuse this in every query so deleted records never appear in analytics
const ACTIVE = "deleted_at IS NULL";

// main summary numbers shown at the top of the dashboard
function getSummary() {
  const db = getDb();

  const totals = db
    .prepare(
      `SELECT
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
         COUNT(*) AS total_records
       FROM financial_records
       WHERE ${ACTIVE}`
    )
    .get();

  // calculate net balance here rather than in the frontend
  const net_balance = (totals.total_income || 0) - (totals.total_expenses || 0);

  return {
    total_income: totals.total_income || 0,
    total_expenses: totals.total_expenses || 0,
    net_balance,
    total_records: totals.total_records,
  };
}

// breakdown by category - useful to see where money is going
function getCategoryTotals() {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         category,
         type,
         SUM(amount)  AS total,
         COUNT(*)     AS count
       FROM financial_records
       WHERE ${ACTIVE}
       GROUP BY category, type
       ORDER BY total DESC`
    )
    .all();
}

// shows income vs expense month by month for the last N months
function getMonthlyTrends(months = 6) {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         strftime('%Y-%m', date) AS month,
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses,
         COUNT(*) AS count
       FROM financial_records
       WHERE ${ACTIVE}
         AND date >= date('now', ? || ' months')
       GROUP BY month
       ORDER BY month ASC`
    )
    .all(`-${months}`);
}

// same idea but weekly, covers the last 12 weeks
function getWeeklyTrends() {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         strftime('%Y-W%W', date) AS week,
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses,
         COUNT(*) AS count
       FROM financial_records
       WHERE ${ACTIVE}
         AND date >= date('now', '-12 weeks')
       GROUP BY week
       ORDER BY week ASC`
    )
    .all();
}

// latest records - useful for an activity feed on the dashboard
function getRecentActivity(limit = 10) {
  const db = getDb();
  const n = Math.min(50, Math.max(1, parseInt(limit) || 10));
  return db
    .prepare(
      `SELECT r.id, r.amount, r.type, r.category, r.date, r.notes,
              u.name AS created_by_name
       FROM financial_records r
       JOIN users u ON r.created_by = u.id
       WHERE ${ACTIVE}
       ORDER BY r.created_at DESC
       LIMIT ?`
    )
    .all(n);
}

module.exports = { getSummary, getCategoryTotals, getMonthlyTrends, getWeeklyTrends, getRecentActivity };
