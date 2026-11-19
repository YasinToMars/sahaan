// Owner: Yassin Awny
// Requirements: FR8 (manage customer and owner accounts), FR9 (manage any restaurant),
//               FR10 (remove inappropriate reviews)
// What it does: the admin page. Overview counts at the top, then three jQuery tabs.
// Each tab has a live search box, a table, an Edit panel above the table, and Delete with a confirm.

let users = [];
let restaurants = [];
let reviews = [];

$(function () {
  if (!requireRole(['admin'])) return;

  loadLists().done(function () {
    fillSelect($('#restaurant-cuisine'), LISTS.cuisines);
    fillSelect($('#restaurant-location'), LISTS.locations);
    fillPriceSelect($('#restaurant-price'));
  });
  setupCounter($('#restaurant-description'), $('#restaurant-description-counter'), 0, 500);

  loadStats();
  loadUsers();
  loadRestaurants();
  loadReviews();

  // Tabs: click, or use the left and right arrow keys.
  $('.tab').on('click', function () {
    showTab($(this).attr('data-tab'));
  });
  $('.tabs').on('keydown', '.tab', function (event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const $tabs = $('.tab');
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const $next = $tabs.eq(($tabs.index(this) + step + $tabs.length) % $tabs.length);
    showTab($next.attr('data-tab'));
    $next.trigger('focus');
  });

  // Live search boxes (300 ms after typing stops) and the role filter.
  liveSearch($('#user-search'), loadUsers);
  $('#user-role-filter').on('change', loadUsers);
  liveSearch($('#restaurant-search'), loadRestaurants);
  liveSearch($('#review-search'), loadReviews);

  // Users
  $('#users-table').on('click', '.edit-user', function () {
    openUserForm(rowId(this));
  });
  $('#users-table').on('click', '.delete-user', function () {
    deleteUser(rowId(this));
  });
  $('#user-form').on('submit', saveUser);

  // Restaurants
  $('#restaurants-table').on('click', '.edit-restaurant', function () {
    openRestaurantForm(rowId(this));
  });
  $('#restaurants-table').on('click', '.delete-restaurant', function () {
    deleteRestaurant(rowId(this));
  });
  $('#restaurant-form').on('submit', saveRestaurant);

  // Reviews
  $('#reviews-table').on('click', '.delete-review', function () {
    deleteReview(rowId(this));
  });

  // TODO (Yassin Awny): when #low-ratings-only changes, hide the rows of #reviews-table whose
  //   data-rating is above 2 (show them all again when it is unticked). Run it again after renderReviews().

  $('.close-panel').on('click', function () {
    $(this).closest('.edit-panel').prop('hidden', true);
  });
});

/* ----- Helpers ----- */

function showTab(name) {
  $('.tab').each(function () {
    const isActive = $(this).attr('data-tab') === name;
    $(this)
      .toggleClass('active', isActive)
      .attr('aria-selected', isActive ? 'true' : 'false')
      .attr('tabindex', isActive ? null : '-1');
  });
  $('.tab-panel').prop('hidden', true);
  $('#panel-' + name).prop('hidden', false);
}

function liveSearch($input, loadFunction) {
  let timer = null;
  $input.on('input', function () {
    clearTimeout(timer);
    timer = setTimeout(loadFunction, 300);
  });
}

// The id stored on the table row that contains this button.
function rowId(element) {
  return Number($(element).closest('tr').attr('data-id'));
}

function findById(list, id) {
  return list.find(function (row) {
    return row.id === id;
  });
}

// Reads a search box, checks it, and returns "?q=..." (or null if it is too long).
function searchQuery($input, extra) {
  const q = $input.val().trim();
  if (showFieldErrors($input.closest('.toolbar'), { q: checkSearchText(q) })) return null;
  return '?' + $.param($.extend({ q: q }, extra));
}

function emptyRow(columns, text) {
  return $('<tr>').append($('<td class="empty-line">').attr('colspan', columns).text(text));
}

function actionButtons(editClass, deleteClass, deleteText) {
  const $cell = $('<td class="actions">');
  if (editClass) {
    $cell.append($('<button type="button" class="button button-secondary button-small">').addClass(editClass).text('Edit'));
  }
  return $cell.append($('<button type="button" class="button button-danger button-small">').addClass(deleteClass).text(deleteText));
}

function openPanel($form) {
  clearFieldErrors($form);
  $form.prop('hidden', false);
  $form[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
  $form.find('input:not([type="hidden"])').first().trigger('focus');
}

/* ----- Overview ----- */

function loadStats() {
  api('GET', '/api/admin/stats').done(function (stats) {
    $('#stat-customers').text(stats.customers);
    $('#stat-owners').text(stats.owners);
    $('#stat-restaurants').text(stats.restaurants);
    $('#stat-reviews').text(stats.reviews);
  });
}

/* ----- Users (FR8) ----- */

function loadUsers() {
  const query = searchQuery($('#user-search'), { role: $('#user-role-filter').val() });
  if (query === null) return;

  api('GET', '/api/admin/users' + query)
    .done(function (data) {
      users = data.users;
      renderUsers();
    })
    .fail(function (xhr) {
      showMessage('#users-message', errorMessage(xhr), 'error');
    });
}

function renderUsers() {
  const me = getUser();
  const $tbody = $('#users-table tbody').empty();

  if (users.length === 0) {
    $tbody.append(emptyRow(6, 'No users match your search.'));
    return;
  }

  users.forEach(function (user) {
    const isMe = user.id === me.id;
    const $name = $('<td>').text(user.full_name);
    if (isMe) $name.append($('<span class="tag">').text('You'));

    const $actions = actionButtons('edit-user', 'delete-user', 'Delete');
    if (isMe) {
      $actions.find('.delete-user').prop('disabled', true).attr('title', 'You cannot delete your own account');
    }

    $tbody.append(
      $('<tr>').attr('data-id', user.id).append(
        $name,
        $('<td>').text(user.email),
        $('<td>').append($('<span class="badge">').addClass('badge-' + user.role).text(user.role)),
        $('<td class="number">').text(user.role === 'owner' ? user.restaurant_count : '-'),
        $('<td>').text(formatDate(user.created_at)),
        $actions
      )
    );
  });
}

function openUserForm(id) {
  const user = findById(users, id);
  const isMe = id === getUser().id;

  $('#user-id').val(user.id);
  $('#user-full_name').val(user.full_name);
  $('#user-email').val(user.email);
  $('#user-role').val(user.role).prop('disabled', isMe);
  $('#own-role-note').prop('hidden', !isMe);
  clearMessage('#users-message');
  openPanel($('#user-form'));
}

function saveUser(event) {
  event.preventDefault();
  const $form = $('#user-form');
  const id = Number($('#user-id').val());

  const data = {
    full_name: $('#user-full_name').val().trim(),
    email: $('#user-email').val().trim(),
    role: $('#user-role').val()
  };
  // The same rules as utils/validate.js checkAdminUser.
  const errors = {
    full_name: checkFullName(data.full_name),
    email: checkEmail(data.email),
    role: checkAnyRole(data.role)
  };
  if (showFieldErrors($form, errors)) return;

  api('PUT', '/api/admin/users/' + id, data)
    .done(function (result) {
      $form.prop('hidden', true);
      showMessage('#users-message', result.message, 'success');
      // If I edited my own name or email, update the saved session and the header.
      if (id === getUser().id) {
        saveSession(getSession().token, $.extend(getUser(), { full_name: data.full_name, email: data.email.toLowerCase() }));
        renderHeader();
      }
      loadUsers();
      loadStats();
      loadRestaurants(); // owner names appear there
      loadReviews();     // reviewer names appear there
    })
    .fail(function (xhr) {
      showMessage('#users-message', errorMessage(xhr), 'error');
    });
}

function deleteUser(id) {
  const user = findById(users, id);
  let warning = 'Delete the account of ' + user.full_name + ' (' + user.email + ')?';
  if (user.role === 'owner' && user.restaurant_count > 0) {
    warning += '\n\nThis owner has ' + user.restaurant_count + ' restaurant(s). ' +
      'Those restaurants, with their menus and reviews, will be deleted too.';
  }
  if (user.role === 'customer') {
    warning += '\n\nTheir reviews will be deleted too.';
  }
  warning += '\n\nThis cannot be undone.';
  if (!confirm(warning)) return;

  api('DELETE', '/api/admin/users/' + id)
    .done(function (result) {
      $('#user-form').prop('hidden', true);
      showMessage('#users-message', result.message, 'success');
      loadUsers();
      loadRestaurants();
      loadReviews();
      loadStats();
    })
    .fail(function (xhr) {
      showMessage('#users-message', errorMessage(xhr), 'error');
    });
}

/* ----- Restaurants (FR9) ----- */

function loadRestaurants() {
  const query = searchQuery($('#restaurant-search'), {});
  if (query === null) return;

  api('GET', '/api/admin/restaurants' + query)
    .done(function (data) {
      restaurants = data.restaurants;
      renderRestaurants();
    })
    .fail(function (xhr) {
      showMessage('#restaurants-message', errorMessage(xhr), 'error');
    });
}

function renderRestaurants() {
  const $tbody = $('#restaurants-table tbody').empty();

  if (restaurants.length === 0) {
    $tbody.append(emptyRow(7, 'No restaurants match your search.'));
    return;
  }

  restaurants.forEach(function (restaurant) {
    const rating = restaurant.review_count
      ? restaurant.avg_rating.toFixed(1) + ' (' + restaurant.review_count + ')'
      : 'No reviews';
    $tbody.append(
      $('<tr>').attr('data-id', restaurant.id).append(
        $('<td>').append($('<a>').attr('href', '/restaurant.html?id=' + restaurant.id).text(restaurant.name)),
        $('<td>').text(restaurant.owner_name),
        $('<td>').text(restaurant.cuisine),
        $('<td>').text(restaurant.location),
        $('<td>').text(priceLabel(restaurant.price_level)),
        $('<td>').text(rating),
        actionButtons('edit-restaurant', 'delete-restaurant', 'Delete')
      )
    );
  });
}

function openRestaurantForm(id) {
  const restaurant = findById(restaurants, id);

  $('#restaurant-id').val(restaurant.id);
  $('#restaurant-name').val(restaurant.name);
  $('#restaurant-cuisine').val(restaurant.cuisine);
  $('#restaurant-location').val(restaurant.location);
  $('#restaurant-price').val(String(restaurant.price_level));
  $('#restaurant-description').val(restaurant.description || '').trigger('input');
  clearMessage('#restaurants-message');
  openPanel($('#restaurant-form'));
}

function saveRestaurant(event) {
  event.preventDefault();
  const $form = $('#restaurant-form');
  const id = Number($('#restaurant-id').val());

  const data = {
    name: $('#restaurant-name').val().trim(),
    cuisine: $('#restaurant-cuisine').val(),
    location: $('#restaurant-location').val(),
    price_level: $('#restaurant-price').val(),
    description: $('#restaurant-description').val().trim()
  };
  // The same rules as utils/validate.js checkRestaurant.
  const errors = {
    name: checkRestaurantName(data.name),
    cuisine: checkCuisine(data.cuisine),
    location: checkLocation(data.location),
    price_level: checkPriceLevel(data.price_level),
    description: checkDescription(data.description, 500)
  };
  if (showFieldErrors($form, errors)) return;

  api('PUT', '/api/admin/restaurants/' + id, data)
    .done(function (result) {
      $form.prop('hidden', true);
      showMessage('#restaurants-message', result.message, 'success');
      loadRestaurants();
      loadReviews(); // restaurant names appear there
    })
    .fail(function (xhr) {
      showMessage('#restaurants-message', errorMessage(xhr), 'error');
    });
}

function deleteRestaurant(id) {
  const restaurant = findById(restaurants, id);
  const warning = 'Delete ' + restaurant.name + '?\n\n' +
    'Its menu and its ' + restaurant.review_count + ' review(s) will be deleted too. This cannot be undone.';
  if (!confirm(warning)) return;

  api('DELETE', '/api/admin/restaurants/' + id)
    .done(function (result) {
      $('#restaurant-form').prop('hidden', true);
      showMessage('#restaurants-message', result.message, 'success');
      loadRestaurants();
      loadReviews();
      loadUsers(); // owners' restaurant counts change
      loadStats();
    })
    .fail(function (xhr) {
      showMessage('#restaurants-message', errorMessage(xhr), 'error');
    });
}

/* ----- Reviews (FR10) ----- */

function loadReviews() {
  const query = searchQuery($('#review-search'), {});
  if (query === null) return;

  api('GET', '/api/admin/reviews' + query)
    .done(function (data) {
      reviews = data.reviews;
      renderReviews();
    })
    .fail(function (xhr) {
      showMessage('#reviews-message', errorMessage(xhr), 'error');
    });
}

function renderReviews() {
  const $tbody = $('#reviews-table tbody').empty();

  if (reviews.length === 0) {
    $tbody.append(emptyRow(6, 'No reviews match your search.'));
    return;
  }

  reviews.forEach(function (review) {
    $tbody.append(
      // data-rating lets the browser filter rows by rating without asking the server.
      $('<tr>').attr('data-id', review.id).attr('data-rating', review.rating).append(
        $('<td>').append($('<a>').attr('href', '/restaurant.html?id=' + review.restaurant_id).text(review.restaurant_name)),
        $('<td>').text(review.reviewer_name),
        $('<td class="stars">').text(starsText(review.rating)).attr('aria-label', review.rating + ' out of 5 stars'),
        $('<td class="comment-cell">').text(review.comment),
        $('<td>').text(formatDate(review.created_at)),
        actionButtons(null, 'delete-review', 'Remove')
      )
    );
  });
}

function deleteReview(id) {
  const review = findById(reviews, id);
  const warning = 'Remove this review by ' + review.reviewer_name + ' of ' + review.restaurant_name + '?\n\n"' +
    shorten(review.comment, 120) + '"\n\nThis cannot be undone.';
  if (!confirm(warning)) return;

  api('DELETE', '/api/admin/reviews/' + id)
    .done(function (result) {
      showMessage('#reviews-message', result.message, 'success');
      loadReviews();
      loadRestaurants(); // ratings change
      loadStats();
    })
    .fail(function (xhr) {
      showMessage('#reviews-message', errorMessage(xhr), 'error');
    });
}
