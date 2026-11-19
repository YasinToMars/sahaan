// Owner: Danish Maindan
// Requirements: FR2 (search filters), FR5 and FR9 (restaurant forms)
// What it does: the fixed lists of cuisines, Dubai areas and price labels.
// This is the single source for these lists: the server validates against them,
// and the browser gets the same lists from GET /api/restaurants/filters.

const CUISINES = [
  'Emirati',
  'Lebanese',
  'Indian',
  'Pakistani',
  'Persian',
  'Turkish',
  'Italian',
  'Japanese',
  'Chinese',
  'Mexican',
  'Seafood',
  'Café'
];

const LOCATIONS = [
  'Deira',
  'Bur Dubai',
  'Karama',
  'Downtown Dubai',
  'Business Bay',
  'Jumeirah',
  'Al Barsha',
  'Dubai Marina',
  'JLT',
  'Silicon Oasis'
];

// price_level in the database is 1 to 4; these are the labels people see.
const PRICE_LABELS = {
  1: '$ Budget',
  2: '$$ Moderate',
  3: '$$$ Upscale',
  4: '$$$$ Fine dining'
};

module.exports = { CUISINES, LOCATIONS, PRICE_LABELS };
