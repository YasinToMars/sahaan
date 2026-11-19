// Owner: Yasin Shafiei
// Requirement: FR2 (search and filter restaurants by text, cuisine, location, price and minimum rating)
// What it does: the home page.
//   - The dropdowns search as soon as they change; the text box searches after a short pause.
//   - The results are shown as cards, with a count and an empty state.
//   - Web Storage: the last search is saved in localStorage ("sahaan.lastSearch")
//     and put back when the page opens.

const LAST_SEARCH_KEY = 'sahaan.lastSearch';
let typingTimer = null; // waits for a short pause in typing before searching
let searchNumber = 0;   // makes sure an old, slow answer never replaces a newer one

$(function () {
  const $form = $('#search-form');

  loadLists()
    .done(function () {
      fillSelect($('#cuisine'), LISTS.cuisines);
      fillSelect($('#location'), LISTS.locations);
      fillPriceSelect($('#price'));
      restoreLastSearch();
      runSearch();
    })
    .fail(function (xhr) {
      showMessage('#search-message', errorMessage(xhr), 'error');
    });

  // Dropdowns: search straight away.
  $form.on('change', 'select', runSearch);

  // Search box: search 300 ms after the user stops typing.
  $('#q').on('input', function () {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(runSearch, 300);
  });

  // Pressing Enter in the search box.
  $form.on('submit', function (event) {
    event.preventDefault();
    clearTimeout(typingTimer);
    runSearch();
  });

  // "Clear filters" (in the form, and in the empty state).
  $(document).on('click', '.clear-filters', function () {
    $form[0].reset();
    $('#restore-note').text('');
    runSearch();
  });
});

// Reads the search box and the dropdowns.
function readFilters() {
  return {
    q: $('#q').val().trim(),
    cuisine: $('#cuisine').val(),
    location: $('#location').val(),
    price: $('#price').val(),
    minRating: $('#minRating').val(),
    sort: $('#sort').val()
  };
}

function runSearch() {
  const filters = readFilters();

  // Browser-side check (the server checks again).
  if (showFieldErrors($('#search-form'), { q: checkSearchText(filters.q) })) return;

  clearMessage('#search-message');
  saveLastSearch(filters);

  // Only send the filters that have a value, e.g. ?q=sushi&price=4&sort=rating
  const params = {};
  $.each(filters, function (name, value) {
    if (value) params[name] = value;
  });

  searchNumber = searchNumber + 1;
  const thisSearch = searchNumber;
  $('#result-count').text('Searching…');

  api('GET', '/api/restaurants?' + $.param(params))
    .done(function (data) {
      if (thisSearch !== searchNumber) return; // a newer search has started since
      renderResults(data.restaurants);
    })
    .fail(function (xhr) {
      $('#result-count').text('');
      showMessage('#search-message', errorMessage(xhr), 'error');
    });
}

function renderResults(restaurants) {
  const $results = $('#results').empty();

  if (restaurants.length === 0) {
    $('#result-count').text('0 restaurants');
    $results.append(
      $('<div class="empty-state">').append(
        $('<h2>').text('No restaurants match your filters'),
        $('<p class="muted">').text('Try a different word, or clear the filters to see every restaurant.'),
        $('<button type="button" class="button clear-filters">').text('Clear filters')
      )
    );
    return;
  }

  $('#result-count').text(restaurants.length === 1 ? '1 restaurant' : restaurants.length + ' restaurants');
  restaurants.forEach(function (restaurant) {
    $results.append(buildCard(restaurant));
  });
}

// One result card. Every piece of text goes in with .text(), so it is escaped.
function buildCard(restaurant) {
  const $swatch = $('<div class="card-swatch" aria-hidden="true">')
    .addClass(swatchClass(restaurant.cuisine))
    .append(
      $('<span class="swatch-initial">').text(restaurant.name.charAt(0)),
      $('<span class="swatch-cuisine">').text(restaurant.cuisine)
    );

  const $body = $('<div class="card-body">').append(
    $('<h2 class="card-title">').text(restaurant.name),
    $('<p class="card-meta">').text(restaurant.cuisine + ' · ' + restaurant.location),
    $('<p class="card-price">').text(priceLabel(restaurant.price_level)),
    buildRating(restaurant.avg_rating, restaurant.review_count),
    $('<p class="card-desc">').text(shorten(restaurant.description, 110))
  );

  return $('<a class="restaurant-card">')
    .attr('href', '/restaurant.html?id=' + restaurant.id)
    .append($swatch, $body);
}

/* ----- Web Storage: remember the last search ----- */

function saveLastSearch(filters) {
  localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(filters));
}

function restoreLastSearch() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(LAST_SEARCH_KEY));
  } catch (error) {
    saved = null;
  }
  if (!saved) return;

  $('#q').val(saved.q || '');
  setSelect($('#cuisine'), saved.cuisine);
  setSelect($('#location'), saved.location);
  setSelect($('#price'), saved.price);
  setSelect($('#minRating'), saved.minRating);
  setSelect($('#sort'), saved.sort);

  const filters = readFilters();
  const hasFilters = filters.q || filters.cuisine || filters.location || filters.price || filters.minRating;
  if (hasFilters) {
    $('#restore-note').text('Showing your last search, saved in this browser.');
  }
}

// Chooses a value in a dropdown, or the first option if that value is not in the list.
function setSelect($select, value) {
  $select.val(value || '');
  if ($select.val() === null) {
    $select.prop('selectedIndex', 0);
  }
}
