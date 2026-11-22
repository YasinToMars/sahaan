// Owner: Yasin Shafiei
// Requirements: FR1 (the login session), NFR Usability (the same navigation on every page, clear messages),
//               NFR Security (user text is escaped), NFR Reliability (browser-side validation)
// What it does: the code every page shares. Every page loads jQuery, then this file, then its own script.
//   1. The login session in localStorage (Web Storage)
//   2. api(): every AJAX call goes through here and sends the login token
//   3. The header and navigation
//   4. Page guards: requireLogin() and requireRole()
//   5. Success and error messages, and errors next to each field
//   6. Validation rules (the same rules as utils/validate.js on the server)
//   7. The cuisine, location and price lists
//   8. Small helpers: escapeHtml, stars, prices, dates, character counter, star picker

/* ==========================================================================
   1. Login session: localStorage "sahaan.session" holds { token, user }
   ========================================================================== */

const SESSION_KEY = 'sahaan.session';

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (error) {
    return null; // missing or broken data counts as "not logged in"
  }
}

// The logged-in user { id, full_name, email, role }, or null.
function getUser() {
  const session = getSession();
  return session ? session.user : null;
}

function saveSession(token, user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: token, user: user }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ==========================================================================
   2. api(): sends JSON with jQuery $.ajax and adds "Authorization: Bearer <token>"
   ========================================================================== */

// Returns the jQuery request, so pages can add .done(), .fail() and .always().
function api(method, url, data) {
  const session = getSession();
  const options = { method: method, url: url, dataType: 'json', headers: {} };

  if (session) {
    options.headers.Authorization = 'Bearer ' + session.token;
  }
  if (data !== undefined) {
    options.contentType = 'application/json';
    options.data = JSON.stringify(data);
  }

  return $.ajax(options).fail(function (xhr) {
    // 401 means "not logged in" (for example, the server restarted or the login expired).
    // Forget the old login and go to the login page. A wrong password on the login form is
    // also a 401, so the login and logout requests are left alone.
    const isLoginOrLogout = url === '/api/auth/login' || url === '/api/auth/logout';
    if (xhr.status === 401 && !isLoginOrLogout) {
      clearSession();
      goToLogin();
    }
  });
}

// The error text from a failed request, e.g. { "error": "Wrong email or password." }
function errorMessage(xhr) {
  if (xhr.responseJSON && xhr.responseJSON.error) return xhr.responseJSON.error;
  if (xhr.status === 0) return 'Cannot reach the server. Is it running?';
  return 'Something went wrong. Please try again.';
}

// Sends the user to the login page, which brings them back here afterwards.
function goToLogin() {
  if (window.location.pathname === '/login.html') return;
  const here = window.location.pathname + window.location.search;
  window.location.href = '/login.html?next=' + encodeURIComponent(here);
}

/* ==========================================================================
   3. Header and navigation (fills <header id="site-header"> on every page)
   ========================================================================== */

function renderHeader() {
  const user = getUser();
  const links = [{ href: '/index.html', text: 'Restaurants' }];

  if (user && user.role === 'customer') {
    links.push({ href: '/my-reviews.html', text: 'My reviews' });
  }
  if (user && user.role === 'owner') {
    links.push({ href: '/owner.html', text: 'My restaurants' });
    links.push({ href: '/owner-menu.html', text: 'Menu & reviews' });
  }
  if (user && user.role === 'admin') {
    links.push({ href: '/admin.html', text: 'Admin' });
  }
  if (user) {
    links.push({ href: '/profile.html', text: 'Profile' });
  } else {
    links.push({ href: '/login.html', text: 'Log in' });
    links.push({ href: '/register.html', text: 'Register' });
  }

  const $list = $('<ul class="nav-list">');
  links.forEach(function (link) {
    const $link = $('<a>').attr('href', link.href).text(link.text);
    if (isCurrentPage(link.href)) {
      $link.addClass('active').attr('aria-current', 'page');
    }
    $list.append($('<li>').append($link));
  });

  if (user) {
    $list.append($('<li class="nav-user">').text(user.full_name + ' (' + user.role + ')'));
    $list.append($('<li>').append($('<button type="button" id="logout-button" class="nav-button">').text('Log out')));
  }

  const $skipLink = $('<a class="skip-link" href="#main">').text('Skip to content');
  const $logo = $('<a class="logo" href="/index.html">').text('Sahaan');
  const $menuButton = $('<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="site-nav">').text('Menu');
  const $nav = $('<nav id="site-nav" class="site-nav" aria-label="Main">').append($list);

  $('#site-header').empty().append($skipLink, $('<div class="header-inner">').append($logo, $menuButton, $nav));
}

function isCurrentPage(href) {
  const path = window.location.pathname;
  return path === href || (href === '/index.html' && path === '/');
}

// Under 700px wide, the links are hidden behind the Menu button.
$(document).on('click', '.menu-toggle', function () {
  const isOpen = $('#site-nav').toggleClass('open').hasClass('open');
  $(this).attr('aria-expanded', isOpen ? 'true' : 'false');
});

$(document).on('click', '#logout-button', function () {
  api('POST', '/api/auth/logout').always(function () {
    clearSession();
    window.location.href = '/index.html';
  });
});

/* ==========================================================================
   4. Page guards. The server checks every request too; these only keep the page tidy.
   ========================================================================== */

// Any logged-in user. Sends visitors to the login page.
function requireLogin() {
  if (getUser()) return true;
  goToLogin();
  return false;
}

// Only these roles, e.g. requireRole(['owner']).
function requireRole(roles) {
  const user = getUser();
  if (!user) {
    goToLogin();
    return false;
  }
  if (!roles.includes(user.role)) {
    $('#main').empty().append(
      $('<div class="notice" role="alert">').append(
        $('<h1>').text("You don't have access to this page"),
        $('<p>').text('This page is for ' + roles.join(' or ') + ' accounts, and you are logged in as a ' + user.role + '.'),
        $('<a class="button" href="/index.html">').text('Back to restaurants')
      )
    );
    return false;
  }
  return true;
}

/* ==========================================================================
   5. Messages
   ========================================================================== */

// Shows a message in a box, e.g. showMessage('#login-message', 'Welcome back!', 'success').
// type is 'success', 'error' or 'info'. .text() keeps any HTML in the message harmless.
function showMessage(selector, text, type) {
  $(selector)
    .attr('class', 'message message-' + type)
    .attr('role', type === 'error' ? 'alert' : 'status')
    .text(text);
}

function clearMessage(selector) {
  $(selector).attr('class', 'message').text('');
}

// errors is an object such as { email: 'Enter your email address.', password: '' }.
// Shows each message under its field (the element with data-error-for="email").
// Returns true if at least one field has an error.
function showFieldErrors($container, errors) {
  let hasError = false;

  $.each(errors, function (field, message) {
    const $input = $container.find('[name="' + field + '"]');
    $container.find('[data-error-for="' + field + '"]').text(message);
    if (message) {
      $input.addClass('invalid').attr('aria-invalid', 'true');
      hasError = true;
    } else {
      $input.removeClass('invalid').removeAttr('aria-invalid');
    }
  });

  if (hasError) {
    $container.find('.invalid').first().trigger('focus');
  }
  return hasError;
}

function clearFieldErrors($container) {
  $container.find('[data-error-for]').text('');
  $container.find('.invalid').removeClass('invalid').removeAttr('aria-invalid');
}

/* ==========================================================================
   6. Validation: the same rules and messages as utils/validate.js on the server.
      Each check returns an error message, or '' when the value is fine.
   ========================================================================== */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toWholeNumber(value) {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value);
  return NaN;
}

function toId(value) {
  return /^[1-9]\d{0,8}$/.test(String(value)) ? Number(value) : null;
}

function checkRequired(value, message) {
  return typeof value === 'string' && value !== '' ? '' : message;
}

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
  if (!['customer', 'owner', 'admin'].includes(value)) return 'Role must be customer, owner or admin.';
  return '';
}

function checkRestaurantName(value) {
  const name = cleanText(value);
  if (name.length < 2 || name.length > 100) return 'Restaurant name must be 2 to 100 characters.';
  return '';
}

function checkCuisine(value) {
  if (!LISTS.cuisines.includes(value)) return 'Choose a cuisine from the list.';
  return '';
}

function checkLocation(value) {
  if (!LISTS.locations.includes(value)) return 'Choose a location from the list.';
  return '';
}

function checkPriceLevel(value) {
  const level = toWholeNumber(value);
  if (!(level >= 1 && level <= 4)) return 'Choose a price level from 1 to 4.';
  return '';
}

function checkDescription(value, maxLength) {
  if (cleanText(value).length > maxLength) return 'Description must be at most ' + maxLength + ' characters.';
  return '';
}

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

function checkSearchText(value) {
  if (cleanText(value).length > 60) return 'Search text must be at most 60 characters.';
  return '';
}

/* ==========================================================================
   7. Lists (cuisines, locations, price labels) from GET /api/restaurants/filters.
      The server reads them from config/lists.js, so both sides use the same lists.
   ========================================================================== */

let LISTS = { cuisines: [], locations: [], priceLabels: {} };

function loadLists() {
  return api('GET', '/api/restaurants/filters').done(function (data) {
    LISTS = data;
  });
}

// Adds one <option> per value, after any options already in the HTML.
function fillSelect($select, values) {
  values.forEach(function (value) {
    $select.append($('<option>').val(value).text(value));
  });
}

function fillPriceSelect($select) {
  $.each(LISTS.priceLabels, function (level, label) {
    $select.append($('<option>').val(level).text(label));
  });
}

function priceLabel(level) {
  return LISTS.priceLabels[level] || '$'.repeat(level);
}

/* ==========================================================================
   8. Small helpers
   ========================================================================== */

// Makes text safe to put inside HTML: <b> becomes &lt;b&gt;.
// (Most of our code uses jQuery .text(), which does this for us.)
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Reads ?name=value from the address bar.
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// 4.3 -> "★★★★☆"
function starsText(rating) {
  const full = Math.round(Number(rating) || 0);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// A line like "★★★★★ 4.7 (3 reviews)", or "No reviews yet".
function buildRating(average, count) {
  const $rating = $('<p class="rating">');
  if (!count) {
    return $rating.append($('<span class="muted">').text('No reviews yet'));
  }
  const words = count === 1 ? '1 review' : count + ' reviews';
  return $rating.append(
    $('<span class="stars" aria-hidden="true">').text(starsText(average)),
    $('<span class="rating-text">').text(' ' + Number(average).toFixed(1) + ' (' + words + ')')
  ).attr('aria-label', 'Rated ' + Number(average).toFixed(1) + ' out of 5 from ' + words);
}

// 28 -> "AED 28.00"
function formatPrice(price) {
  return 'AED ' + Number(price).toFixed(2);
}

// "2026-11-04T10:00:00.000Z" -> "4 Nov 2026"
function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Cuts long text and adds "…".
function shorten(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength - 1).trim() + '…' : text;
}

// The classes for a cuisine's picture block, e.g. "swatch-3 photo-indian".
//  - swatch-0 to swatch-5: one of six patterns, picked from the letters of the cuisine name
//  - photo-<cuisine>: the cuisine's food photo from public/images/cuisines/ (see style.css section 10)
// normalize('NFD') splits "é" into "e" + an accent, so "Café" becomes "photo-cafe".
function swatchClass(cuisine) {
  let total = 0;
  for (const character of String(cuisine)) total += character.charCodeAt(0);
  const name = String(cuisine).toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
  return 'swatch-' + (total % 6) + ' photo-' + name;
}

// The footer on every page: the name, a short line, three columns of links, and a bottom line.
// The text already in <footer class="site-footer"> is kept as the bottom line.
function renderFooter() {
  const user = getUser();
  const $footer = $('.site-footer');
  const bottomText = $footer.text();

  function column(title, links) {
    const $list = $('<ul>');
    links.forEach(function (link) {
      $list.append($('<li>').append($('<a>').attr('href', link.href).text(link.text)));
    });
    return $('<div class="footer-column">').append($('<h2>').text(title), $list);
  }

  const accountLinks = user
    ? [{ href: '/profile.html', text: 'Your profile' }]
    : [{ href: '/login.html', text: 'Log in' }, { href: '/register.html', text: 'Create an account' }];

  $footer.empty().append(
    $('<div class="footer-inner">').append(
      $('<div class="footer-brand">').append(
        $('<a class="logo logo-light" href="/index.html">').text('Sahaan'),
        $('<p>').text('A food guide for Dubai: find restaurants, read the menu and honest reviews, and share your own.')
      ),
      column('Explore', [
        { href: '/index.html', text: 'All restaurants' },
        { href: '/index.html#cuisines', text: 'Browse by cuisine' }
      ]),
      column('For owners', [
        { href: '/register.html', text: 'List your restaurant' },
        { href: '/owner.html', text: 'My restaurants' }
      ]),
      column('Account', accountLinks)
    ),
    $('<div class="footer-bottom">').append(
      $('<p>').text(bottomText),
      $('<a href="/credits.html">').text('Photo credits')
    )
  );
}

// The header gets a "scrolled" class once the page moves, so it can turn solid
// (on the home page it starts see-through over the dark hero).
function watchScroll() {
  function update() {
    $('#site-header').toggleClass('scrolled', window.scrollY > 8);
  }
  $(window).on('scroll', update);
  update();
}

$(function () {
  renderFooter();
  watchScroll();
});

// Live character counter: "23 / 500". It turns red outside min..max.
function setupCounter($textarea, $counter, min, max) {
  function update() {
    const length = $textarea.val().trim().length;
    $counter.text(length + ' / ' + max).toggleClass('counter-bad', length < min || length > max);
  }
  $textarea.on('input', update);
  update();
}

// Five star buttons (radio inputs named "rating"). selected is 0 to 5.
// Hovering lights the stars up; clicking or the arrow keys choose a rating.
function buildStarPicker(selected) {
  const $picker = $('<div class="star-picker" role="radiogroup" aria-label="Rating">');

  for (let stars = 1; stars <= 5; stars++) {
    const $input = $('<input type="radio" name="rating">')
      .val(stars)
      .attr('aria-label', stars === 1 ? '1 star' : stars + ' stars')
      .prop('checked', stars === selected);
    $picker.append($('<label class="star">').append($input, $('<span aria-hidden="true">').text('★')));
  }

  function paint(upTo) {
    $picker.find('.star').each(function (index) {
      $(this).toggleClass('on', index < upTo);
    });
  }
  function checkedValue() {
    return Number($picker.find('input:checked').val()) || 0;
  }

  $picker.on('mouseenter', '.star', function () {
    paint($(this).index() + 1);
  });
  $picker.on('mouseleave', function () {
    paint(checkedValue());
  });
  $picker.on('change', 'input', function () {
    paint(checkedValue());
  });

  paint(selected);
  return $picker;
}

/* ==========================================================================
   Every page: draw the header as soon as the page is ready.
   ========================================================================== */

$(function () {
  renderHeader();
});
