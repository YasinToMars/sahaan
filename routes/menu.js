// Owner: Aberham Ketema Abebe
// Requirements: FR6 (owners add, update and remove menu items of their own restaurants)
//               FR7 (owners view the reviews of their own restaurants)
// What it does: the menu and reviews routes under /api/owner.
// Every route checks that the restaurant belongs to the logged-in owner.

const express = require('express');
const db = require('../config/db');
const validate = require('../utils/validate');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Returns the restaurant if it belongs to this owner, otherwise undefined.
async function findOwnRestaurant(restaurantId, ownerId) {
  const rows = await db.query(
    'SELECT id, name FROM restaurants WHERE id = ? AND owner_id = ?',
    [restaurantId, ownerId]
  );
  return rows[0];
}

// GET /api/owner/restaurants/:id/menu  (owner, own): list the menu items.
router.get('/restaurants/:id/menu', requireRole('owner'), async (req, res) => {
  const restaurantId = validate.toId(req.params.id);
  if (!restaurantId) return res.status(400).json({ error: 'Restaurant id must be a positive whole number.' });

  const restaurant = await findOwnRestaurant(restaurantId, req.user.id);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

  const items = await db.query(
    'SELECT id, name, description, price FROM menu_items WHERE restaurant_id = ? ORDER BY id',
    [restaurantId]
  );
  res.json({ restaurant, items });
});

// POST /api/owner/restaurants/:id/menu  (owner, own): add a menu item.
router.post('/restaurants/:id/menu', requireRole('owner'), async (req, res) => {
  const restaurantId = validate.toId(req.params.id);
  if (!restaurantId) return res.status(400).json({ error: 'Restaurant id must be a positive whole number.' });

  const error = validate.checkMenuItem(req.body);
  if (error) return res.status(400).json({ error });

  const restaurant = await findOwnRestaurant(restaurantId, req.user.id);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

  const result = await db.query(
    'INSERT INTO menu_items (restaurant_id, name, description, price) VALUES (?, ?, ?, ?)',
    [restaurantId, req.body.name.trim(), validate.optionalText(req.body.description), Number(req.body.price)]
  );
  res.status(201).json({ message: 'Menu item added.', id: result.insertId });
});

// PUT /api/owner/menu/:itemId  (owner, own): update a menu item.
// The JOIN checks the item through its restaurant's owner.
router.put('/menu/:itemId', requireRole('owner'), async (req, res) => {
  const itemId = validate.toId(req.params.itemId);
  if (!itemId) return res.status(400).json({ error: 'Menu item id must be a positive whole number.' });

  const error = validate.checkMenuItem(req.body);
  if (error) return res.status(400).json({ error });

  const result = await db.query(
    'UPDATE menu_items m ' +
      'JOIN restaurants r ON r.id = m.restaurant_id ' +
      'SET m.name = ?, m.description = ?, m.price = ? ' +
      'WHERE m.id = ? AND r.owner_id = ?',
    [req.body.name.trim(), validate.optionalText(req.body.description), Number(req.body.price), itemId, req.user.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Menu item not found.' });

  res.json({ message: 'Menu item updated.' });
});

// DELETE /api/owner/menu/:itemId  (owner, own): remove a menu item.
router.delete('/menu/:itemId', requireRole('owner'), async (req, res) => {
  const itemId = validate.toId(req.params.itemId);
  if (!itemId) return res.status(400).json({ error: 'Menu item id must be a positive whole number.' });

  const result = await db.query(
    'DELETE m FROM menu_items m ' +
      'JOIN restaurants r ON r.id = m.restaurant_id ' +
      'WHERE m.id = ? AND r.owner_id = ?',
    [itemId, req.user.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Menu item not found.' });

  res.json({ message: 'Menu item removed.' });
});

// GET /api/owner/restaurants/:id/reviews  (owner, own): the reviews of one of my restaurants.
router.get('/restaurants/:id/reviews', requireRole('owner'), async (req, res) => {
  const restaurantId = validate.toId(req.params.id);
  if (!restaurantId) return res.status(400).json({ error: 'Restaurant id must be a positive whole number.' });

  const restaurant = await findOwnRestaurant(restaurantId, req.user.id);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

  const reviews = await db.query(
    'SELECT rv.id, rv.rating, rv.comment, rv.created_at, u.full_name AS reviewer_name ' +
      'FROM reviews rv ' +
      'JOIN users u ON u.id = rv.user_id ' +
      'WHERE rv.restaurant_id = ? ' +
      'ORDER BY rv.created_at DESC, rv.id DESC',
    [restaurantId]
  );
  res.json({ restaurant, reviews });
});

module.exports = router;
