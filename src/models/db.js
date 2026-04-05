/**
 * Database layer using sql.js — a pure JavaScript SQLite port.
 * No native compilation needed. Works on Windows, Mac, Linux out of the box.
 * sql.js operates in memory. We persist by writing the DB file to disk after
 * every write operation via the run wrapper below.
 */

const path = require("path");
const fs   = require("fs");

const DB_PATH = path.join(__dirname, "../../finance.db");

let SQL;
let _db;

async function initSqlJs() {
  if (!SQL) {
    SQL = await require("sql.js")();
  }
}

function loadDb() {
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }
}

function persist() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function initSchema() {
  _db.run(`PRAGMA foreign_keys = ON;`);
  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id         TEXT PRIMARY KEY,
      amount     REAL NOT NULL,
      type       TEXT NOT NULL,
      category   TEXT NOT NULL,
      date       TEXT NOT NULL,
      notes      TEXT,
      created_by TEXT NOT NULL,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_records_type     ON financial_records(type);`);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_records_category ON financial_records(category);`);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_records_date     ON financial_records(date);`);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_records_deleted  ON financial_records(deleted_at);`);
  persist();
}

// Synchronous-style wrapper around sql.js 

class Statement {
  constructor(sql) {
    this._sql = sql;
  }

  get(...params) {
    const flat = params.flat();
    const results = _db.exec(this._sql, flat);
    if (!results.length || !results[0].values.length) return undefined;
    const { columns, values } = results[0];
    return rowToObj(columns, values[0]);
  }

  all(...params) {
    const flat = params.flat();
    const results = _db.exec(this._sql, flat);
    if (!results.length) return [];
    const { columns, values } = results[0];
    return values.map((row) => rowToObj(columns, row));
  }

  run(...params) {
    const flat = params.flat();
    _db.run(this._sql, flat);
    persist();
    return this;
  }
}

function rowToObj(columns, values) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return obj;
}

const db = {
  prepare: (sql) => new Statement(sql),
  exec: (sql) => { _db.run(sql); persist(); },
};

// Bootstrap (called once at startup) 

let ready = false;

async function bootstrap() {
  if (ready) return;
  await initSqlJs();
  loadDb();
  initSchema();
  ready = true;
}

function getDb() {
  if (!ready) throw new Error("DB not ready. Call bootstrap() at startup.");
  return db;
}

module.exports = { bootstrap, getDb };
