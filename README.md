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

Team members: Yasin Shafiei, Danish Maindan, Orit Woldemeskel, Aberham Ketema Abebe, Yassin Awny. See `TEAM_ROLES.pdf` for who does what and the dates.

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
