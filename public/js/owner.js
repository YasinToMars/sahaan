// Owner: Orit Woldemeskel
// Requirement: FR5 (restaurant owners add and update their own restaurants)
// What it does: shows "My restaurants" from GET /api/owner/restaurants as cards with stats.
// The form adds a restaurant (POST). Clicking Edit fills the form, and Save sends a PUT.

let myRestaurants = [];

$(function () {
  if (!requireRole(['owner'])) return;

  loadLists().done(function () {
    fillSelect($('#cuisine'), LISTS.cuisines);
    fillSelect($('#location'), LISTS.locations);
    fillPriceSelect($('#price_level'));
    loadMyRestaurants();
  });

  setupCounter($('#description'), $('#description-counter'), 0, 500);

  $('#restaurant-form').on('submit', saveRestaurant);
  $('#cancel-edit').on('click', resetForm);
  $('#restaurant-list').on('click', '.edit-restaurant', function () {
    const id = Number($(this).closest('.owner-card').attr('data-id'));
    fillForm(findRestaurant(id));
  });
});

function loadMyRestaurants() {
  api('GET', '/api/owner/restaurants')
    .done(function (data) {
      myRestaurants = data.restaurants;
      renderRestaurants();
    })
    .fail(function (xhr) {
      showMessage('#restaurant-message', errorMessage(xhr), 'error');
    });
}

function findRestaurant(id) {
  return myRestaurants.find(function (restaurant) {
    return restaurant.id === id;
  });
}

function renderRestaurants() {
  const $list = $('#restaurant-list').empty();

  if (myRestaurants.length === 0) {
    $list.append(
      $('<div class="empty-state">').append(
        $('<h2>').text("You haven't added a restaurant yet"),
        $('<p class="muted">').text('Use the form to add your first restaurant. It will appear in the search straight away.')
      )
    );
    return;
  }

  myRestaurants.forEach(function (restaurant) {
    const menuWords = restaurant.menu_count === 1 ? '1 menu item' : restaurant.menu_count + ' menu items';
    $list.append(
      $('<article class="panel owner-card">').attr('data-id', restaurant.id).append(
        $('<div class="owner-card-swatch" aria-hidden="true">')
          .addClass(swatchClass(restaurant.cuisine))
          .text(restaurant.name.charAt(0)),
        $('<div class="owner-card-body">').append(
          $('<h3>').text(restaurant.name),
          $('<p class="card-meta">').text(
            restaurant.cuisine + ' · ' + restaurant.location + ' · ' + priceLabel(restaurant.price_level)
          ),
          $('<div class="stat-line">').append(
            buildRating(restaurant.avg_rating, restaurant.review_count),
            $('<p class="muted small">').text(menuWords)
          ),
          $('<div class="button-row">').append(
            $('<button type="button" class="button button-secondary button-small edit-restaurant">').text('Edit'),
            $('<a class="button button-secondary button-small">')
              .attr('href', '/restaurant.html?id=' + restaurant.id)
              .text('View public page'),
            $('<a class="button button-secondary button-small">')
              .attr('href', '/owner-menu.html?restaurant=' + restaurant.id)
              .text('Menu & reviews')
          )
        )
      )
    );
  });
}

// Reads the form into the object we send to the server.
function readForm() {
  return {
    name: $('#name').val().trim(),
    cuisine: $('#cuisine').val(),
    location: $('#location').val(),
    price_level: $('#price_level').val(),
    description: $('#description').val().trim(),
    opening_hours: $('#opening_hours').val().trim()
  };
}

// Edit: put the restaurant's details into the form.
function fillForm(restaurant) {
  clearFieldErrors($('#restaurant-form'));
  clearMessage('#restaurant-message');

  $('#restaurant-id').val(restaurant.id);
  $('#name').val(restaurant.name);
  $('#cuisine').val(restaurant.cuisine);
  $('#location').val(restaurant.location);
  $('#price_level').val(String(restaurant.price_level));
  $('#description').val(restaurant.description || '').trigger('input'); // 'input' updates the counter
  $('#opening_hours').val(restaurant.opening_hours || '');

  $('#form-heading').text('Edit ' + restaurant.name);
  $('#save-button').text('Save changes');
  $('#cancel-edit').prop('hidden', false);

  $('.form-panel')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#name').trigger('focus');
}

function resetForm() {
  $('#restaurant-form')[0].reset();
  $('#restaurant-id').val('');
  $('#description').trigger('input');
  clearFieldErrors($('#restaurant-form'));
  $('#form-heading').text('Add a restaurant');
  $('#save-button').text('Add restaurant');
  $('#cancel-edit').prop('hidden', true);
}

function saveRestaurant(event) {
  event.preventDefault();
  const $form = $('#restaurant-form');
  clearMessage('#restaurant-message');

  const data = readForm();
  // The same rules as utils/validate.js checkRestaurant.
  const errors = {
    name: checkRestaurantName(data.name),
    cuisine: checkCuisine(data.cuisine),
    location: checkLocation(data.location),
    price_level: checkPriceLevel(data.price_level),
    description: checkDescription(data.description, 500),
    opening_hours: ''
  };
  if (data.opening_hours.length > 100) {
    errors.opening_hours = 'Opening hours must be at most 100 characters.';
  }
  if (showFieldErrors($form, errors)) return;

  // An id in the hidden field means we are editing (PUT); otherwise we are adding (POST).
  const id = $('#restaurant-id').val();
  const request = id
    ? api('PUT', '/api/owner/restaurants/' + id, data)
    : api('POST', '/api/owner/restaurants', data);

  request
    .done(function (result) {
      resetForm();
      showMessage('#restaurant-message', result.message, 'success');
      loadMyRestaurants();
    })
    .fail(function (xhr) {
      showMessage('#restaurant-message', errorMessage(xhr), 'error');
    });
}