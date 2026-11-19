// Owner: Yasin Shafiei
// Requirement: FR1 (create an account, log in, manage profile: edit name and email, change password, log out)
// What it does: the /api/auth routes.

const express = require('express');
const db = require('../config/db');
const validate = require('../utils/validate');
const { hashPassword, verifyPassword } = require('../utils/password');
const { createSession, deleteSession, requireLogin } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register  (public)
// Creates a customer or owner account (never admin) and logs the new user in.
router.post('/register', async (req, res) => {
  const error = validate.checkRegister(req.body);
  if (error) return res.status(400).json({ error });

  const fullName = req.body.full_name.trim();
  const email = req.body.email.trim().toLowerCase();
  const role = req.body.role; // the check above only allows 'customer' or 'owner'

  const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const result = await db.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [fullName, email, hashPassword(req.body.password), role]
  );

  const user = { id: result.insertId, full_name: fullName, email: email, role: role };
  const token = createSession(user.id);
  res.status(201).json({ token, user });
});

// POST /api/auth/login  (public)
// Wrong email and wrong password get the same message, so nobody can find out which emails exist.
router.post('/login', async (req, res) => {
  const error = validate.checkLogin(req.body);
  if (error) return res.status(400).json({ error });

  const email = req.body.email.trim().toLowerCase();
  const rows = await db.query(
    'SELECT id, full_name, email, role, password_hash FROM users WHERE email = ?',
    [email]
  );

  if (rows.length === 0 || !verifyPassword(req.body.password, rows[0].password_hash)) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }

  const row = rows[0];
  const user = { id: row.id, full_name: row.full_name, email: row.email, role: row.role };
  const token = createSession(user.id);
  res.json({ token, user });
});

// POST /api/auth/logout  (logged in)
router.post('/logout', requireLogin, (req, res) => {
  deleteSession(req.token);
  res.json({ message: 'You have been logged out.' });
});

// GET /api/auth/me  (logged in)
router.get('/me', requireLogin, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile  (logged in): change your own name and email.
router.put('/profile', requireLogin, async (req, res) => {
  const error = validate.checkProfile(req.body);
  if (error) return res.status(400).json({ error });

  const fullName = req.body.full_name.trim();
  const email = req.body.email.trim().toLowerCase();

  const taken = await db.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, req.user.id]);
  if (taken.length > 0) {
    return res.status(409).json({ error: 'Another account already uses this email.' });
  }

  await db.query('UPDATE users SET full_name = ?, email = ? WHERE id = ?', [fullName, email, req.user.id]);

  const user = { id: req.user.id, full_name: fullName, email: email, role: req.user.role };
  res.json({ message: 'Your details have been saved.', user });
});

// PUT /api/auth/password  (logged in): needs the current password.
router.put('/password', requireLogin, async (req, res) => {
  const error = validate.checkPasswordChange(req.body);
  if (error) return res.status(400).json({ error });

  const rows = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!verifyPassword(req.body.current_password, rows[0].password_hash)) {
    return res.status(400).json({ error: 'Your current password is not correct.' });
  }

  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(req.body.new_password), req.user.id]);
  res.json({ message: 'Your password has been changed.' });
});

module.exports = router;
