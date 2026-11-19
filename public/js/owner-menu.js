// Owner: Aberham Ketema Abebe
// Requirements: FR6 (add, update and remove menu items of my restaurants), FR7 (view the reviews of my restaurants)
// What it does: a dropdown picks one of my restaurants. Its menu is shown in a table with
// inline Edit and Delete, there is a form to add an item, and its reviews are listed below.

let selectedRestaurantId = null;
let menuItems = [];      // the menu of the chosen restaurant
let currentReviews = []; // the reviews of the chosen restaurant

$(function () {
  if (!requireRole(['owner'])) return;

  loadMyRestaurants();

  $('#restaurant-select').on('change', function () {
    selectRestaurant(Number($(this).val()));
  });

  $('#add-item-form').on('submit', addItem);

  // The table rows are redrawn often, so the handlers are attached to <tbody>.
  const $tbody = $('#menu-table tbody');
  $tbody.on('click', '.edit-item', function () {
    startEdit(rowId(this));
  });
  $tbody.on('click', '.save-item', function () {
    saveItem(rowId(this));
  });
  $tbody.on('click', '.cancel-item', renderMenu);
  $tbody.on('click', '.delete-item', function () {
    deleteItem(rowId(this));
  });
  // In an edit row, Enter saves and Escape cancels.
  $tbody.on('keydown', 'input', function (event) {
    if (event.key === 'Enter') saveItem(rowId(this));
    if (event.key === 'Escape') renderMenu();
  });
});

// The menu item id of the table row that contains this element.
function rowId(element) {
  return Number($(element).closest('tr').attr('data-id'));
}

function findItem(id) {
  return menuItems.find(function (item) {
    return item.id === id;
  });
}

/* ----- Choosing a restaurant ----- */

function loadMyRestaurants() {
  api('GET', '/api/owner/restaurants')
    .done(function (data) {
      if (data.restaurants.length === 0) {
        $('#page-message').attr('class', 'message message-info').empty().append(
          "You don't have a restaurant yet. ",
          $('<a href="/owner.html">').text('Add your restaurant first'),
          ', then come back here to add its menu.'
        );
        return;
      }

      const $select = $('#restaurant-select').empty();
      data.restaurants.forEach(function (restaurant) {
        $select.append($('<option>').val(restaurant.id).text(restaurant.name));
      });

      // Open the restaurant from ?restaurant=ID if it is one of mine, otherwise the first one.
      const wantedId = toId(getQueryParam('restaurant'));
      const chosen = data.restaurants.find(function (restaurant) {
        return restaurant.id === wantedId;
      }) || data.restaurants[0];

      $select.val(chosen.id);
      $('#menu-page').prop('hidden', false);
      selectRestaurant(chosen.id);
    })
    .fail(function (xhr) {
      showMessage('#page-message', errorMessage(xhr), 'error');
    });
}

function selectRestaurant(id) {
  selectedRestaurantId = id;
  history.replaceState(null, '', '/owner-menu.html?restaurant=' + id); // so a reload opens the same one
  clearMessage('#menu-message');
  loadMenu();
  loadReviews();
}

/* ----- Menu items ----- */

function loadMenu() {
  api('GET', '/api/owner/restaurants/' + selectedRestaurantId + '/menu')
    .done(function (data) {
      menuItems = data.items;
      renderMenu();
    })
    .fail(function (xhr) {
      showMessage('#menu-message', errorMessage(xhr), 'error');
    });
}

function renderMenu() {
  const $tbody = $('#menu-table tbody').empty();

  if (menuItems.length === 0) {
    $tbody.append(
      $('<tr>').append($('<td colspan="4" class="empty-line">').text('No menu items yet. Add your first dish below.'))
    );
    return;
  }

  menuItems.forEach(function (item) {
    $tbody.append(
      $('<tr>').attr('data-id', item.id).append(
        $('<td>').text(item.name),
        $('<td class="muted">').text(item.description || '-'),
        $('<td class="number">').text(Number(item.price).toFixed(2)),
        $('<td class="actions">').append(
          $('<button type="button" class="button button-secondary button-small edit-item">').text('Edit'),
          $('<button type="button" class="button button-danger button-small delete-item">').text('Delete')
        )
      )
    );
  });
}

// Inline edit: turn one row into input boxes.
function startEdit(id) {
  renderMenu(); // closes any other row that was being edited
  const item = findItem(id);
  const $row = $('#menu-table tbody tr[data-id="' + id + '"]');

  $row.addClass('editing').empty().append(
    $('<td>').append(
      $('<input type="text" name="name" maxlength="80">').attr('aria-label', 'Item name').val(item.name),
      $('<p class="field-error" data-error-for="name">')
    ),
    $('<td>').append(
      $('<input type="text" name="description" maxlength="200">').attr('aria-label', 'Description').val(item.description || ''),
      $('<p class="field-error" data-error-for="description">')
    ),
    $('<td class="number">').append(
      $('<input type="text" name="price" inputmode="decimal">').attr('aria-label', 'Price in AED').val(Number(item.price).toFixed(2)),
      $('<p class="field-error" data-error-for="price">')
    ),
    $('<td class="actions">').append(
      $('<button type="button" class="button button-small save-item">').text('Save'),
      $('<button type="button" class="button button-secondary button-small cancel-item">').text('Cancel')
    )
  );
  $row.find('input').first().trigger('focus');
}

// Reads and checks menu item fields inside $container (the add form or an edit row).
// Returns the data, or null if there are errors.
function readItem($container) {
  const data = {
    name: $container.find('[name="name"]').val().trim(),
    description: $container.find('[name="description"]').val().trim(),
    price: $container.find('[name="price"]').val().trim()
  };
  // The same rules as utils/validate.js checkMenuItem.
  const errors = {
    name: checkMenuName(data.name),
    description: checkDescription(data.description, 200),
    price: checkMenuPrice(data.price)
  };
  return showFieldErrors($container, errors) ? null : data;
}

function saveItem(id) {
  const data = readItem($('#menu-table tbody tr[data-id="' + id + '"]'));
  if (!data) return;

  api('PUT', '/api/owner/menu/' + id, data)
    .done(function (result) {
      showMessage('#menu-message', result.message, 'success');
      loadMenu();
    })
    .fail(function (xhr) {
      showMessage('#menu-message', errorMessage(xhr), 'error');
    });
}

function deleteItem(id) {
  const item = findItem(id);
  if (!confirm('Remove "' + item.name + '" from the menu?')) return;

  api('DELETE', '/api/owner/menu/' + id)
    .done(function (result) {
      showMessage('#menu-message', result.message, 'success');
      loadMenu();
    })
    .fail(function (xhr) {
      showMessage('#menu-message', errorMessage(xhr), 'error');
    });
}

function addItem(event) {
  event.preventDefault();
  const $form = $('#add-item-form');
  const data = readItem($form);
  if (!data) return;

  api('POST', '/api/owner/restaurants/' + selectedRestaurantId + '/menu', data)
    .done(function (result) {
      $form[0].reset();
      showMessage('#menu-message', result.message, 'success');
      loadMenu();
      $('#item-name').trigger('focus');
    })
    .fail(function (xhr) {
      showMessage('#menu-message', errorMessage(xhr), 'error');
    });
}

/* ----- Reviews (FR7) ----- */

function loadReviews() {
  api('GET', '/api/owner/restaurants/' + selectedRestaurantId + '/reviews')
    .done(function (data) {
      currentReviews = data.reviews;
      renderReviews(currentReviews);
    })
    .fail(function (xhr) {
      showMessage('#menu-message', errorMessage(xhr), 'error');
    });
}

function renderReviews(reviews) {
  // TODO (Aberham): fill <div id="review-summary"> from the reviews array: the number of reviews,
  //   the average rating, and how many reviews have 5, 4, 3, 2 and 1 stars (count them with forEach).

  const $list = $('#owner-reviews').empty();
  if (reviews.length === 0) {
    $list.append($('<li class="empty-line">').text('No reviews yet for this restaurant.'));
    return;
  }

  reviews.forEach(function (review) {
    $list.append(
      $('<li class="review">').append(
        $('<div class="review-head">').append(
          $('<span class="stars">').text(starsText(review.rating)).attr('aria-label', review.rating + ' out of 5 stars'),
          $('<strong>').text(review.reviewer_name),
          $('<span class="muted small">').text(formatDate(review.created_at))
        ),
        $('<p class="review-comment">').text(review.comment)
      )
    );
  });
}
