<!-- Owner: Yasin Shafiei. What it is: one section per team member explaining their part, for the demo and the Q&A. -->

# Sahaan explained, person by person

Read your own section before the demo. Each one has:
- your part in one sentence
- your files and what each one does
- one action traced from the click to the database and back, with the real function names and SQL
- the validation and security checks in your part
- four questions an examiner might ask, with short answers
- the feature you added, and how it works

Words used everywhere:
- **AJAX**: the page asks the server for data without reloading. We use jQuery `$.ajax`, wrapped in `api()` in `public/js/common.js`.
- **Route**: a server function for one address, e.g. `router.get('/:id', ...)` answers `GET /api/restaurants/5`.
- **Middleware**: a function that runs before the route, e.g. `requireRole('owner')` checks the user is an owner.
- **`?` placeholder**: in `WHERE id = ?`, MySQL receives the SQL and the value separately, so user input can never change the SQL.

Contents: [Yasin](#yasin-shafiei) · [Danish](#danish-maindan) · [Orit](#orit-woldemeskel) · [Aberham](#aberham-ketema-abebe) · [Yassin Awny](#yassin-awny)

---

## Yasin Shafiei

**Your part:** accounts (register, log in, profile, log out), search and filters, the shared browser code, and the page design.

### Your files

| File | What it does |
|---|---|
| `utils/password.js` | `hashPassword()` makes `salt:hash` with `crypto.scryptSync`; `verifyPassword()` checks a password with `crypto.timingSafeEqual`. |
| `middleware/auth.js` | The `sessions` Map (token → user id), `createSession()`, `deleteSession()`, and the middleware `requireLogin` and `requireRole(...roles)`. |
| `routes/auth.js` | FR1: `/api/auth/register`, `/login`, `/logout`, `/me`, `/profile`, `/password`. |
| `routes/search.js` | FR2: `GET /api/restaurants` (search) and `GET /api/restaurants/filters` (dropdown lists). |
| `public/index.html` + `js/search.js` | The home page: the photo hero with "Popular" quick searches, the search box and five dropdowns, "Browse by cuisine" tiles, result cards with loading placeholders, "Clear filters", the empty state, the "How it works" band, and the last search in localStorage. |
| `public/login.html` + `js/login.js` | Login form; afterwards goes to `?next=` or the right page for the role. |
| `public/register.html` + `js/register.js` | Sign-up form with "I'm a customer" / "I own a restaurant". |
| `public/profile.html` + `js/profile.js` | "Your details" (name, email) and "Change password". |
| `public/js/common.js` | Shared by every page: the session in localStorage, `api()`, the header (`renderHeader()`), page guards (`requireLogin()`, `requireRole()`), messages (`showMessage()`, `showFieldErrors()`), the validation rules, helpers like `escapeHtml()`, `starsText()`, `setupCounter()`, `buildStarPicker()`, and `renderFooter()` (the footer on every page) and `watchScroll()` (the header turns solid on scroll). |
| `public/css/style.css` | The one stylesheet. All colours, fonts and spacing are variables in `:root`. Phone layout under 700px. |
| `public/credits.html` + `public/images/cuisines/` | One food photo per cuisine, and the page that credits each photo's author, licence and source. |

### One action traced: searching for budget restaurants rated 4+

1. The user picks **$ Budget** in the Price dropdown. In `search.js`, `$form.on('change', 'select', runSearch)` calls `runSearch()` straight away. (Typing in the search box waits 300 ms with `setTimeout` first.)
2. `runSearch()` calls `readFilters()` → `{ q: '', cuisine: '', location: '', price: '1', minRating: '4', sort: 'rating' }`, checks `q` with `checkSearchText()`, and saves the filters with `saveLastSearch()` → `localStorage.setItem('sahaan.lastSearch', JSON.stringify(filters))`.
3. It sends only the filled-in values: `api('GET', '/api/restaurants?' + $.param(params))` → `GET /api/restaurants?price=1&minRating=4&sort=rating`.
4. On the server, `routes/search.js` `router.get('/')` runs `validate.checkSearch(req.query)` (400 if a value is not allowed), then builds the SQL one filter at a time:
   ```sql
   SELECT r.id, r.name, r.cuisine, r.location, r.price_level, r.description,
     ROUND(AVG(rv.rating), 1) AS avg_rating, COUNT(rv.id) AS review_count
   FROM restaurants r
   LEFT JOIN reviews rv ON rv.restaurant_id = r.id
   WHERE 1 = 1 AND r.price_level = ?
   GROUP BY r.id
   HAVING AVG(rv.rating) >= ?
   ORDER BY avg_rating DESC, review_count DESC, r.name ASC
   ```
   with `params = [1, 4]`. A text search adds `AND (r.name LIKE ? OR r.cuisine LIKE ? OR EXISTS (SELECT 1 FROM menu_items m WHERE m.restaurant_id = r.id AND m.name LIKE ?))`.
5. The answer is `{ "restaurants": [ { "name": "Lahore Lane Grill", "avg_rating": 4.7, ... } ] }`.
6. `.done()` checks `thisSearch === searchNumber` (so a slow old answer can't replace a newer one), then `renderResults()` shows "1 restaurant" and one card from `buildCard()`, or the empty state "No restaurants match your filters".
7. When the page opens again, `restoreLastSearch()` reads `sahaan.lastSearch` and puts the filters back.

### Validation and security in your part

- Register: full name 2 to 60, email pattern and at most 120 (stored lowercase), password 8 to 64 with a letter and a number, role only `customer` or `owner`. Same functions in `common.js` and `utils/validate.js`.
- A duplicate email gets 409. Wrong email and wrong password get the same 401 "Wrong email or password."
- Changing the password needs the current one (400 if wrong).
- `requireLogin` reloads the user from the database on every request; `requireRole` gives 403 for the wrong role.
- Search: `q` at most 60, filters must come from `config/lists.js`, `minRating` 1 to 5, `sort` from a fixed list. `ORDER BY` uses a lookup table (`ORDER_BY[sort]`), never user text.
- `api()` sends the token; on any 401 it clears localStorage and opens `login.html?next=...`. `login.js` only follows `next` if it is one of our own pages.

### Questions an examiner might ask

1. **How are passwords stored?** Never as plain text. `hashPassword()` makes a random 16-byte salt and runs `crypto.scryptSync(password, salt, 64)`. We store `salt:hash`. To check, we hash the typed password with the same salt and compare with `crypto.timingSafeEqual`.
2. **How does the server know who is logged in without express-session?** On login, `createSession()` makes `crypto.randomBytes(32)` and stores `token → { userId, createdAt }` in a `Map`. The browser keeps the token in localStorage and `api()` sends it as `Authorization: Bearer <token>`. `requireLogin` looks it up. Restarting the server empties the Map, so everyone logs in again.
3. **Where is Web Storage used?** `sahaan.session` holds the token and user (so the header knows the role), and `sahaan.lastSearch` holds the last search filters, which come back after a reload.
4. **Why `HAVING` and not `WHERE` for the minimum rating?** `WHERE` runs before grouping, when the average doesn't exist yet. `HAVING` runs after `GROUP BY`, so it can filter on `AVG(rv.rating)`.

### What you added: the design and the home page

The look is in `public/css/style.css` (plain CSS, no libraries). The home page layout is in `public/index.html` and `public/js/search.js`, and the shared header and footer are in `public/js/common.js`. Teammates' pages pick up the new look without any change to their files.

- **Black and white.** White cards (`#FFFFFF`) on a light grey page (`#F4F4F2`), near-black text and buttons (`#0A0A0A`), grey for secondary text (`#5C5C5C`). Red (`#B00020`) is the only colour, kept for errors and Delete. Every colour, font, spacing, radius and shadow is a variable in `:root`, so the look can be changed in one place.
- **Fonts.** Headlines use Playfair Display (an elegant serif, like a food magazine) and text uses Inter. Both are free (SIL Open Font License) and stored in `public/fonts/`; section 0 of the stylesheet loads them with `@font-face`, so no CDN is needed.
- **Home page, top to bottom.**
  1. *Hero:* a black band with the headline, "Popular" buttons and three numbers. Clicking a "Popular" button puts the word in `#q` and calls `runSearch()`. `renderHeroStats()` counts the cuisines, areas and price levels from `LISTS`, so the numbers always match `config/lists.js`. Three food photos sit on the right like prints on a table (CSS `rotate`).
  2. *Search card:* the same form as before, floating over the bottom of the hero.
  3. *Browse by cuisine:* `renderCuisineTiles()` makes one photo button per cuisine from `LISTS.cuisines`. Clicking one sets the Cuisine dropdown and calls `runSearch()`; clicking it again clears it. `markActiveTile()` puts a black ring on the chosen one.
  4. *Results:* the cards as before. On the first load, `showSkeletons()` shows four grey placeholder cards with a moving shine until the answer arrives.
  5. *How it works:* three numbered steps (plain HTML).
- **Header and footer.** On the home page the header floats over the hero, see-through with white text. `watchScroll()` adds the class `scrolled` once the page moves, and the CSS turns the header solid white. `renderFooter()` in `common.js` builds the same black footer on every page: the logo, a short line, three columns of links (the Account column changes when you are logged in), and the Photo credits link.
- **Food photos.** Each cuisine has one photo in `public/images/cuisines/` (from Wikimedia Commons, credited on `credits.html`). `swatchClass()` returns two classes, e.g. `"swatch-3 photo-indian"`, and the stylesheet has one line per cuisine, e.g. `.photo-indian { background-image: url("/images/cuisines/indian.jpg"); }`. The same photo appears on the cuisine tiles, the result cards, the restaurant page banner and the owner's cards. The `swatch-0` to `swatch-5` CSS patterns sit underneath as a fallback.
- **Restaurant page.** A wide photo banner with the details underneath, the menu laid out like a printed menu (dotted lines to the prices), and "Your review" as a black card.
- **Movement.** Cards, panels and tiles fade up as they appear (`@keyframes rise`, one after another with `animation-delay`). Anyone who turns off animations in their system settings gets none, thanks to `@media (prefers-reduced-motion: reduce)`.
- **Accessibility.** `:focus-visible` draws a clear outline on every link, button and field. Text colours meet WCAG AA (at least 4.5:1); input borders and empty stars are at least 3:1. The hero photos are `aria-hidden`, because they are decoration.
- **Phone.** Under 700px the links hide behind the Menu button, the hero photos are hidden, the filters stack, and the cuisine tiles go three to a row. `main { overflow-x: clip }` makes sure no page scrolls sideways at 375px.

---

## Danish Maindan

**Your part:** the server setup, the restaurant page with its menu and reviews, writing/editing/deleting reviews, and the "My reviews" page.

### Your files

| File | What it does |
|---|---|
| `server.js` | Creates the Express app: `express.json()`, `express.static('public')`, jQuery at `/vendor/jquery`, mounts the seven routers, the JSON 404 for unknown `/api` routes, and the final error handler (500). Checks the database with `db.testConnection()` before listening on port 3000. |
| `package.json` | The three packages and the commands `start`, `dev`, `db:setup`. |
| `config/db.js` | Reads `db.local.json` (or `db.example.json`), makes the mysql2 pool, and exports `query(sql, params)`. `explainError()` turns connection errors into plain messages. |
| `config/db.example.json` | Example settings to copy. |
| `config/lists.js` | `CUISINES`, `LOCATIONS`, `PRICE_LABELS`: one list used by the server and sent to the browser. |
| `utils/validate.js` | Server-side checks. Each `checkX()` returns an error message or `''`. Also `toId()`, `cleanText()`, `optionalText()`. |
| `routes/restaurants.js` | FR3: `GET /api/restaurants/:id` returns `{ restaurant, menu, reviews }`. |
| `routes/reviews.js` | FR4: add, list mine, edit, delete reviews. |
| `public/restaurant.html` + `js/restaurant.js` | Restaurant details, menu, reviews, and the review area (form, "Your review" with Edit/Delete, or "Log in to write a review"). |
| `public/my-reviews.html` + `js/my-reviews.js` | A customer's reviews with inline edit and delete. |

### One action traced: posting a review

1. customer1 opens `restaurant.html?id=6`. `loadRestaurant()` calls `api('GET', '/api/restaurants/6')`. The route runs three queries (restaurant with `AVG`/`COUNT`, menu, reviews) and returns `{ restaurant, menu, reviews }`. `renderReviewArea()` sees a logged-in customer with no review here, so it shows `buildReviewForm()`: the star picker and a textarea with a live counter (`setupCounter()`).
2. They pick 4 stars, type a comment and click **Post review**. `postReview()` calls `readReviewForm()`, which runs `checkRating()` and `checkComment()`. Errors appear under the fields and nothing is sent.
3. `api('POST', '/api/restaurants/6/reviews', { rating: 4, comment: '...' })`.
4. In `routes/reviews.js`: `requireRole('customer')` (401 / 403), `validate.toId()` (400), `validate.checkReview()` (400), then:
   ```sql
   SELECT id FROM restaurants WHERE id = ?                         -- 404 if missing
   SELECT id FROM reviews WHERE restaurant_id = ? AND user_id = ?  -- 409 if found
   INSERT INTO reviews (restaurant_id, user_id, rating, comment) VALUES (?, ?, ?, ?)
   ```
5. The answer is 201 `{ "message": "Thank you! Your review has been posted.", "id": 24 }`.
6. `.done()` calls `showMessage('#review-message', ...)` and `loadRestaurant()` again, so the average, the review count, the list and the "Your review" box all update.

Editing works the same way: `showEditForm()` swaps the box for a filled-in form, `saveEdit()` sends `PUT /api/reviews/:id`, and the route runs `UPDATE reviews SET rating = ?, comment = ? WHERE id = ? AND user_id = ?`.

`loadRestaurant()` draws the list with `renderSortedReviews()`, so the order chosen in "Sort reviews" stays after posting, editing or deleting.

### Validation and security in your part

- Rating must be a whole number 1 to 5; comment 5 to 500 characters after trimming. Same rules in `common.js` and `utils/validate.js`; the counter turns red outside 5 to 500.
- IDs in URLs must be positive whole numbers (`toId()`), otherwise 400.
- Only customers can write reviews (`requireRole('customer')`). One review per restaurant: checked in the route (409) and by the `UNIQUE (restaurant_id, user_id)` key.
- Edit and delete include `AND user_id = ?` in the SQL, so customer2 cannot touch customer1's review: 0 rows changed → 404.
- Review text goes on the page with `.text()`, so `<script>` in a comment is shown as text.
- `server.js`: unknown `/api` routes give a JSON 404; any crash gives 500 `{ "error": "Something went wrong" }` and the real error is printed in the terminal only.

### Questions an examiner might ask

1. **What does `server.js` do, step by step?** It reads JSON bodies, serves the `public` folder and jQuery, mounts each router at its path, adds the JSON 404 and the error handler, checks MySQL with `testConnection()`, then listens on port 3000.
2. **Why is the search router mounted before the restaurants router?** Both live under `/api/restaurants`. If `/:id` came first, `/api/restaurants/filters` would be treated as a restaurant with id "filters".
3. **How do you stop a customer from editing someone else's review?** The SQL is `UPDATE ... WHERE id = ? AND user_id = ?` with the logged-in user's id from the token, not from the browser. If it's not theirs, no row matches and we return 404.
4. **What happens if MySQL is down?** `db.testConnection()` fails at startup and `explainError()` prints a plain message (for example "Could not reach MySQL. Make sure MySQL is installed and running") and the app stops.

### What you added: "Sort reviews"

A dropdown above the reviews with Newest, Highest rating and Lowest rating. It re-orders the reviews already on the page, so there is no AJAX, no route and no SQL.
1. **HTML** (`restaurant.html`): `<select id="review-sort">` with a label, in the `.section-head` next to the "Reviews" heading.
2. **Event:** in `restaurant.js`, `$('#review-sort').on('change', renderSortedReviews)`.
3. **Sort:** `renderSortedReviews()` reads `$('#review-sort').val()`, copies the reviews with `currentReviews.slice()` (so the server's order is kept), and sorts the copy with `.sort(function (a, b) { ... })`:
   - Highest rating: `b.rating - a.rating`
   - Lowest rating: `a.rating - b.rating`
   - Newest, and the tie-breaker for equal ratings: `new Date(b.created_at) - new Date(a.created_at)`, then the larger `id` first
4. **Page:** it passes the sorted copy to `renderReviews(sortedReviews)`, which redraws the list.
5. `currentReviews` came from `GET /api/restaurants/:id`, whose SQL already sorts by `ORDER BY rv.created_at DESC, rv.id DESC`. Because `loadRestaurant()` calls `renderSortedReviews()`, the chosen order stays after a review is posted, edited or deleted.

---

## Orit Woldemeskel

**Your part:** restaurant owners adding and updating their own restaurants.

### Your files

| File | What it does |
|---|---|
| `routes/owner.js` | FR5: `GET /api/owner/restaurants` (my restaurants with stats), `POST /api/owner/restaurants` (add), `PUT /api/owner/restaurants/:id` (update mine). |
| `public/owner.html` | The "My restaurants" list and the add/edit form (name, cuisine, location, price, description, opening hours). |
| `public/js/owner.js` | `loadMyRestaurants()`, `renderRestaurants()` (cards with stats, opening hours, Edit, View public page, Menu & reviews), `readForm()`, `fillForm()`, `resetForm()`, `saveRestaurant()`. |

### One action traced: editing a restaurant

1. owner1 opens `owner.html`. `requireRole(['owner'])` lets them in. `loadMyRestaurants()` calls `api('GET', '/api/owner/restaurants')`, which runs:
   ```sql
   SELECT r.id, r.name, r.cuisine, r.location, r.price_level, r.description, r.opening_hours,
     ROUND(AVG(rv.rating), 1) AS avg_rating, COUNT(rv.id) AS review_count,
     (SELECT COUNT(*) FROM menu_items m WHERE m.restaurant_id = r.id) AS menu_count
   FROM restaurants r
   LEFT JOIN reviews rv ON rv.restaurant_id = r.id
   WHERE r.owner_id = ?
   GROUP BY r.id
   ORDER BY r.name
   ```
   `renderRestaurants()` draws a card for each one.
2. They click **Edit** on Cedar Lantern. `fillForm(restaurant)` copies its values into the form, puts its id in the hidden `#restaurant-id`, and changes the heading to "Edit Cedar Lantern" and the button to "Save changes".
3. They change the price and click **Save changes**. `saveRestaurant()` calls `readForm()` and checks it with `checkRestaurantName()`, `checkCuisine()`, `checkLocation()`, `checkPriceLevel()` and `checkDescription()`, and checks that the opening hours are at most 100 characters.
4. Because `#restaurant-id` has a value, it sends `api('PUT', '/api/owner/restaurants/2', data)` (with no id it would `POST`).
5. `routes/owner.js`: `requireRole('owner')`, `validate.toId()`, `validate.checkRestaurant()`, `openingHoursError()`, then:
   ```sql
   UPDATE restaurants SET name = ?, cuisine = ?, location = ?, price_level = ?, description = ?, opening_hours = ?
   WHERE id = ? AND owner_id = ?
   ```
   If `affectedRows` is 0 (not found, or another owner's restaurant) → 404. Otherwise 200 `{ "message": "Your restaurant has been updated." }`.
6. `.done()` calls `resetForm()`, shows the message and `loadMyRestaurants()` redraws the cards.

### Validation and security in your part

- Name 2 to 100 characters; cuisine and location must be in `config/lists.js`; price level a whole number 1 to 4; description at most 500 (with a live counter). Same rules in the browser and on the server.
- Opening hours are optional. If sent, they must be text of at most 100 characters; a number, a list or 101 characters gets 400 "Opening hours must be at most 100 characters." Empty hours are saved as `NULL`.
- `requireRole('owner')` on every route: customers get 403, visitors 401.
- `owner_id` always comes from `req.user.id` (the token), never from the form. The UPDATE has `AND owner_id = ?`, so owner1 cannot change owner2's restaurant (404).

### Questions an examiner might ask

1. **How does one form do both Add and Edit?** A hidden input `#restaurant-id`. Empty → `POST /api/owner/restaurants`. Filled in by Edit → `PUT /api/owner/restaurants/:id`.
2. **Could an owner edit another owner's restaurant by changing the id in the request?** No. The SQL is `WHERE id = ? AND owner_id = ?`, and `owner_id` is the logged-in user from the token. No row matches, so we send 404.
3. **Why a subquery for `menu_count`?** If we joined reviews and menu items in the same query, each review row would be repeated for each menu item, and the counts would be multiplied.
4. **What happens if the owner leaves the cuisine empty?** The browser shows "Choose a cuisine from the list." under the field and does not send. If someone sends it anyway, `validate.checkRestaurant()` on the server returns 400 with the same message.

### What you added: "Opening hours"

An optional field such as "Daily 10:00-23:00", saved in the `opening_hours` column (VARCHAR(100), NULL allowed).
1. **HTML** (`owner.html`): a text box `id="opening_hours" name="opening_hours" maxlength="100"` with a label, a hint and its error line.
2. **Browser:** `readForm()` adds `opening_hours: $('#opening_hours').val().trim()`. `saveRestaurant()` shows "Opening hours must be at most 100 characters." under the field if it is too long, otherwise it sends the data with `api('POST', ...)` or `api('PUT', ...)` as above.
3. **Route** (`routes/owner.js`): both routes call `openingHoursError(req.body.opening_hours)`. Missing, `null` or `''` is fine; anything that is not text, or longer than 100 characters, gets 400.
4. **SQL:** the INSERT and UPDATE have one more column and one more `?`:
   ```sql
   INSERT INTO restaurants (owner_id, name, cuisine, location, price_level, description, opening_hours)
   VALUES (?, ?, ?, ?, ?, ?, ?)
   ```
   The value is `validate.optionalText(req.body.opening_hours)`, which turns an empty box into `NULL`. The SELECT for "My restaurants" includes `r.opening_hours`.
5. **Page:** `fillForm()` puts the saved hours back in the box when Edit is clicked. `renderRestaurants()` adds a line "Open: Daily 10:00-23:00" on the card (with `.text()`) when hours are set. On the public page, `renderDetails()` in `restaurant.js` shows them as an "Open: …" tag.

---

## Aberham Ketema Abebe

**Your part:** the database design, the demo data, and the owner's "Menu & reviews" page (menu items and reviews).

### Your files

| File | What it does |
|---|---|
| `database/schema.sql` | The four tables, their keys, foreign keys with `ON DELETE CASCADE`, indexes and `CHECK` rules. |
| `database/seed.sql` | 10 made-up restaurants with menus and reviews. Looks owners up by email into `@owner1` etc. and uses `LAST_INSERT_ID()` after each restaurant. |
| `database/setup.js` | `npm run db:setup`: drops and recreates the database, runs `schema.sql`, inserts the 8 demo users with `hashPassword()`, runs `seed.sql`, prints the demo accounts. |
| `routes/menu.js` | FR6 and FR7: list/add menu items, update/delete a menu item, list the reviews of my restaurant. `findOwnRestaurant()` checks ownership. |
| `public/owner-menu.html` | Restaurant dropdown, menu table, "Add an item" form, "Reviews of this restaurant" with the `#review-summary` box above the list. |
| `public/js/owner-menu.js` | `loadMyRestaurants()`, `selectRestaurant()`, `loadMenu()`, `renderMenu()`, `startEdit()`, `readItem()`, `saveItem()`, `deleteItem()`, `addItem()`, `loadReviews()`, `renderReviews()`. |

### The four tables

- `users` (id, full_name, email UNIQUE, password_hash, role, created_at)
- `restaurants` (id, **owner_id → users.id**, name, cuisine, location, price_level 1–4, description, opening_hours, created_at), with indexes on cuisine and location
- `menu_items` (id, **restaurant_id → restaurants.id**, name, description, price DECIMAL(7,2), created_at)
- `reviews` (id, **restaurant_id → restaurants.id**, **user_id → users.id**, rating 1–5, comment, created_at, updated_at), with UNIQUE (restaurant_id, user_id)

One owner has many restaurants; one restaurant has many menu items and many reviews; one customer has many reviews. Reviews link customers and restaurants (many to many).

### One action traced: changing a menu item's price

1. owner1 opens **Menu & reviews**. `loadMyRestaurants()` fills the dropdown; `selectRestaurant(id)` calls `loadMenu()` → `GET /api/owner/restaurants/3/menu`:
   ```sql
   SELECT id, name FROM restaurants WHERE id = ? AND owner_id = ?          -- findOwnRestaurant(), else 404
   SELECT id, name, description, price FROM menu_items WHERE restaurant_id = ? ORDER BY id
   ```
2. They click **Edit** on "Chicken Biryani". `startEdit(id)` turns that table row into three input boxes with Save and Cancel (Enter saves, Escape cancels).
3. They type `30` and click **Save**. `saveItem(id)` calls `readItem($row)`, which checks `checkMenuName()`, `checkDescription(…, 200)` and `checkMenuPrice()`. A price of `0` or `abc` shows an error under the box and nothing is sent.
4. `api('PUT', '/api/owner/menu/11', { name, description, price: '30' })` (11 is Chicken Biryani's id in the demo data).
5. `routes/menu.js`: `requireRole('owner')`, `validate.toId()`, `validate.checkMenuItem()`, then one statement that checks the owner through the restaurant:
   ```sql
   UPDATE menu_items m
   JOIN restaurants r ON r.id = m.restaurant_id
   SET m.name = ?, m.description = ?, m.price = ?
   WHERE m.id = ? AND r.owner_id = ?
   ```
   0 rows → 404 "Menu item not found." Otherwise 200 "Menu item updated."
6. `.done()` shows the message and `loadMenu()` redraws the table.

### Validation and security in your part

- Item name 2 to 80; description at most 200; price matches `^\d+(\.\d{1,2})?$` and is between 0.50 and 9999.99 AED. Same rules in the browser and on the server, plus a `CHECK` in the table.
- Every route checks ownership: `findOwnRestaurant()` for list/add/reviews, and the `JOIN ... WHERE r.owner_id = ?` for update/delete. owner2 cannot change owner1's items (404).
- Delete asks `confirm()` first.
- `setup.js` only allows letters, numbers and `_` in the database name, because a database name cannot be a `?` placeholder.

### Questions an examiner might ask

1. **What does `ON DELETE CASCADE` do here?** Deleting a restaurant automatically deletes its menu items and reviews. Deleting an owner deletes their restaurants (and so their menus and reviews). Deleting a customer deletes their reviews.
2. **Why is the average rating not a column?** It would go out of date whenever a review changes. We work it out with `AVG(rating)` and `COUNT(id)` using `LEFT JOIN` and `GROUP BY` when we need it.
3. **Why is price `DECIMAL(7,2)` and not `FLOAT`?** DECIMAL stores money exactly (25.50 stays 25.50). FLOAT can store 25.499999. 7 digits with 2 after the point allows up to 99999.99.
4. **How does the server know an item belongs to the owner, when the URL only has the item id?** It joins `menu_items` to `restaurants` and checks `r.owner_id = ?` in the same UPDATE or DELETE.

### What you added: the review summary

A short summary above the reviews: "4 reviews · average 3.8", then how many reviews have 5, 4, 3, 2 and 1 stars. It is worked out in the browser from the reviews already loaded, so there is no extra AJAX or SQL.
1. **Load:** `selectRestaurant()` calls `loadReviews()`, which sends `GET /api/owner/restaurants/:id/reviews`. The route checks the owner with `findOwnRestaurant()` and runs `SELECT rv.id, rv.rating, rv.comment, rv.created_at, u.full_name AS reviewer_name FROM reviews rv JOIN users u ON u.id = rv.user_id WHERE rv.restaurant_id = ? ORDER BY rv.created_at DESC, rv.id DESC`.
2. **Count:** `renderReviews(reviews)` empties `#review-summary`. If there are no reviews it leaves the summary empty, because the list below already says "No reviews yet for this restaurant." Otherwise it makes `counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }` and a `total`, and `reviews.forEach(...)` adds 1 to `counts[rating]` and the rating to `total`.
3. **Average:** `(total / reviews.length).toFixed(1)`, e.g. 3.8.
4. **Page:** it appends a bold headline (`<strong>` with `.text()`) and, in a `for` loop from 5 down to 1, one small box per star value ("5★ 1", "4★ 2" …). Then the review list is drawn as before.

---

## Yassin Awny

**Your part:** the administrator pages (users, restaurants, reviews) and the testing.

### Your files

| File | What it does |
|---|---|
| `routes/admin.js` | FR8, FR9, FR10: `/api/admin/stats`, users (list, edit, delete), restaurants (list, edit, delete), reviews (list, delete). Every route starts with `requireRole('admin')`. |
| `public/admin.html` | Overview counts, the three tabs, a search box per tab (plus a role filter for users), an edit panel above each table. |
| `public/js/admin.js` | `showTab()` for the jQuery tabs, `liveSearch()`, `loadStats()`, `loadUsers()`/`renderUsers()`/`openUserForm()`/`saveUser()`/`deleteUser()`, the same for restaurants, `loadReviews()`/`renderReviews()`/`deleteReview()`, and `applyLowRatingFilter()` for the low-rating checkbox. |
| `docs/TEST_CHECKLIST.md` | Every test to run before submitting. |

### One action traced: removing the rude review

1. The admin opens `admin.html`. `requireRole(['admin'])` lets them in. `loadStats()`, `loadUsers()`, `loadRestaurants()` and `loadReviews()` all run.
2. They click the **Reviews** tab. `showTab('reviews')` shows that panel, hides the others and sets `aria-selected`.
3. They type "clowns" in the search box. `liveSearch()` waits 300 ms, then `loadReviews()` checks the text with `checkSearchText()` and calls `api('GET', '/api/admin/reviews?q=clowns')`:
   ```sql
   SELECT rv.id, rv.rating, rv.comment, rv.created_at,
     r.id AS restaurant_id, r.name AS restaurant_name, u.full_name AS reviewer_name
   FROM reviews rv
   JOIN restaurants r ON r.id = rv.restaurant_id
   JOIN users u ON u.id = rv.user_id
   WHERE 1 = 1 AND (rv.comment LIKE ? OR r.name LIKE ? OR u.full_name LIKE ?)
   ORDER BY rv.created_at DESC, rv.id DESC
   ```
   `renderReviews()` draws one row with `data-id` and `data-rating`.
4. They click **Remove**. `deleteReview(id)` shows `confirm()` with the reviewer, restaurant and comment.
5. `api('DELETE', '/api/admin/reviews/15')` → `requireRole('admin')` → `validate.toId()` →
   ```sql
   DELETE FROM reviews WHERE id = ?
   ```
   0 rows → 404, otherwise 200 "Review removed."
6. `.done()` shows the message and reloads the reviews, the restaurants (their ratings changed) and the counts.

### Validation and security in your part

- `requireRole('admin')` on every admin route: a customer token gets 403, no token gets 401. Hiding the Admin link is not the security; the server check is.
- Edit user: full name 2 to 60, valid email (409 if taken), role customer/owner/admin. Edit restaurant: the same rules as the owner form.
- An admin cannot change their own role or delete their own account (400). In the browser the role box is disabled and Delete is greyed out on your own row.
- Deleting an owner warns: "This owner has 3 restaurant(s). Those restaurants, with their menus and reviews, will be deleted too."
- Search text at most 60 characters; the role filter must be one of the three roles.

### Questions an examiner might ask

1. **How do the tabs work?** Three buttons with `data-tab`. `showTab(name)` adds the `active` class and `aria-selected="true"` to the clicked one and sets the `hidden` property so only `#panel-<name>` shows. The left and right arrow keys move between tabs too.
2. **What stops a customer from calling `/api/admin/users` directly, e.g. with curl?** `requireRole('admin')` on the server. It loads the user from the token and returns 403 unless the role is admin.
3. **What happens to an owner's restaurants when you delete the owner?** `ON DELETE CASCADE` deletes them, and their menu items and reviews. That's why the confirm box warns first.
4. **If you change a customer into an owner, when does it take effect?** Immediately: `requireLogin` reads the role from the database on every request, not from the token or the browser.

### What you added: "Show only low ratings"

A checkbox on the Reviews tab: "Show only low ratings (1–2 stars)". It hides rows in the browser, so there is no AJAX, no route and no SQL.
1. **HTML** (`admin.html`): `<label class="checkbox-label"><input type="checkbox" id="low-ratings-only"> …</label>` in the Reviews toolbar, next to the search box.
2. **Data:** `renderReviews()` already puts the rating on each row: `$('<tr>').attr('data-rating', review.rating)`. The reviews come from `GET /api/admin/reviews` (the SQL above).
3. **Event:** `$('#low-ratings-only').on('change', applyLowRatingFilter)`.
4. **Filter:** `applyLowRatingFilter()` reads `$('#low-ratings-only').prop('checked')`, removes any old "No low-rated reviews" row, and goes through every `#reviews-table tbody tr[data-rating]`: if the box is ticked and the rating is above 2 it calls `.hide()`, otherwise `.show()`. If the box is ticked and no review is left, it adds one row saying "No low-rated reviews".
5. **After a search:** `renderReviews()` calls `applyLowRatingFilter()` at the end (also when the list is empty), so the filter still applies after a new search or after a review is removed.

### Testing

Run every line of `docs/TEST_CHECKLIST.md` on the final version, tick each one, and send anything that fails to the file's owner.
