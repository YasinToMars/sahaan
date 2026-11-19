// Owner: Danish Maindan
// Requirements: FR3 (view a restaurant, its menu and its reviews), FR4 (write, edit and delete your own review)
// What it does: loads GET /api/restaurants/:id and shows the details, the menu and the reviews.
// A customer can post a review (POST), edit it inline (PUT) or delete it (DELETE).

let restaurantId = null;
let currentReviews = []; // the reviews from the server, kept so they can be shown again (e.g. sorted)

$(function () {
  restaurantId = toId(getQueryParam('id'));
  if (!restaurantId) {
    showNotFound('This restaurant link is not valid.');
    return;
  }

  // The price labels come from the lists, so load them first.
  loadLists().always(loadRestaurant);

  // The review area is redrawn often, so these handlers are attached to the document.
  $(document).on('submit', '#review-form', postReview);
  $(document).on('click', '#edit-my-review', showEditForm);
  $(document).on('submit', '#edit-review-form', saveEdit);
  $(document).on('click', '#cancel-edit', renderReviewArea);
  $(document).on('click', '#delete-my-review', deleteMyReview);

  // TODO (Danish): "Sort reviews". When #review-sort changes, copy currentReviews, sort the copy
  //   (Newest: by created_at, Highest/Lowest rating: by rating) and pass it to renderReviews().
});

function loadRestaurant() {
  api('GET', '/api/restaurants/' + restaurantId)
    .done(function (data) {
      renderDetails(data.restaurant);
      renderMenu(data.menu);
      currentReviews = data.reviews;
      renderReviews(currentReviews);
      renderReviewArea();
    })
    .fail(function (xhr) {
      showNotFound(errorMessage(xhr));
    });
}

function showNotFound(text) {
  $('#restaurant-details').empty().append(
    $('<div class="notice">').append(
      $('<h1>').text('Restaurant not found'),
      $('<p>').text(text),
      $('<a class="button" href="/index.html">').text('Back to restaurants')
    )
  );
  $('.restaurant-layout').hide();
}

/* ----- Details ----- */

function renderDetails(restaurant) {
  document.title = restaurant.name + ' · Sahaan';

  const $facts = $('<ul class="facts">').append(
    $('<li>').text(restaurant.cuisine),
    $('<li>').text(restaurant.location),
    $('<li>').text(priceLabel(restaurant.price_level))
  );
  if (restaurant.opening_hours) {
    $facts.append($('<li>').text('Open: ' + restaurant.opening_hours));
  }

  $('#restaurant-details').empty().append(
    $('<div class="hero-swatch" aria-hidden="true">')
      .addClass(swatchClass(restaurant.cuisine))
      .text(restaurant.name.charAt(0)),
    $('<div class="hero-text">').append(
      $('<h1>').text(restaurant.name),
      buildRating(restaurant.avg_rating, restaurant.review_count),
      $facts,
      $('<p class="hero-description">').text(restaurant.description || ''),
      $('<p class="muted small">').text('Listed by ' + restaurant.owner_name)
    )
  );
}

/* ----- Menu ----- */

function renderMenu(menu) {
  const $list = $('#menu-list').empty();
  if (menu.length === 0) {
    $list.append($('<li class="empty-line">').text('This restaurant has not added its menu yet.'));
    return;
  }
  menu.forEach(function (item) {
    $list.append(
      $('<li class="menu-item">').append(
        $('<div>').append(
          $('<p class="menu-name">').text(item.name),
          $('<p class="muted small">').text(item.description || '')
        ),
        $('<p class="menu-price">').text(formatPrice(item.price))
      )
    );
  });
}

/* ----- Reviews list ----- */

// Draws the list from an array of reviews, so it can be called again with the same reviews in a new order.
function renderReviews(reviews) {
  const user = getUser();
  const $list = $('#reviews-list').empty();
  $('#review-count').text('(' + reviews.length + ')');

  if (reviews.length === 0) {
    $list.append($('<li class="empty-line">').text('No reviews yet. Be the first to share your experience!'));
    return;
  }

  reviews.forEach(function (review) {
    const $name = $('<strong>').text(review.reviewer_name);
    if (user && review.user_id === user.id) {
      $name.append($('<span class="tag">').text('You'));
    }
    $list.append(
      $('<li class="review">').append(
        $('<div class="review-head">').append(
          $('<span class="stars">').text(starsText(review.rating)).attr('aria-label', review.rating + ' out of 5 stars'),
          $name,
          $('<span class="muted small">').text(formatDate(review.created_at))
        ),
        $('<p class="review-comment">').text(review.comment)
      )
    );
  });
}

/* ----- The review area: form, "Your review", or "Log in to write a review" ----- */

function renderReviewArea() {
  const user = getUser();
  const $area = $('#review-area').empty();

  if (!user) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    $area.append(
      $('<p class="notice-inline">').append(
        $('<a>').attr('href', '/login.html?next=' + next).text('Log in'),
        ' to write a review.'
      )
    );
    return;
  }

  if (user.role !== 'customer') {
    $area.append($('<p class="notice-inline">').text('Only customer accounts can write reviews.'));
    return;
  }

  const myReview = currentReviews.find(function (review) {
    return review.user_id === user.id;
  });

  if (myReview) {
    $area.append(
      $('<div class="my-review">').append(
        $('<h3>').text('Your review'),
        $('<p class="stars">').text(starsText(myReview.rating)).attr('aria-label', myReview.rating + ' out of 5 stars'),
        $('<p class="review-comment">').text(myReview.comment),
        $('<div class="button-row">').append(
          $('<button type="button" id="edit-my-review" class="button button-secondary button-small">').text('Edit'),
          $('<button type="button" id="delete-my-review" class="button button-danger button-small">').text('Delete')
        )
      )
    );
    return;
  }

  $area.append(buildReviewForm('review-form', 'Write a review', 0, '', 'Post review'));
}

// The form used both for a new review and for editing one.
function buildReviewForm(formId, title, rating, comment, buttonText) {
  const $textarea = $('<textarea name="comment" rows="4" maxlength="500">').attr('id', formId + '-comment').val(comment);
  const $counter = $('<span class="counter" aria-live="polite">');

  const $form = $('<form class="form review-form" novalidate>').attr('id', formId).append(
    $('<h3>').text(title),
    $('<div class="field">').append(
      $('<span class="label">').text('Your rating'),
      buildStarPicker(rating),
      $('<p class="field-error" data-error-for="rating">')
    ),
    $('<div class="field">').append(
      $('<label>').attr('for', formId + '-comment').text('Your comment'),
      $textarea,
      $('<div class="field-foot">').append(
        $('<p class="field-error" data-error-for="comment">'),
        $counter
      )
    ),
    $('<div class="button-row">').append($('<button type="submit" class="button">').text(buttonText))
  );

  if (formId === 'edit-review-form') {
    $form.find('.button-row').append(
      $('<button type="button" id="cancel-edit" class="button button-secondary">').text('Cancel')
    );
  }

  setupCounter($textarea, $counter, 5, 500);
  return $form;
}

// Reads and checks a review form. Returns the data, or null if there are errors.
function readReviewForm($form) {
  const data = {
    rating: Number($form.find('input[name="rating"]:checked').val()) || 0,
    comment: $form.find('textarea[name="comment"]').val().trim()
  };
  const errors = {
    rating: checkRating(data.rating),
    comment: checkComment(data.comment)
  };
  return showFieldErrors($form, errors) ? null : data;
}

function postReview(event) {
  event.preventDefault();
  const data = readReviewForm($(this));
  if (!data) return;

  api('POST', '/api/restaurants/' + restaurantId + '/reviews', data)
    .done(function (result) {
      showMessage('#review-message', result.message, 'success');
      loadRestaurant();
    })
    .fail(function (xhr) {
      showMessage('#review-message', errorMessage(xhr), 'error');
    });
}

function findMyReview() {
  const user = getUser();
  return currentReviews.find(function (review) {
    return review.user_id === user.id;
  });
}

// Inline edit: swap "Your review" for a filled-in form.
function showEditForm() {
  const myReview = findMyReview();
  clearMessage('#review-message');
  $('#review-area').empty().append(
    buildReviewForm('edit-review-form', 'Edit your review', myReview.rating, myReview.comment, 'Save changes')
  );
  $('#edit-review-form-comment').trigger('focus');
}

function saveEdit(event) {
  event.preventDefault();
  const data = readReviewForm($(this));
  if (!data) return;

  api('PUT', '/api/reviews/' + findMyReview().id, data)
    .done(function (result) {
      showMessage('#review-message', result.message, 'success');
      loadRestaurant();
    })
    .fail(function (xhr) {
      showMessage('#review-message', errorMessage(xhr), 'error');
    });
}

function deleteMyReview() {
  if (!confirm('Delete your review of this restaurant? This cannot be undone.')) return;

  api('DELETE', '/api/reviews/' + findMyReview().id)
    .done(function (result) {
      showMessage('#review-message', result.message, 'success');
      loadRestaurant();
    })
    .fail(function (xhr) {
      showMessage('#review-message', errorMessage(xhr), 'error');
    });
}
