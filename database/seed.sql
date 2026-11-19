-- Owner: Aberham Ketema Abebe
-- Requirements: demo data for FR1 to FR10
-- What it does: fills the tables with demo restaurants, menu items and reviews.
-- Every restaurant, person and review here is made up.
--
-- setup.js inserts the users first (it hashes their passwords in Node.js),
-- so this file looks the users up by email and keeps their ids in @variables.
-- After each restaurant INSERT, LAST_INSERT_ID() gives the new restaurant's id.

SET @owner1 = (SELECT id FROM users WHERE email = 'owner1@sahaan.test');
SET @owner2 = (SELECT id FROM users WHERE email = 'owner2@sahaan.test');
SET @owner3 = (SELECT id FROM users WHERE email = 'owner3@sahaan.test');
SET @c1 = (SELECT id FROM users WHERE email = 'customer1@sahaan.test');
SET @c2 = (SELECT id FROM users WHERE email = 'customer2@sahaan.test');
SET @c3 = (SELECT id FROM users WHERE email = 'customer3@sahaan.test');
SET @c4 = (SELECT id FROM users WHERE email = 'customer4@sahaan.test');

-- ---------------------------------------------------------------------------
-- owner1: 4 restaurants
-- ---------------------------------------------------------------------------

INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours, created_at)
VALUES (@owner1, 'Sidr Tree Kitchen', 'Emirati', 'Jumeirah', 3,
  'Home-style Emirati cooking in a quiet courtyard: slow-cooked rice dishes, grilled fish and fresh bread from the tannour oven.',
  'Daily 12:00-23:00', NOW() - INTERVAL 90 DAY);
SET @sidr = LAST_INSERT_ID();

INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
  (@sidr, 'Chicken Machboos', 'Spiced rice with slow-cooked chicken, dried lime and fried onions', 68.00),
  (@sidr, 'Lamb Harees', 'Wheat and lamb cooked for hours until smooth', 62.00),
  (@sidr, 'Grilled Safi Fish', 'Rabbitfish with Emirati spices, rice and salad', 85.00),
  (@sidr, 'Chabab Pancakes', 'Saffron and cardamom pancakes with date syrup and cheese', 38.00),
  (@sidr, 'Luqaimat', 'Crispy sweet dumplings with date syrup and sesame', 28.00);

INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours, created_at)
VALUES (@owner1, 'Cedar Lantern', 'Lebanese', 'Deira', 2,
  'A busy neighbourhood Lebanese grill known for fresh mezze, chicken shawarma and breakfast manakish.',
  'Daily 08:00-01:00', NOW() - INTERVAL 80 DAY);
SET @cedar = LAST_INSERT_ID();

INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
  (@cedar, 'Hummus Beiruti', 'Chickpea dip with parsley, garlic and chilli', 24.00),
  (@cedar, 'Chicken Shawarma Plate', 'With garlic sauce, pickles and fries', 39.00),
  (@cedar, 'Shish Tawook', 'Grilled marinated chicken with garlic sauce and bread', 45.00),
  (@cedar, 'Zaatar Manakish', 'Flatbread with thyme, sesame and olive oil', 12.00),
  (@cedar, 'Fattoush', 'Crunchy salad with sumac and toasted bread', 22.00);

INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours, created_at)
VALUES (@owner1, 'Karama Spice Box', 'Indian', 'Karama', 1,
  'Fast, friendly and very good value: biryanis, dosas and curries from across India.',
  'Sat-Thu 11:00-23:30', NOW() - INTERVAL 75 DAY);
SET @karama = LAST_INSERT_ID();

INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
  (@karama, 'Chicken Biryani', 'Fragrant rice with spiced chicken, raita on the side', 28.00),
  (@karama, 'Masala Dosa', 'Crispy rice pancake with potato filling and chutneys', 16.00),
  (@karama, 'Paneer Butter Masala', 'Cottage cheese in a creamy tomato sauce', 26.00),
  (@karama, 'Dal Tadka', 'Yellow lentils with cumin and garlic', 18.00),
  (@karama, 'Garlic Naan', NULL, 6.00),
  (@karama, 'Masala Chai', 'Spiced milk tea', 4.00);

INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours, created_at)
VALUES (@owner1, 'Saffron Courtyard', 'Persian', 'Bur Dubai', 3,
  'Persian kebabs, saffron rice and slow-cooked stews served under a painted ceiling in old Bur Dubai.',
  NULL, NOW() - INTERVAL 60 DAY);
SET @saffron = LAST_INSERT_ID();

INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
  (@saffron, 'Joojeh Kebab', 'Saffron chicken kebab with buttered rice', 72.00),
  (@saffron, 'Ghormeh Sabzi', 'Herb and lamb stew with kidney beans', 64.00),
  (@saffron, 'Tahdig', 'Crispy saffron rice from the bottom of the pot', 30.00),
  (@saffron, 'Mirza Ghasemi', 'Smoky aubergine with garlic and egg', 32.00);

-- ---------------------------------------------------------------------------
-- owner2: 3 restaurants
-- ---------------------------------------------------------------------------

INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours, created_at)
VALUES (@owner2, 'Marina Tide House', 'Seafood', 'Dubai Marina', 4,
  'Fine-dining seafood on the water, with a daily catch from the Gulf and a sunset terrace.',
  'Daily 18:00-00:00', NOW() - INTERVAL 50 DAY);
SET @marina = LAST_INSERT_ID();

INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
  (@marina, 'Grilled Hammour', 'Local grouper with lemon butter and greens', 165.00),
  (@marina, 'Seafood Platter for Two', 'Prawns, lobster, calamari and the catch of the day', 420.00),
  (@marina, 'Lobster Linguine', 'Fresh pasta with half a lobster and cherry tomatoes', 210.00),
  (@marina, 'Tuna Tartare', 'Yellowfin tuna with avocado and sesame', 95.00),
  (@marina, 'Saffron Crème Brûlée', NULL, 55.00);

INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours, created_at)
VALUES (@owner2, 'Little Bosphorus Grill', 'Turkish', 'JLT', 2,
  'Charcoal grills, pide from a wood oven and Turkish tea, popular with the JLT lunch crowd.',
  NULL, NOW() - INTERVAL 45 DAY);
SET @bosphorus = LAST_INSERT_ID();

INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
  (@bosphorus, 'Adana Kebab', 'Spicy minced lamb kebab with bulgur and grilled pepper', 52.00),
  (@bosphorus, 'Mixed Grill Platter', 'Lamb chops, chicken shish and kofte', 89.00),
  (@bosphorus, 'Cheese Pide', 'Boat-shaped flatbread with melted cheese and egg', 34.00),
  (@bosphorus, 'Lentil Soup', 'With lemon and chilli butter', 18.00),
  (@bosphorus, 'Künefe', 'Warm cheese pastry with syrup and pistachio', 32.00);

INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours, created_at)
VALUES (@owner2, 'Nonna Lucia''s Table', 'Italian', 'Downtown Dubai', 3,
  'Handmade pasta and wood-fired pizza in a cosy room a short walk from the Downtown fountains.',
  NULL, NOW() - INTERVAL 30 DAY);
SET @nonna = LAST_INSERT_ID();

INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
  (@nonna, 'Margherita Pizza', 'Tomato, mozzarella and basil from the wood oven', 58.00),
  (@nonna, 'Truffle Tagliatelle', 'Fresh egg pasta with black truffle and parmesan', 92.00),
  (@nonna, 'Lasagne al Forno', 'Beef ragu, bechamel and parmesan', 78.00),
  (@nonna, 'Burrata Salad', 'Burrata with tomatoes and basil oil', 64.00),
  (@nonna, 'Tiramisu', 'Made fresh every morning', 42.00);

-- ---------------------------------------------------------------------------
-- owner3: 3 restaurants
-- ---------------------------------------------------------------------------

INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours, created_at)
VALUES (@owner3, 'Kaze Noodle & Sushi Bar', 'Japanese', 'Business Bay', 4,
  'A twelve-seat counter serving omakase sushi and rich ramen, by reservation.',
  NULL, NOW() - INTERVAL 20 DAY);
SET @kaze = LAST_INSERT_ID();

INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
  (@kaze, 'Omakase (12 pieces)', 'The chef''s choice of seasonal sushi', 380.00),
  (@kaze, 'Salmon Nigiri (2 pieces)', NULL, 48.00),
  (@kaze, 'Tonkotsu Ramen', 'Pork bone broth, chashu, egg and spring onion', 79.00),
  (@kaze, 'Wagyu Gyoza', 'Pan-fried dumplings with ponzu', 68.00),
  (@kaze, 'Matcha Cheesecake', NULL, 45.00);

INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours, created_at)
VALUES (@owner3, 'Lahore Lane Grill', 'Pakistani', 'Silicon Oasis', 1,
  'Pakistani barbecue and breakfast favourites at student-friendly prices.',
  NULL, NOW() - INTERVAL 12 DAY);
SET @lahore = LAST_INSERT_ID();

INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
  (@lahore, 'Seekh Kebab (4 pieces)', 'Minced beef kebabs from the charcoal grill', 24.00),
  (@lahore, 'Chicken Karahi (half)', 'Tomato, ginger and green chilli, cooked in the wok', 38.00),
  (@lahore, 'Beef Nihari', 'Slow-cooked beef stew, served on Fridays', 32.00),
  (@lahore, 'Garlic Naan', NULL, 5.00),
  (@lahore, 'Karak Chai', 'Strong tea with milk and cardamom', 3.00),
  (@lahore, 'Halwa Puri Breakfast', 'Fried bread, chickpeas and semolina halwa', 20.00);

INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours, created_at)
VALUES (@owner3, 'Bean & Date Café', 'Café', 'Al Barsha', 1,
  'A calm café with specialty coffee, date cake and long tables for studying.',
  'Daily 07:00-22:00', NOW() - INTERVAL 5 DAY);
SET @bean = LAST_INSERT_ID();

INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
  (@bean, 'Saffron Latte', NULL, 22.00),
  (@bean, 'Flat White', NULL, 18.00),
  (@bean, 'Date Cake Slice', 'With salted caramel sauce', 19.00),
  (@bean, 'Halloumi Sandwich', 'Grilled halloumi, tomato and mint on sourdough', 32.00),
  (@bean, 'Avocado Toast', 'With chilli flakes and a poached egg', 36.00);

-- ---------------------------------------------------------------------------
-- Reviews: 2 to 4 per restaurant, mixed ratings.
-- Saffron Courtyard and Kaze have no reviews yet (to show the empty state).
-- customer1 has not reviewed Little Bosphorus or Bean & Date, so the demo can add one.
-- The 1-star review of Little Bosphorus by customer4 is the rude one for the admin demo.
-- ---------------------------------------------------------------------------

INSERT INTO reviews (restaurant_id, user_id, rating, comment, created_at, updated_at) VALUES
  (@sidr, @c1, 5, 'Lovely machboos and the luqaimat were warm and crispy. A great place to take visiting family.', NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 12 DAY),
  (@sidr, @c2, 4, 'Good Emirati food in a calm setting. A bit pricey, but worth it for a special dinner.', NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 30 DAY),
  (@sidr, @c3, 5, 'The chabab pancakes were the best thing we ate all week. Very friendly staff.', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),

  (@cedar, @c1, 4, 'Fresh hummus and very good shish tawook. It gets busy at lunch time.', NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY),
  (@cedar, @c2, 3, 'The food was fine, but we waited 40 minutes for our main dishes.', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY),
  (@cedar, @c4, 5, 'Best manakish I have had in Deira. Breakfast here is a must.', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),

  (@karama, @c1, 4, 'The masala dosa was crispy and the chutneys were great.', NOW() - INTERVAL 25 DAY, NOW() - INTERVAL 25 DAY),
  (@karama, @c2, 5, 'Amazing value. One chicken biryani easily feeds two people.', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY),
  (@karama, @c3, 4, 'Spicy and tasty. There is not much space to sit, so we took it away.', NOW() - INTERVAL 40 DAY, NOW() - INTERVAL 40 DAY),
  (@karama, @c4, 2, 'Too much oil in the curry for me, and the naan came out cold.', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),

  (@marina, @c1, 5, 'The grilled hammour was perfect and the view of the marina at sunset is beautiful.', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY),
  (@marina, @c3, 4, 'Excellent seafood platter. Expensive, so save it for a celebration.', NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 18 DAY),

  (@bosphorus, @c2, 4, 'A generous mixed grill, and the pide came fresh from the oven.', NOW() - INTERVAL 14 DAY, NOW() - INTERVAL 14 DAY),
  (@bosphorus, @c3, 3, 'Decent kebabs, but the dessert was only average.', NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY),
  (@bosphorus, @c4, 1, 'Worst place ever. The staff are idiots and the food is garbage. Total rip-off, avoid these clowns!', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),

  (@nonna, @c1, 3, 'The pizza base was good, but the pasta was a little salty.', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY),
  (@nonna, @c4, 4, 'A cosy place in Downtown, and the tiramisu is great.', NOW() - INTERVAL 22 DAY, NOW() - INTERVAL 22 DAY),

  (@lahore, @c1, 5, 'The seekh kebabs and garlic naan are fantastic. Cheap and cheerful.', NOW() - INTERVAL 11 DAY, NOW() - INTERVAL 11 DAY),
  (@lahore, @c2, 4, 'Proper nihari on Fridays. Parking is hard to find, though.', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY),
  (@lahore, @c3, 5, 'Karak chai and halwa puri for breakfast. You cannot beat it.', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),

  (@bean, @c2, 2, 'The coffee was weak and the date cake was dry.', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),
  (@bean, @c3, 4, 'A quiet spot to study, with good Wi-Fi and a nice saffron latte.', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
  (@bean, @c4, 3, 'Okay sandwiches and friendly staff, but a bit slow.', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY);
