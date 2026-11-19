// Owner: Aberham Ketema Abebe
// Requirements: all of them (creates the database the app uses)
// What it does: npm run db:setup
//   1. drops and recreates the "sahaan" database
//   2. runs schema.sql (the four tables)
//   3. inserts the demo users, hashing their passwords with utils/password.js
//   4. runs seed.sql (restaurants, menu items, reviews)
//   5. prints the demo accounts
// Run it again any time to reset everything to the demo data.

const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { hashPassword } = require('../utils/password');

// Demo accounts. These passwords are only for the demo data, never for real accounts.
const DEMO_USERS = [
  { full_name: 'Sahaan Admin', email: 'admin@sahaan.test', password: 'Admin123', role: 'admin' },
  { full_name: 'Omar Haddad', email: 'owner1@sahaan.test', password: 'Owner123', role: 'owner' },
  { full_name: 'Priya Nair', email: 'owner2@sahaan.test', password: 'Owner123', role: 'owner' },
  { full_name: 'Khalid Rahman', email: 'owner3@sahaan.test', password: 'Owner123', role: 'owner' },
  { full_name: 'Aisha Karim', email: 'customer1@sahaan.test', password: 'Customer123', role: 'customer' },
  { full_name: 'Daniel Mensah', email: 'customer2@sahaan.test', password: 'Customer123', role: 'customer' },
  { full_name: 'Fatima Idrissi', email: 'customer3@sahaan.test', password: 'Customer123', role: 'customer' },
  { full_name: 'Rohan Pillai', email: 'customer4@sahaan.test', password: 'Customer123', role: 'customer' }
];

async function setup() {
  const databaseName = db.settings.database;
  // A database name cannot be a ? placeholder. It comes from our own config file,
  // not from a user, and we still only allow letters, numbers and _.
  if (!/^\w+$/.test(databaseName)) {
    throw new Error('The database name in config/db.local.json may only use letters, numbers and _.');
  }

  const connection = await db.openSetupConnection();
  try {
    console.log('Creating the "' + databaseName + '" database...');
    await connection.query('DROP DATABASE IF EXISTS `' + databaseName + '`');
    await connection.query('CREATE DATABASE `' + databaseName + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('USE `' + databaseName + '`');

    console.log('Creating the tables (schema.sql)...');
    await connection.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

    console.log('Adding the demo users...');
    for (const user of DEMO_USERS) {
      await connection.execute(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [user.full_name, user.email, hashPassword(user.password), user.role]
      );
    }

    console.log('Adding restaurants, menus and reviews (seed.sql)...');
    await connection.query(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));

    console.log('\nDone! Demo accounts:');
    console.table(DEMO_USERS.map((user) => ({ role: user.role, email: user.email, password: user.password })));
    console.log('Now run: npm start');
  } finally {
    await connection.end();
    await db.pool.end();
  }
}

setup().catch((err) => {
  console.error('\nSetup failed.');
  if (err.code) {
    console.error(db.explainError(err));
  }
  console.error(err.message);
  process.exitCode = 1;
});
