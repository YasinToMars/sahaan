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

## Team contributions

Each person owned one part of the app and built it in their own files.

### Yasin Shafiei

**Part:** customer side (accounts, login, profile, search and filters), the shared browser code, and the page design.

**What they built:**
- Register, log in, log out and the profile page, with passwords hashed by `crypto.scrypt` and login tokens checked on the server by `requireLogin` and `requireRole`.
- The home page search: live text search (name, cuisine or dish), five filters, sorting, and the last search saved in Web Storage.
- `common.js`, shared by every page: the header and navigation, `api()`, page guards, messages and the validation rules.
- The design: a black-and-white look with Playfair Display and Inter fonts, a home page with a photo hero, "Browse by cuisine" tiles and a "How it works" band, a food photo for each cuisine, a shared footer, and a phone layout under 700px.

**Files:** `public/index.html`, `public/login.html`, `public/register.html`, `public/profile.html`, `public/js/common.js`, `public/js/search.js`, `public/js/login.js`, `public/js/register.js`, `public/js/profile.js`, `public/css/style.css`, `routes/auth.js`, `routes/search.js`, `middleware/auth.js`, `utils/password.js`

**In the demo:** registers, logs in, searches with filters, reloads to show the last search remembered, then explains the code structure (the folder map below).

### Danish Maindan

**Part:** customer side (restaurant page and reviews) and the server setup.

**What they built:**
- The Express server, the MySQL connection pool, the shared lists and the server-side validation.
- The restaurant page: details, menu and reviews from `GET /api/restaurants/:id`.
- Writing, editing (inline) and deleting your own review, and the My reviews page.
- The "Sort reviews" dropdown (Newest, Highest rating, Lowest rating), which re-orders the loaded reviews in the browser.

**Files:** `server.js`, `config/db.js`, `config/db.example.json`, `config/lists.js`, `utils/validate.js`, `routes/restaurants.js`, `routes/reviews.js`, `public/restaurant.html`, `public/my-reviews.html`, `public/js/restaurant.js`, `public/js/my-reviews.js`

**In the demo:** explains the architecture diagram (`docs/architecture.svg`: browser → JSON → Node.js server), then writes, edits, deletes and sorts reviews.

### Orit Woldemeskel

**Part:** owner side (restaurant details) and team lead.

**What they built:**
- The My restaurants page: a card per restaurant with its rating, review count, menu item count and opening hours.
- One form that adds a restaurant (POST) or, after Edit, updates it (PUT). The server only updates the owner's own restaurants.
- The optional "Opening hours" field, checked in the browser and on the server (at most 100 characters) and shown on the public restaurant page.

**Files:** `routes/owner.js`, `public/owner.html`, `public/js/owner.js`

**In the demo:** gives the intro (the team, what Sahaan does, the three types of user), adds and edits a restaurant with opening hours, shows it on the public page, and presents the contribution table at the end.

### Aberham Ketema Abebe

**Part:** owner side (menu items and reviews view) and the database design.

**What they built:**
- The database: four tables (users, restaurants, menu_items, reviews) with foreign keys, `ON DELETE CASCADE`, indexes and `CHECK` rules, the demo data, and `npm run db:setup`.
- The Menu & reviews page: a menu table with inline edit and delete, and an add-item form.
- The reviews list for an owner's restaurant, with a summary: the number of reviews, the average rating, and how many reviews have each star value.

**Files:** `database/schema.sql`, `database/seed.sql`, `database/setup.js`, `routes/menu.js`, `public/owner-menu.html`, `public/js/owner-menu.js`

**In the demo:** explains the four tables and how they link, then adds, edits and deletes a menu item and shows the review summary.

### Yassin Awny

**Part:** admin (users, restaurants and reviews), testing and the demo video.

**What they built:**
- The admin page: overview counts and three jQuery tabs (Users, Restaurants, Reviews), each with a live search, an edit panel and delete with a confirm.
- The admin rules on the server: only admins can use `/api/admin`, and an admin cannot change their own role or delete their own account.
- The "Show only low ratings (1–2 stars)" checkbox, which hides higher-rated reviews in the browser.
- The test checklist (`docs/TEST_CHECKLIST.md`), run on the final version.

**Files:** `routes/admin.js`, `public/admin.html`, `public/js/admin.js`, `docs/TEST_CHECKLIST.md`

**In the demo:** shows the admin tabs, filters to low ratings, removes the rude review, and shows a customer being blocked from the admin page.

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
│   ├── credits.html          Yasin    Photo credits (author, licence and source of each food photo)
│   ├── images/cuisines/      Yasin    One food photo per cuisine, from Wikimedia Commons
│   ├── fonts/                Yasin    Inter and Playfair Display (self-hosted, SIL Open Font License)
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

Team members: Yasin Shafiei, Danish Maindan, Orit Woldemeskel, Aberham Ketema Abebe, Yassin Awny. See "Team contributions" above for what each person built.

---

## Photo credits

Each cuisine has one food photo in `public/images/cuisines/`, taken from Wikimedia Commons under free licences (CC0, public domain, CC BY and CC BY-SA). They show each cuisine in general, not the demo restaurants. The author, licence and source of every photo are on the Photo credits page (`/credits.html`, linked in every page's footer).

The two fonts, Inter and Playfair Display, are free fonts from Google Fonts under the SIL Open Font License. They are stored in `public/fonts/` with their licence files, so the site needs no internet connection to show them.

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
