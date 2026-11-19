<!-- Owner: Yasin Shafiei. What it is: how to set up and run Sahaan, the demo accounts, and who owns which files. -->

# Sahaan: Food Advisor for Dubai

Sahaan helps people in Dubai find somewhere to eat. You can search restaurants by name, dish, cuisine, area, price and rating, read menus and reviews, and write your own reviews.

There are three kinds of user:

| Role | Can do |
|---|---|
| **Customer** | Search, view restaurants, write, edit and delete their own reviews, edit their profile |
| **Restaurant owner** | Add and update their own restaurants, manage their menus, read their reviews |
| **Administrator** | Manage every account, restaurant and review |

F28WP Web Programming, coursework CW1.2, Group 15 (Heriot-Watt University Dubai).
Built with HTML, CSS, JavaScript, jQuery, JSON, Node.js (Express), MySQL and Web Storage only.

---

## Set up (about 20 minutes, once)

### 1. Install Node.js and MySQL

**Mac**
1. Install **Node.js LTS** from [nodejs.org](https://nodejs.org).
2. Install MySQL. Either:
   - with [Homebrew](https://brew.sh): run `brew install mysql`, then `brew services start mysql`. The user is `root` with **no password**.
   - or the **MySQL Community Server** installer from [dev.mysql.com/downloads](https://dev.mysql.com/downloads/mysql/). Write down the root password you choose.

**Windows**
1. Install **Node.js LTS** from [nodejs.org](https://nodejs.org) (keep the default options).
2. Install MySQL with the **MySQL Installer for Windows** from [dev.mysql.com/downloads](https://dev.mysql.com/downloads/installer/). Choose "Server only", set a root password and write it down. Leave "Start the MySQL Server at System Startup" ticked.

Check both in a terminal: `node -v` should print v18 or newer.

### 2. Get the code and install the packages

Open the `sahan` folder in VS Code, then **Terminal → New Terminal**, and run:

```
npm install
```

This installs only three packages: `express`, `mysql2` and `jquery`.

### 3. Tell the app your MySQL password

Copy `config/db.example.json` and name the copy `config/db.local.json`:

- Mac: `cp config/db.example.json config/db.local.json`
- Windows (PowerShell): `copy config\db.example.json config\db.local.json`

Open `config/db.local.json` and put your MySQL password between the quotes:

```json
{ "host": "localhost", "port": 3306, "user": "root", "password": "your-password-here", "database": "sahaan" }
```

`db.local.json` is listed in `.gitignore`, so your password never goes to GitHub.

### 4. Create the database and start the app

```
npm run db:setup
npm start
```

Open **http://localhost:3000**. To stop the app, click in the terminal and press **Ctrl + C**.

| Command | What it does |
|---|---|
| `npm install` | Installs the packages |
| `npm run db:setup` | Deletes and recreates the `sahaan` database with the demo data. Run it again any time to reset everything. |
| `npm start` | Runs the app at http://localhost:3000 |
| `npm run dev` | The same, but it restarts by itself when you save a file (`node --watch`) |

Stop the app before running `npm run db:setup`, then start it again. Restarting the app logs everyone out, because login sessions are kept in the server's memory.

---

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@sahaan.test | Admin123 |
| Owner | owner1@sahaan.test | Owner123 |
| Owner | owner2@sahaan.test | Owner123 |
| Owner | owner3@sahaan.test | Owner123 |
| Customer | customer1@sahaan.test | Customer123 |
| Customer | customer2@sahaan.test | Customer123 |
| Customer | customer3@sahaan.test | Customer123 |
| Customer | customer4@sahaan.test | Customer123 |

The demo data has 10 made-up restaurants in 10 cuisines and 10 Dubai areas. owner1 has 4 restaurants, owner2 and owner3 have 3 each. Saffron Courtyard and Kaze Noodle & Sushi Bar have no reviews yet. The 1-star review of Little Bosphorus Grill is deliberately rude, for the admin demo. All restaurants, people and reviews are fictional.

---

## Team roles: what each person does

Each person owns one part of the app. To work on your part:

1. Set up the app with the steps above.
2. Only change the files listed under your name.
3. Your task has a spot in the code marked `TODO (your name)`. To find it, search the project in VS Code (Cmd + Shift + F on a Mac, Ctrl + Shift + F on Windows).
4. After you change a file, stop the app (Ctrl + C), run `npm start` again and reload the browser. `npm run dev` restarts the app by itself.
5. `docs/EXPLAINED.md` has a section for you. It explains your files, gives a hint for your task, and lists questions you may be asked in the Q&A.
6. When you've finished, send the files you changed to Yasin, and he'll put them on GitHub. Don't send the `node_modules` folder or `config/db.local.json`.

### Yasin Shafiei

**Part:** customer side (accounts, login, profile, search and filters) and page design (CSS).
**Files:** `public/index.html`, `public/login.html`, `public/register.html`, `public/profile.html`, `public/js/common.js`, `public/js/search.js`, `public/js/login.js`, `public/js/register.js`, `public/js/profile.js`, `public/css/style.css`, `routes/auth.js`, `routes/search.js`, `middleware/auth.js`, `utils/password.js`

1. Restyle the app in `public/css/style.css`. Start with the colour, font and spacing variables at the top of the file (`:root`), because the rest of the file uses them.
2. Style the restaurant cards on the home page, the forms (login, register, profile), and the tables on the owner and admin pages.
3. Check the phone layout. Open the browser's dev tools, turn on the device toolbar and set the width to 375px. The phone rules are at the bottom of the file, in `@media (max-width: 699px)`.
4. Use plain CSS only: no Bootstrap or other libraries.
5. Test registering: create a new account, and also try a password that's too short and check that an error shows.
6. Test the account pages: log in and out, edit your name and email, and change your password.
7. Test search: search by restaurant name and by dish name, and use each filter (cuisine, area, price, rating, sort).
8. Reload the home page and check that the last search comes back. This is Web Storage.
9. Collect everyone's changed files, add them to the project and push to GitHub.

**In the demo:** register, log in, search with filters, and show the last search being remembered after a reload. Then explain the code structure (the folder map below).

### Danish Maindan

**Part:** customer side (restaurant page and reviews) and server setup.
**Files:** `server.js`, `config/db.js`, `config/db.example.json`, `config/lists.js`, `utils/validate.js`, `routes/restaurants.js`, `routes/reviews.js`, `public/restaurant.html`, `public/my-reviews.html`, `public/js/restaurant.js`, `public/js/my-reviews.js`

1. Log in as `customer1@sahaan.test` and open any restaurant.
2. Check the Node.js lab files from the course. Did they use Express and mysql2 (or the `mysql` package)? If they used something else, tell Yasin.
3. In `public/restaurant.html`, find `TODO (Danish)`. Add a `<select id="review-sort">` with a label and three options: Newest, Highest rating, Lowest rating.
4. In `public/js/restaurant.js`, find `TODO (Danish)`. When `#review-sort` changes:
   - copy the reviews with `currentReviews.slice()`
   - sort the copy: by `created_at` for Newest, by `rating` for Highest rating and Lowest rating
   - pass the copy to `renderReviews()`
5. Reload a restaurant page and check that the order changes with each option.
6. Test the reviews:
   - write a review, edit it, then delete it
   - try a comment shorter than 5 characters and check that an error shows
   - open My reviews and check that your review is listed
7. Learn how a review is saved: the form in `restaurant.js` sends it to `POST /api/restaurants/:id/reviews` in `routes/reviews.js`, which checks it and INSERTs it into the `reviews` table.
8. Send `public/restaurant.html` and `public/js/restaurant.js` to Yasin.

**In the demo:** explain the architecture diagram (`docs/architecture.svg`: browser → JSON → Node.js server), then show the restaurant page, writing, editing and deleting a review, and sorting the reviews.

### Orit Woldemeskel

**Part:** owner side (restaurant details) and team lead.
**Files:** `routes/owner.js`, `public/owner.html`, `public/js/owner.js`

1. Log in as `owner1@sahaan.test` and open My restaurants.
2. In `public/owner.html`, find `TODO (Orit)`. Add a text box for opening hours:
   - `id="opening_hours"`, `name="opening_hours"`, at most 100 characters
   - a label and a hint, e.g. "Daily 10:00-23:00"
   - an error line: `<p class="field-error" data-error-for="opening_hours"></p>`
3. In `public/js/owner.js`, find `TODO (Orit)`, then:
   - add `opening_hours` to the form data
   - show an error if it's longer than 100 characters
   - when Edit is clicked, fill the box from `restaurant.opening_hours`
4. In `routes/owner.js`, find `TODO (Orit)`, then:
   - send an error if the opening hours are longer than 100 characters
   - add `opening_hours` to the INSERT and the UPDATE
   - add `r.opening_hours` to the SELECT so the Edit button can fill it in
5. Edit a restaurant, type some opening hours, save, then click View public page and check that they appear.
6. Test the rest of your part:
   - add a new restaurant and edit it
   - try saving with an empty name and check that an error shows
   - log in as `owner2@sahaan.test` and check that owner1's restaurants don't appear
7. Send `routes/owner.js`, `public/owner.html` and `public/js/owner.js` to Yasin.
8. Submit the final code (GitHub → Code → Download ZIP) and the demo video on Canvas, then open both on Canvas to check they uploaded properly.

**In the demo:** give the intro (the team, what Sahaan does, the three types of user), show adding and editing a restaurant with opening hours, and present the contribution table at the end.

### Aberham Ketema Abebe

**Part:** owner side (menu items and reviews view) and database design.
**Files:** `database/schema.sql`, `database/seed.sql`, `database/setup.js`, `routes/menu.js`, `public/owner-menu.html`, `public/js/owner-menu.js`

1. Log in as `owner1@sahaan.test`, open Menu & reviews and choose a restaurant.
2. In `public/js/owner-menu.js`, find `TODO (Aberham)` inside `renderReviews(reviews)`. The empty `<div id="review-summary">` is already in the page.
3. Count how many reviews have each star value (5, 4, 3, 2, 1) and add up all the ratings.
4. Work out the average: the total divided by the number of reviews, to one decimal place. If there are no reviews, show "No reviews yet" instead.
5. Show it in `#review-summary`, e.g. "4 reviews · average 3.8", then one line per star value ("5★ 1", "4★ 2" and so on).
6. Choose a restaurant with no reviews (Saffron Courtyard) and check that nothing breaks.
7. Learn the database in `database/schema.sql`:
   - the four tables: users, restaurants, menu_items, reviews
   - how they link: `restaurants.owner_id` → users, `menu_items.restaurant_id` → restaurants, `reviews.restaurant_id` → restaurants, `reviews.user_id` → users
   - why deleting a restaurant also deletes its menu and reviews (ON DELETE CASCADE)
   - how `npm run db:setup` rebuilds everything from `schema.sql` and `seed.sql`
8. Test the menu:
   - add a menu item, change its price, then delete it
   - try a price of 0, letters, or 3 decimal places and check that an error shows
9. Send `public/js/owner-menu.js` (and any other of your files you changed) to Yasin.

**In the demo:** explain the database part of the architecture (the four tables and how they link), then show the menu items and the review summary.

### Yassin Awny

**Part:** admin (users, restaurants and reviews), testing and demo video.
**Files:** `routes/admin.js`, `public/admin.html`, `public/js/admin.js`, `docs/TEST_CHECKLIST.md`

1. Log in as `admin@sahaan.test` and open the Reviews tab.
2. In `public/admin.html`, find `TODO (Yassin Awny)`. Add the checkbox: `<label><input type="checkbox" id="low-ratings-only"> Show only low ratings (1–2 stars)</label>`
3. In `public/js/admin.js`, find `TODO (Yassin Awny)`, then:
   - when the box changes, hide every row of `#reviews-table` whose `data-rating` is above 2
   - when it's unticked, show all the rows again
   - run the same check at the end of `renderReviews()`, so it still works after a search
4. Tick the box and check that only 1- and 2-star reviews are shown.
5. Test the Users tab:
   - search users and filter by role
   - edit a user's name and change their role
   - delete a user (deleting an owner also deletes their restaurants)
6. Test the Restaurants and Reviews tabs: edit and delete a restaurant, and remove the rude 1-star review of Little Bosphorus Grill.
7. Check the access rules:
   - you can't delete your own account or change your own role
   - log in as `customer1@sahaan.test`, open `admin.html`, and check that access is blocked
8. Send `public/admin.html` and `public/js/admin.js` to Yasin.
9. When everyone's files are in, go through every line of `docs/TEST_CHECKLIST.md` on the final version and tell the file's owner about anything that fails.
10. Put together the demo video, at most 6 minutes: intro, architecture diagram, live demo of each part, code structure, contribution table.

**In the demo:** show the admin pages, remove the rude review, and show a customer being blocked from the admin page.

---

## Folder map and owners

Each file starts with a comment giving its owner, the requirement it covers and what it does.

```
sahan/
├── server.js                 Danish   Starts Express, serves the pages, mounts the routers, 404 + error handler
├── package.json              Danish   Packages and the npm commands
├── .gitignore                Danish   Keeps node_modules and db.local.json off GitHub
├── config/
│   ├── db.js                 Danish   The mysql2 connection pool; all database access goes through it
│   ├── db.example.json       Danish   Example MySQL settings (copy to db.local.json)
│   ├── db.local.json         (you)    Your MySQL password. Never on GitHub
│   └── lists.js              Danish   Cuisines, Dubai areas and price labels (one list for server and browser)
├── utils/
│   ├── validate.js           Danish   Server-side validation (the same rules as the browser)
│   └── password.js           Yasin    hashPassword and verifyPassword with crypto.scrypt
├── middleware/
│   └── auth.js               Yasin    Login sessions, requireLogin, requireRole
├── routes/
│   ├── auth.js               Yasin    FR1  register, login, logout, profile, password
│   ├── search.js             Yasin    FR2  search and filters
│   ├── restaurants.js        Danish   FR3  one restaurant with its menu and reviews
│   ├── reviews.js            Danish   FR4  write, edit, delete your reviews
│   ├── owner.js              Orit     FR5  add and update your restaurants
│   ├── menu.js               Aberham  FR6, FR7  menu items, reviews of your restaurants
│   └── admin.js              Yassin   FR8, FR9, FR10  users, restaurants, reviews
├── database/
│   ├── schema.sql            Aberham  The four tables
│   ├── seed.sql              Aberham  Demo restaurants, menus and reviews
│   └── setup.js              Aberham  npm run db:setup
├── public/                   (what the browser loads)
│   ├── index.html            Yasin    Home: search, filters, results
│   ├── login.html            Yasin
│   ├── register.html         Yasin
│   ├── profile.html          Yasin
│   ├── restaurant.html       Danish   One restaurant, its menu and reviews
│   ├── my-reviews.html       Danish   A customer's reviews
│   ├── owner.html            Orit     My restaurants
│   ├── owner-menu.html       Aberham  Menu & reviews
│   ├── admin.html            Yassin   Admin: users, restaurants, reviews
│   ├── css/style.css         Yasin    The one stylesheet
│   └── js/
│       ├── common.js         Yasin    Shared: session, api(), header, page guards, messages, validation, helpers
│       ├── search.js         Yasin
│       ├── login.js          Yasin
│       ├── register.js       Yasin
│       ├── profile.js        Yasin
│       ├── restaurant.js     Danish
│       ├── my-reviews.js     Danish
│       ├── owner.js          Orit
│       ├── owner-menu.js     Aberham
│       └── admin.js          Yassin
└── docs/
    ├── ARCHITECTURE.md       Yasin    How the parts fit together, the API, the tables, security
    ├── architecture.svg      Yasin    The architecture diagram (1600×900, for the video)
    ├── EXPLAINED.md          Yasin    One section per person, for the Q&A
    └── TEST_CHECKLIST.md     Yassin   Every test to run before submitting
```

Team members: Yasin Shafiei, Danish Maindan, Orit Woldemeskel, Aberham Ketema Abebe, Yassin Awny. See "Team roles" above for what each person does (the same list is in `TEAM_ROLES.pdf`).

---

## Fixing common errors

**"MySQL refused the username or password. Check "user" and "password" in config/db.local.json."**
The password in `config/db.local.json` is wrong. Fix it and run the command again. If you installed MySQL with Homebrew and never set a password, use `"password": ""`.

**"Could not reach MySQL. Make sure MySQL is installed and running"**
MySQL is not running.
- Mac (Homebrew): `brew services start mysql`
- Mac (installer): System Settings → MySQL → Start MySQL Server
- Windows: press Start, type **Services**, find **MySQL** (for example MySQL80 or MySQL84), right-click it and choose **Start**.

**"The "sahaan" database does not exist yet. Run: npm run db:setup"**
Run `npm run db:setup`, then `npm start`.

**"Port 3000 is already in use."**
The app is probably already running in another terminal. Find that terminal and press Ctrl + C. Or run on another port:
- Mac: `PORT=3001 npm start`
- Windows (PowerShell): `$env:PORT=3001; npm start`

Then open http://localhost:3001.

**"Cannot find module 'express'"**
Run `npm install` in the `sahan` folder.

**I was suddenly logged out.**
That is normal after the server restarts: login sessions live in the server's memory. Log in again.

**A page shows old content after you changed a file.**
Restart the app (or use `npm run dev`) and refresh the browser with Ctrl + Shift + R (Cmd + Shift + R on Mac).
