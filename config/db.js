// Owner: Danish Maindan
// Requirements: all of them (every route reads or writes the database through this file)
// What it does: reads the MySQL settings and creates one mysql2 connection pool.
// All database access goes through this file, so the driver can be changed here only.

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Use config/db.local.json (your own password, never on GitHub) if it exists,
// otherwise fall back to config/db.example.json.
const localFile = path.join(__dirname, 'db.local.json');
const exampleFile = path.join(__dirname, 'db.example.json');
const settingsFile = fs.existsSync(localFile) ? localFile : exampleFile;
const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

// A pool keeps a few connections open and lends one to each query.
const pool = mysql.createPool({
  host: settings.host,
  port: settings.port,
  user: settings.user,
  password: settings.password,
  database: settings.database,
  connectionLimit: 10,
  decimalNumbers: true // return DECIMAL values (prices, averages) as numbers, not strings
});

// Runs one SQL statement. Every value goes in through a ? placeholder,
// so user input is never pasted into the SQL text.
// SELECT returns an array of rows; INSERT, UPDATE and DELETE return an object
// with insertId and affectedRows.
async function query(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

// Called once when the server starts, to fail early with a clear message.
async function testConnection() {
  await pool.query('SELECT 1');
}

// Used only by database/setup.js: one connection with no database selected,
// allowed to run several statements at once (needed to run schema.sql and seed.sql).
function openSetupConnection() {
  return mysql.createConnection({
    host: settings.host,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    multipleStatements: true
  });
}

// Turns a MySQL connection error into a plain message for the terminal.
function explainError(err) {
  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return 'MySQL refused the username or password. Check "user" and "password" in config/db.local.json.';
  }
  if (err.code === 'ECONNREFUSED') {
    return 'Could not reach MySQL. Make sure MySQL is installed and running, then check "host" and "port" in config/db.local.json.';
  }
  if (err.code === 'ER_BAD_DB_ERROR') {
    return 'The "' + settings.database + '" database does not exist yet. Run: npm run db:setup';
  }
  return 'Could not connect to MySQL (' + (err.code || err.message) + '). Check your MySQL password in config/db.local.json.';
}

module.exports = { pool, query, testConnection, openSetupConnection, explainError, settings };
