// Owner: Danish Maindan
// Requirement: FR3 (view restaurants, their menus and their reviews)
// What it does: GET /api/restaurants/:id returns one restaurant with its menu and reviews.

const express = require('express');
const db = require('../config/db');
const validate = require('../utils/validate');

const router = express.Router();

// GET /api/restaurants/:id  (public)
router.get('/:id', async (req, res) => {
  const id = validate.toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Restaurant id must be a positive whole number.' });

  // 1. The restaurant, its owner's name and its average rating.
  const rows = await db.query(
    'SELECT r.id, r.owner_id, r.name, r.cuisine, r.location, r.price_level, r.description, r.opening_hours, ' +
      '  u.full_name AS owner_name, ' +
      '  ROUND(AVG(rv.rating), 1) AS avg_rating, COUNT(rv.id) AS review_count ' +
      'FROM restaurants r ' +
      'JOIN users u ON u.id = r.owner_id ' +
      'LEFT JOIN reviews rv ON rv.restaurant_id = r.id ' +
      'WHERE r.id = ? ' +
      'GROUP BY r.id, u.full_name',
    [id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Restaurant not found.' });

  // 2. The menu.
  const menu = await db.query(
    'SELECT id, name, description, price FROM menu_items WHERE restaurant_id = ? ORDER BY id',
    [id]
  );

  // 3. The reviews, newest first, with each reviewer's name.
  const reviews = await db.query(
    'SELECT rv.id, rv.user_id, rv.rating, rv.comment, rv.created_at, rv.updated_at, u.full_name AS reviewer_name ' +
      'FROM reviews rv ' +
      'JOIN users u ON u.id = rv.user_id ' +
      'WHERE rv.restaurant_id = ? ' +
      'ORDER BY rv.created_at DESC, rv.id DESC',
    [id]
  );

  res.json({ restaurant: rows[0], menu, reviews });
});

module.exports = router;
