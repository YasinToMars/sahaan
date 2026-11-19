// Owner: Danish Maindan
// Requirement: FR4 (customers edit and delete their own reviews)
// What it does: loads GET /api/reviews/mine and shows each review with a link to its restaurant.
// Edit turns the card into a form in place (inline edit); Delete asks first.

let myReviews = [];

$(function () {
  if (!requireRole(['customer'])) return;

  loadMyReviews();

  const $list = $('#my-reviews');
  $list.on('click', '.edit-review', function () {
    showEditForm($(this).closest('.review-card'));
  });
  $list.on('click', '.cancel-edit', function () {
    renderMyReviews();
  });
  $list.on('submit', '.edit-form', saveEdit);
  $list.on('click', '.delete-review', deleteReview);
});

function loadMyReviews() {
  api('GET', '/api/reviews/mine')
    .done(function (data) {
      myReviews = data.reviews;
      renderMyReviews();
    })
    .fail(function (xhr) {
      showMessage('#my-reviews-message', errorMessage(xhr), 'error');
    });
}

function findReview(id) {
  return myReviews.find(function (review) {
    return review.id === id;
  });
}

function renderMyReviews() {
  const $list = $('#my-reviews').empty();

  if (myReviews.length === 0) {
    $list.append(
      $('<div class="empty-state">').append(
        $('<h2>').text("You haven't written any reviews yet"),
        $('<p class="muted">').text('Find a restaurant you have tried and tell others what you thought.'),
        $('<a class="button" href="/index.html">').text('Find a restaurant')
      )
    );
    return;
  }

  myReviews.forEach(function (review) {
    const edited = review.updated_at !== review.created_at ? ' · edited' : '';
    $list.append(
      $('<article class="panel review-card">').attr('data-id', review.id).append(
        $('<h2 class="review-card-title">').append(
          $('<a>').attr('href', '/restaurant.html?id=' + review.restaurant_id).text(review.restaurant_name)
        ),
        $('<div class="review-card-body">').append(
          $('<p class="review-head">').append(
            $('<span class="stars">').text(starsText(review.rating)).attr('aria-label', review.rating + ' out of 5 stars'),
            $('<span class="muted small">').text(formatDate(review.created_at) + edited)
          ),
          $('<p class="review-comment">').text(review.comment),
          $('<div class="button-row">').append(
            $('<button type="button" class="button button-secondary button-small edit-review">').text('Edit'),
            $('<button type="button" class="button button-danger button-small delete-review">').text('Delete')
          )
        )
      )
    );
  });
}

// Inline edit: replace the body of this card with a form.
function showEditForm($card) {
  const review = findReview(Number($card.attr('data-id')));
  const textareaId = 'comment-' + review.id;
  const $textarea = $('<textarea name="comment" rows="4" maxlength="500">').attr('id', textareaId).val(review.comment);
  const $counter = $('<span class="counter" aria-live="polite">');

  const $form = $('<form class="form edit-form" novalidate>').append(
    $('<div class="field">').append(
      $('<span class="label">').text('Your rating'),
      buildStarPicker(review.rating),
      $('<p class="field-error" data-error-for="rating">')
    ),
    $('<div class="field">').append(
      $('<label>').attr('for', textareaId).text('Your comment'),
      $textarea,
      $('<div class="field-foot">').append($('<p class="field-error" data-error-for="comment">'), $counter)
    ),
    $('<div class="button-row">').append(
      $('<button type="submit" class="button">').text('Save changes'),
      $('<button type="button" class="button button-secondary cancel-edit">').text('Cancel')
    )
  );

  $card.find('.review-card-body').empty().append($form);
  setupCounter($textarea, $counter, 5, 500);
  $textarea.trigger('focus');
}

function saveEdit(event) {
  event.preventDefault();
  const $form = $(this);
  const id = Number($form.closest('.review-card').attr('data-id'));

  const data = {
    rating: Number($form.find('input[name="rating"]:checked').val()) || 0,
    comment: $form.find('textarea[name="comment"]').val().trim()
  };
  const errors = {
    rating: checkRating(data.rating),
    comment: checkComment(data.comment)
  };
  if (showFieldErrors($form, errors)) return;

  api('PUT', '/api/reviews/' + id, data)
    .done(function (result) {
      showMessage('#my-reviews-message', result.message, 'success');
      loadMyReviews();
    })
    .fail(function (xhr) {
      showMessage('#my-reviews-message', errorMessage(xhr), 'error');
    });
}

function deleteReview() {
  const id = Number($(this).closest('.review-card').attr('data-id'));
  const review = findReview(id);
  if (!confirm('Delete your review of ' + review.restaurant_name + '? This cannot be undone.')) return;

  api('DELETE', '/api/reviews/' + id)
    .done(function (result) {
      showMessage('#my-reviews-message', result.message, 'success');
      loadMyReviews();
    })
    .fail(function (xhr) {
      showMessage('#my-reviews-message', errorMessage(xhr), 'error');
    });
}
