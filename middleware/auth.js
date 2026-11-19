// Owner: Yasin Shafiei
// Requirements: FR1 (log in and out), NFR Security (the server checks the role on every protected request)
// What it does: keeps the login sessions in memory and provides requireLogin and requireRole.
//
// How a login session works:
//  1. On login or register the server makes a random token and remembers  token -> { userId, createdAt }.
//  2. The browser keeps the token in localStorage and sends it in every request:
//       Authorization: Bearer <token>
//  3. requireLogin looks the token up, then loads the user from the database,
//     so a role change or a deleted account takes effect at once.
// The Map lives in memory, so restarting the server logs everyone out.

const crypto = require('crypto');
const db = require('../config/db');

const sessions = new Map(); // token -> { userId, createdAt }
const SESSION_LENGTH = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

// Creates a new session for a user and returns its token.
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex'); // 64 random hex characters
  sessions.set(token, { userId: userId, createdAt: Date.now() });
  return token;
}

function deleteSession(token) {
  sessions.delete(token);
}

// Reads the token from the "Authorization: Bearer <token>" header.
function getToken(req) {
  const header = req.get('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

// Middleware: lets the request through only if it has a valid token.
// Afterwards req.user is { id, full_name, email, role } and req.token is the token.
async function requireLogin(req, res, next) {
  const token = getToken(req);
  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Please log in first.' });
  }
  if (Date.now() - session.createdAt > SESSION_LENGTH) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }

  const rows = await db.query('SELECT id, full_name, email, role FROM users WHERE id = ?', [session.userId]);
  if (rows.length === 0) {
    sessions.delete(token); // the account was deleted
    return res.status(401).json({ error: 'Please log in first.' });
  }

  req.user = rows[0];
  req.token = token;
  next();
}

// Middleware maker: requireRole('owner') or requireRole('customer', 'admin').
// It runs requireLogin first, then checks the user's role.
function requireRole(...roles) {
  function checkRole(req, res, next) {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have access to this." });
    }
    next();
  }
  return [requireLogin, checkRole];
}

module.exports = { createSession, deleteSession, requireLogin, requireRole };
