// Owner: Danish Maindan
// Requirements: NFR Reliability (every form is checked again on the server); used by FR1 to FR10
// What it does: server-side validation. Each check returns an error message,
// or '' (empty text) when the value is fine.
// public/js/common.js has the same checks, with the same rules and messages, for the browser.

const { CUISINES, LOCATIONS } = require('../config/lists');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/; // digits, then optionally a dot and 1 or 2 digits
const SORT_OPTIONS = ['rating', 'name', 'newest'];
const ALL_ROLES = ['customer', 'owner', 'admin'];

// ---------- Small helpers ----------

// Returns trimmed text. Anything that is not text (missing, a number, a list) becomes ''.
function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// For optional fields: trimmed text, or null when it is empty (stored as NULL in MySQL).
function optionalText(value) {
  const text = cleanText(value);
  return text === '' ? null : text;
}

// Turns 3 or "3" into the number 3. Anything else (2.5, "abc", "") becomes NaN.
function toWholeNumber(value) {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value);
  return NaN;
}

// IDs in URLs must be positive whole numbers. Returns the number, or null if it is not valid.
function toId(value) {
  return /^[1-9]\d{0,8}$/.test(String(value)) ? Number(value) : null;
}

// Returns the first error message in the list, or '' if there are none.
function firstError(messages) {
  return messages.find((message) => message !== '') || '';
}

function checkRequired(value, message) {
  return typeof value === 'string' && value !== '' ? '' : message;
}

// ---------- Accounts (FR1, FR8) ----------

function checkFullName(value) {
  const name = cleanText(value);
  if (name.length < 2 || name.length > 60) return 'Full name must be 2 to 60 characters.';
  return '';
}

function checkEmail(value) {
  const email = cleanText(value);
  if (email === '') return 'Enter your email address.';
  if (email.length > 120 || !EMAIL_PATTERN.test(email)) return 'Enter a valid email address (at most 120 characters).';
  return '';
}

function checkPassword(value) {
  const password = typeof value === 'string' ? value : '';
  if (password.length < 8 || password.length > 64) return 'Password must be 8 to 64 characters.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return '';
}

function checkRegisterRole(value) {
  if (value !== 'customer' && value !== 'owner') return 'Choose "I\'m a customer" or "I own a restaurant".';
  return '';
}

function checkAnyRole(value) {
  if (!ALL_ROLES.includes(value)) return 'Role must be customer, owner or admin.';
  return '';
}

// ---------- Restaurants (FR5, FR9) ----------

function checkRestaurantName(value) {
  const name = cleanText(value);
  if (name.length < 2 || name.length > 100) return 'Restaurant name must be 2 to 100 characters.';
  return '';
}

function checkCuisine(value) {
  if (!CUISINES.includes(value)) return 'Choose a cuisine from the list.';
  return '';
}

function checkLocation(value) {
  if (!LOCATIONS.includes(value)) return 'Choose a location from the list.';
  return '';
}

function checkPriceLevel(value) {
  const level = toWholeNumber(value);
  if (!(level >= 1 && level <= 4)) return 'Choose a price level from 1 to 4.';
  return '';
}

// Optional text with a maximum length (restaurant and menu item descriptions).
function checkDescription(value, maxLength) {
  if (cleanText(value).length > maxLength) return 'Description must be at most ' + maxLength + ' characters.';
  return '';
}

// ---------- Menu items (FR6) ----------

function checkMenuName(value) {
  const name = cleanText(value);
  if (name.length < 2 || name.length > 80) return 'Item name must be 2 to 80 characters.';
  return '';
}

function checkMenuPrice(value) {
  const text = typeof value === 'number' ? String(value) : cleanText(value);
  if (!PRICE_PATTERN.test(text)) return 'Price must be a number with at most 2 decimal places, e.g. 25 or 25.50.';
  const price = Number(text);
  if (price < 0.5 || price > 9999.99) return 'Price must be between 0.50 and 9999.99 AED.';
  return '';
}

// ---------- Reviews (FR4) ----------

function checkRating(value) {
  const rating = toWholeNumber(value);
  if (!(rating >= 1 && rating <= 5)) return 'Choose a rating from 1 to 5 stars.';
  return '';
}

function checkComment(value) {
  const comment = cleanText(value);
  if (comment.length < 5 || comment.length > 500) return 'Comment must be 5 to 500 characters.';
  return '';
}

// ---------- Search (FR2) ----------

function checkSearch(query) {
  if (query.q !== undefined && (typeof query.q !== 'string' || query.q.trim().length > 60)) {
    return 'Search text must be at most 60 characters.';
  }
  if (query.cuisine && !CUISINES.includes(query.cuisine)) return 'Choose a cuisine from the list.';
  if (query.location && !LOCATIONS.includes(query.location)) return 'Choose a location from the list.';
  if (query.price && checkPriceLevel(query.price)) return 'Choose a price level from 1 to 4.';
  if (query.minRating) {
    const minRating = toWholeNumber(query.minRating);
    if (!(minRating >= 1 && minRating <= 5)) return 'Minimum rating must be from 1 to 5.';
  }
  if (query.sort && !SORT_OPTIONS.includes(query.sort)) return 'Sort must be rating, name or newest.';
  return '';
}

// The search boxes on the admin page (FR8, FR9, FR10), plus the role filter on the Users tab.
function checkAdminSearch(query) {
  if (query.q !== undefined && (typeof query.q !== 'string' || query.q.trim().length > 60)) {
    return 'Search text must be at most 60 characters.';
  }
  if (query.role && !ALL_ROLES.includes(query.role)) return 'Role must be customer, owner or admin.';
  return '';
}

// ---------- Whole forms: each returns the first error, or '' ----------

function checkRegister(body) {
  return firstError([
    checkFullName(body.full_name),
    checkEmail(body.email),
    checkPassword(body.password),
    checkRegisterRole(body.role)
  ]);
}

function checkLogin(body) {
  return firstError([checkEmail(body.email), checkRequired(body.password, 'Enter your password.')]);
}

function checkProfile(body) {
  return firstError([checkFullName(body.full_name), checkEmail(body.email)]);
}

function checkPasswordChange(body) {
  return firstError([
    checkRequired(body.current_password, 'Enter your current password.'),
    checkPassword(body.new_password)
  ]);
}

function checkAdminUser(body) {
  return firstError([checkFullName(body.full_name), checkEmail(body.email), checkAnyRole(body.role)]);
}

function checkRestaurant(body) {
  return firstError([
    checkRestaurantName(body.name),
    checkCuisine(body.cuisine),
    checkLocation(body.location),
    checkPriceLevel(body.price_level),
    checkDescription(body.description, 500)
  ]);
}

function checkMenuItem(body) {
  return firstError([
    checkMenuName(body.name),
    checkDescription(body.description, 200),
    checkMenuPrice(body.price)
  ]);
}

function checkReview(body) {
  return firstError([checkRating(body.rating), checkComment(body.comment)]);
}

module.exports = {
  cleanText,
  optionalText,
  toWholeNumber,
  toId,
  checkSearch,
  checkAdminSearch,
  checkRegister,
  checkLogin,
  checkProfile,
  checkPasswordChange,
  checkAdminUser,
  checkRestaurant,
  checkMenuItem,
  checkReview
};
