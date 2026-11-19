// Owner: Yassin Awny
// Requirements: FR8 (manage customer and owner accounts), FR9 (manage any restaurant),
//               FR10 (remove inappropriate reviews)
// What it does: the /api/admin routes. Every route starts with requireRole('admin').

const express = require('express');
const db = require('../config/db');
const validate = require('../utils/validate');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats: the overview counts at the top of the admin page.
router.get('/stats', requireRole('admin'), async (req, res) => {
  const rows = await db.query(
    'SELECT ' +
      "  (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers, " +
      "  (SELECT COUNT(*) FROM users WHERE role = 'owner') AS owners, " +
      '  (SELECT COUNT(*) FROM restaurants) AS restaurants, ' +
      '  (SELECT COUNT(*) FROM reviews) AS reviews'
  );
  res.json(rows[0]);
});

// ---------- Users (FR8) ----------

// GET /api/admin/users?q=&role=  (q matches the name or email)
router.get('/users', requireRole('admin'), async (req, res) => {
  const error = validate.checkAdminSearch(req.query);
  if (error) return res.status(400).json({ error });

  const q = validate.cleanText(req.query.q);
  let sql =
    'SELECT u.id, u.full_name, u.email, u.role, u.created_at, ' +
    '  (SELECT COUNT(*) FROM restaurants r WHERE r.owner_id = u.id) AS restaurant_count ' +
    'FROM users u WHERE 1 = 1';
  const params = [];

  if (q) {
    sql += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
    params.push('%' + q + '%', '%' + q + '%');
  }
  if (req.query.role) {
    sql += ' AND u.role = ?';
    params.push(req.query.role);
  }
  sql += ' ORDER BY u.role, u.full_name';

  const users = await db.query(sql, params);
  res.json({ users });
});

// PUT /api/admin/users/:id: edit name, email and role.
router.put('/users/:id', requireRole('admin'), async (req, res) => {
  const id = validate.toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'User id must be a positive whole number.' });

  const error = validate.checkAdminUser(req.body);
  if (error) return res.status(400).json({ error });

  // An admin cannot change their own role (so the site is never left without an admin by mistake).
  if (id === req.user.id && req.body.role !== req.user.role) {
    return res.status(400).json({ error: 'You cannot change your own role.' });
  }

  const email = req.body.email.trim().toLowerCase();
  const taken = await db.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, id]);
  if (taken.length > 0) return res.status(409).json({ error: 'Another account already uses this email.' });

  const result = await db.query(
    'UPDATE users SET full_name = ?, email = ?, role = ? WHERE id = ?',
    [req.body.full_name.trim(), email, req.body.role, id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found.' });

  res.json({ message: 'User updated.' });
});

// DELETE /api/admin/users/:id
// ON DELETE CASCADE also deletes the user's reviews, and an owner's restaurants (with their menus and reviews).
router.delete('/users/:id', requireRole('admin'), async (req, res) => {
  const id = validate.toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'User id must be a positive whole number.' });

  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' });

  const result = await db.query('DELETE FROM users WHERE id = ?', [id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found.' });

  res.json({ message: 'User deleted.' });
});

// ---------- Restaurants (FR9) ----------

// GET /api/admin/restaurants?q=  (q matches the name, cuisine, location or owner's name)
router.get('/restaurants', requireRole('admin'), async (req, res) => {
  const error = validate.checkAdminSearch(req.query);
  if (error) return res.status(400).json({ error });

  const q = validate.cleanText(req.query.q);
  let sql =
    'SELECT r.id, r.name, r.cuisine, r.location, r.price_level, r.description, ' +
    '  u.full_name AS owner_name, u.email AS owner_email, ' +
    '  ROUND(AVG(rv.rating), 1) AS avg_rating, COUNT(rv.id) AS review_count ' +
    'FROM restaurants r ' +
    'JOIN users u ON u.id = r.owner_id ' +
    'LEFT JOIN reviews rv ON rv.restaurant_id = r.id ' +
    'WHERE 1 = 1';
  const params = [];

  if (q) {
    sql += ' AND (r.name LIKE ? OR r.cuisine LIKE ? OR r.location LIKE ? OR u.full_name LIKE ?)';
    const pattern = '%' + q + '%';
    params.push(pattern, pattern, pattern, pattern);
  }
  sql += ' GROUP BY r.id, u.full_name, u.email ORDER BY r.name';

  const restaurants = await db.query(sql, params);
  res.json({ restaurants });
});

// PUT /api/admin/restaurants/:id: edit any restaurant.
router.put('/restaurants/:id', requireRole('admin'), async (req, res) => {
  const id = validate.toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Restaurant id must be a positive whole number.' });

  const error = validate.checkRestaurant(req.body);
  if (error) return res.status(400).json({ error });

  const result = await db.query(
    'UPDATE restaurants SET name = ?, cuisine = ?, location = ?, price_level = ?, description = ? WHERE id = ?',
    [
      req.body.name.trim(),
      req.body.cuisine,
      req.body.location,
      Number(req.body.price_level),
      validate.optionalText(req.body.description),
      id
    ]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Restaurant not found.' });

  res.json({ message: 'Restaurant updated.' });
});

// DELETE /api/admin/restaurants/:id  (its menu items and reviews go too, by ON DELETE CASCADE)
router.delete('/restaurants/:id', requireRole('admin'), async (req, res) => {
  const id = validate.toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Restaurant id must be a positive whole number.' });

  const result = await db.query('DELETE FROM restaurants WHERE id = ?', [id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Restaurant not found.' });

  res.json({ message: 'Restaurant deleted.' });
});

// ---------- Reviews (FR10) ----------

// GET /api/admin/reviews?q=  (newest first; q matches the comment, restaurant name or reviewer name)
router.get('/reviews', requireRole('admin'), async (req, res) => {
  const error = validate.checkAdminSearch(req.query);
  if (error) return res.status(400).json({ error });

  const q = validate.cleanText(req.query.q);
  let sql =
    'SELECT rv.id, rv.rating, rv.comment, rv.created_at, ' +
    '  r.id AS restaurant_id, r.name AS restaurant_name, u.full_name AS reviewer_name ' +
    'FROM reviews rv ' +
    'JOIN restaurants r ON r.id = rv.restaurant_id ' +
    'JOIN users u ON u.id = rv.user_id ' +
    'WHERE 1 = 1';
  const params = [];

  if (q) {
    sql += ' AND (rv.comment LIKE ? OR r.name LIKE ? OR u.full_name LIKE ?)';
    const pattern = '%' + q + '%';
    params.push(pattern, pattern, pattern);
  }
  sql += ' ORDER BY rv.created_at DESC, rv.id DESC';

  const reviews = await db.query(sql, params);
  res.json({ reviews });
});

// DELETE /api/admin/reviews/:id: remove an inappropriate review.
router.delete('/reviews/:id', requireRole('admin'), async (req, res) => {
  const id = validate.toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Review id must be a positive whole number.' });

  const result = await db.query('DELETE FROM reviews WHERE id = ?', [id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Review not found.' });

  res.json({ message: 'Review removed.' });
});

module.exports = router;
