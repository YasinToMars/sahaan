// Owner: Orit Woldemeskel
// Requirement: FR5 (restaurant owners add and update their own restaurants)
// What it does: the /api/owner/restaurants routes.
// "Own" is checked in the SQL itself: WHERE id = ? AND owner_id = <the logged-in owner>.

const express = require('express');
const db = require('../config/db');
const validate = require('../utils/validate');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/owner/restaurants  (owner): my restaurants with their stats.
router.get('/restaurants', requireRole('owner'), async (req, res) => {
  // menu_count comes from a small subquery: joining reviews AND menu_items in the
  // same query would multiply the rows and give wrong counts.
  const restaurants = await db.query(
    'SELECT r.id, r.name, r.cuisine, r.location, r.price_level, r.description, r.opening_hours, ' +
      '  ROUND(AVG(rv.rating), 1) AS avg_rating, COUNT(rv.id) AS review_count, ' +
      '  (SELECT COUNT(*) FROM menu_items m WHERE m.restaurant_id = r.id) AS menu_count ' +
      'FROM restaurants r ' +
      'LEFT JOIN reviews rv ON rv.restaurant_id = r.id ' +
      'WHERE r.owner_id = ? ' +
      'GROUP BY r.id ' +
      'ORDER BY r.name',
    [req.user.id]
  );
  res.json({ restaurants });
});

// Opening hours are optional, at most 100 characters (e.g. "Daily 10:00-23:00").
// Both routes below check this, the same rule as the browser check in public/js/owner.js.
// Missing, null or '' is fine; anything else must be text of at most 100 characters.
function openingHoursError(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' || value.length > 100) return 'Opening hours must be at most 100 characters.';
  return '';
}

// POST /api/owner/restaurants  (owner): add a restaurant.
router.post('/restaurants', requireRole('owner'), async (req, res) => {
  const error = validate.checkRestaurant(req.body);
  if (error) return res.status(400).json({ error });

  const hoursError = openingHoursError(req.body.opening_hours);
  if (hoursError) return res.status(400).json({ error: hoursError });

  const result = await db.query(
    'INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      req.user.id,
      req.body.name.trim(),
      req.body.cuisine,
      req.body.location,
      Number(req.body.price_level),
      validate.optionalText(req.body.description),
      validate.optionalText(req.body.opening_hours)
    ]
  );
  res.status(201).json({ message: 'Your restaurant has been added.', id: result.insertId });
});

// PUT /api/owner/restaurants/:id  (owner, own): update a restaurant.
router.put('/restaurants/:id', requireRole('owner'), async (req, res) => {
  const id = validate.toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Restaurant id must be a positive whole number.' });

  const error = validate.checkRestaurant(req.body);
  if (error) return res.status(400).json({ error });

  const hoursError = openingHoursError(req.body.opening_hours);
  if (hoursError) return res.status(400).json({ error: hoursError });

  const result = await db.query(
    'UPDATE restaurants SET name = ?, cuisine = ?, location = ?, price_level = ?, description = ?, opening_hours = ? ' +
      'WHERE id = ? AND owner_id = ?',
    [
      req.body.name.trim(),
      req.body.cuisine,
      req.body.location,
      Number(req.body.price_level),
      validate.optionalText(req.body.description),
      validate.optionalText(req.body.opening_hours),
      id,
      req.user.id
    ]
  );
  // 0 rows means the restaurant does not exist, or it belongs to another owner.
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Restaurant not found.' });

  res.json({ message: 'Your restaurant has been updated.' });
});

module.exports = router;
