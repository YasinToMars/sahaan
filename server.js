// Owner: Danish Maindan
// Requirements: all of them (this file starts the app)
// What it does: creates the Express app, serves the pages and jQuery, mounts every API router,
// and adds the "not found" and "something went wrong" handlers.
//
// We use Express 5: if an async route throws (for example a database error),
// Express passes the error to the error handler at the bottom of this file by itself.

const path = require('path');
const express = require('express');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Read JSON request bodies into req.body.
app.use(express.json());

// Make sure req.body is always an object, even when a request has no body.
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});

// The pages, CSS and browser scripts in public/, and jQuery from node_modules (no CDN).
app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));

// The API. The search router must come before the restaurants router,
// so that /api/restaurants/filters is not treated as /api/restaurants/:id.
app.use('/api/auth', require('./routes/auth'));               // FR1  Yasin
app.use('/api/restaurants', require('./routes/search'));      // FR2  Yasin
app.use('/api/restaurants', require('./routes/restaurants')); // FR3  Danish
app.use('/api', require('./routes/reviews'));                 // FR4  Danish
app.use('/api/owner', require('./routes/owner'));             // FR5  Orit
app.use('/api/owner', require('./routes/menu'));              // FR6, FR7  Aberham
app.use('/api/admin', require('./routes/admin'));             // FR8, FR9, FR10  Yassin

// Any other /api address gets a JSON 404.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// The last handler: catches every error that was not handled above.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }
  console.error(err); // the real error, for us in the terminal
  res.status(500).json({ error: 'Something went wrong' }); // a plain message for the browser
});

// Check the database first, then start listening.
db.testConnection()
  .then(() => {
    // Express 5 calls this function with an error if the server cannot start.
    app.listen(PORT, (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error('Port ' + PORT + ' is already in use. Stop the other app using it (or close the other terminal), then try again.');
        process.exit(1);
      }
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log('Sahaan is running at http://localhost:' + PORT);
      console.log('Press Ctrl + C to stop it.');
    });
  })
  .catch((err) => {
    console.error(db.explainError(err));
    process.exit(1);
  });
