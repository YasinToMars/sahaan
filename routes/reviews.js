// Owner: Danish Maindan
// Requirement: FR4 (customers write, edit and delete their own reviews)
// What it does: the review routes. server.js mounts this router at /api, so the paths below
// are /api/restaurants/:id/reviews, /api/reviews/mine and /api/reviews/:id.
// "Own" is checked in the SQL itself: WHERE id = ? AND user_id = <the logged-in customer>.

const express = require('express');
const db = require('../config/db');
const validate = require('../utils/validate');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/restaurants/:id/reviews  (customer): add a review.
router.post('/restaurants/:id/reviews', requireRole('customer'), async (req, res) => {
  const restaurantId = validate.toId(req.params.id);
  if (!restaurantId) return res.status(400).json({ error: 'Restaurant id must be a positive whole number.' });

  const error = validate.checkReview(req.body);
  if (error) return res.status(400).json({ error });

  const restaurants = await db.query('SELECT id FROM restaurants WHERE id = ?', [restaurantId]);
  if (restaurants.length === 0) return res.status(404).json({ error: 'Restaurant not found.' });

  // One review per customer per restaurant (the database also has a UNIQUE key for this).
  const existing = await db.query(
    'SELECT id FROM reviews WHERE restaurant_id = ? AND user_id = ?',
    [restaurantId, req.user.id]
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: 'You have already reviewed this restaurant. You can edit your review instead.' });
  }

  const result = await db.query(
    'INSERT INTO reviews (restaurant_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
    [restaurantId, req.user.id, Number(req.body.rating), req.body.comment.trim()]
  );
  res.status(201).json({ message: 'Thank you! Your review has been posted.', id: result.insertId });
});

// GET /api/reviews/mine  (customer): my reviews, with the restaurant names.
router.get('/reviews/mine', requireRole('customer'), async (req, res) => {
  const reviews = await db.query(
    'SELECT rv.id, rv.restaurant_id, r.name AS restaurant_name, rv.rating, rv.comment, rv.created_at, rv.updated_at ' +
      'FROM reviews rv ' +
      'JOIN restaurants r ON r.id = rv.restaurant_id ' +
      'WHERE rv.user_id = ? ' +
      'ORDER BY rv.created_at DESC, rv.id DESC',
    [req.user.id]
  );
  res.json({ reviews });
});

// PUT /api/reviews/:id  (customer, own): edit a review.
router.put('/reviews/:id', requireRole('customer'), async (req, res) => {
  const id = validate.toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Review id must be a positive whole number.' });

  const error = validate.checkReview(req.body);
  if (error) return res.status(400).json({ error });

  const result = await db.query(
    'UPDATE reviews SET rating = ?, comment = ? WHERE id = ? AND user_id = ?',
    [Number(req.body.rating), req.body.comment.trim(), id, req.user.id]
  );
  // 0 rows means the review does not exist, or it belongs to someone else.
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Review not found.' });

  res.json({ message: 'Your review has been updated.' });
});

// DELETE /api/reviews/:id  (customer, own): delete a review.
router.delete('/reviews/:id', requireRole('customer'), async (req, res) => {
  const id = validate.toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Review id must be a positive whole number.' });

  const result = await db.query('DELETE FROM reviews WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Review not found.' });

  res.json({ message: 'Your review has been deleted.' });
});

module.exports = router;
