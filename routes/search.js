// Owner: Yasin Shafiei
// Requirement: FR2 (search and filter restaurants by text, cuisine, location, price and minimum rating)
// What it does: GET /api/restaurants (search) and GET /api/restaurants/filters (the lists for the dropdowns).
// server.js mounts this router before routes/restaurants.js, so "filters" is not read as an :id.

const express = require('express');
const db = require('../config/db');
const validate = require('../utils/validate');
const { CUISINES, LOCATIONS, PRICE_LABELS } = require('../config/lists');

const router = express.Router();

// ORDER BY cannot use a ? placeholder, so the browser sends a short name
// and we pick the SQL from this fixed list. User text never reaches ORDER BY.
const ORDER_BY = {
  rating: 'avg_rating DESC, review_count DESC, r.name ASC',
  name: 'r.name ASC',
  newest: 'r.created_at DESC, r.id DESC'
};

// GET /api/restaurants/filters  (public)
router.get('/filters', (req, res) => {
  res.json({ cuisines: CUISINES, locations: LOCATIONS, priceLabels: PRICE_LABELS });
});

// GET /api/restaurants?q=&cuisine=&location=&price=&minRating=&sort=  (public)
router.get('/', async (req, res) => {
  const error = validate.checkSearch(req.query);
  if (error) return res.status(400).json({ error });

  const q = validate.cleanText(req.query.q);
  const { cuisine, location, price, minRating } = req.query;
  const sort = req.query.sort || 'rating';

  // LEFT JOIN keeps restaurants that have no reviews yet (their avg_rating is NULL).
  let sql =
    'SELECT r.id, r.name, r.cuisine, r.location, r.price_level, r.description, ' +
    '  ROUND(AVG(rv.rating), 1) AS avg_rating, COUNT(rv.id) AS review_count ' +
    'FROM restaurants r ' +
    'LEFT JOIN reviews rv ON rv.restaurant_id = r.id ' +
    'WHERE 1 = 1';
  const params = [];

  // Each filter adds one condition and one value for its ? placeholder.
  if (q) {
    // Matches the name, the cuisine, or the name of any dish on the menu.
    sql +=
      ' AND (r.name LIKE ? OR r.cuisine LIKE ? OR EXISTS (' +
      '   SELECT 1 FROM menu_items m WHERE m.restaurant_id = r.id AND m.name LIKE ?))';
    const pattern = '%' + q + '%';
    params.push(pattern, pattern, pattern);
  }
  if (cuisine) {
    sql += ' AND r.cuisine = ?';
    params.push(cuisine);
  }
  if (location) {
    sql += ' AND r.location = ?';
    params.push(location);
  }
  if (price) {
    sql += ' AND r.price_level = ?';
    params.push(Number(price));
  }

  sql += ' GROUP BY r.id';

  // HAVING filters after the averages are worked out (WHERE cannot see AVG).
  if (minRating) {
    sql += ' HAVING AVG(rv.rating) >= ?';
    params.push(Number(minRating));
  }

  sql += ' ORDER BY ' + ORDER_BY[sort];

  const restaurants = await db.query(sql, params);
  res.json({ restaurants });
});

module.exports = router;
