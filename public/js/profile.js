// Owner: Yasin Shafiei
// Requirement: FR1 (manage profile: edit name and email, change password)
// What it does: loads the user from GET /api/auth/me, then saves the two forms with
// PUT /api/auth/profile and PUT /api/auth/password. (Log out is in the header, from common.js.)

$(function () {
  if (!requireLogin()) return;

  loadProfile();
  $('#details-form').on('submit', saveDetails);
  $('#password-form').on('submit', changePassword);
});

function loadProfile() {
  api('GET', '/api/auth/me')
    .done(function (data) {
      $('#full_name').val(data.user.full_name);
      $('#email').val(data.user.email);
      $('#profile-summary').text('Logged in as ' + data.user.email + ' · ' + data.user.role + ' account');
    })
    .fail(function (xhr) {
      showMessage('#details-message', errorMessage(xhr), 'error');
    });
}

function saveDetails(event) {
  event.preventDefault();
  const $form = $('#details-form');
  clearMessage('#details-message');

  const data = {
    full_name: $('#full_name').val().trim(),
    email: $('#email').val().trim()
  };
  const errors = {
    full_name: checkFullName(data.full_name),
    email: checkEmail(data.email)
  };
  if (showFieldErrors($form, errors)) return;

  api('PUT', '/api/auth/profile', data)
    .done(function (result) {
      // Keep the same token, but store the new name and email, and redraw the header.
      saveSession(getSession().token, result.user);
      renderHeader();
      $('#profile-summary').text('Logged in as ' + result.user.email + ' · ' + result.user.role + ' account');
      showMessage('#details-message', result.message, 'success');
    })
    .fail(function (xhr) {
      showMessage('#details-message', errorMessage(xhr), 'error');
    });
}

function changePassword(event) {
  event.preventDefault();
  const $form = $('#password-form');
  clearMessage('#password-message');

  const data = {
    current_password: $('#current_password').val(),
    new_password: $('#new_password').val()
  };
  const errors = {
    current_password: checkRequired(data.current_password, 'Enter your current password.'),
    new_password: checkPassword(data.new_password)
  };
  if (showFieldErrors($form, errors)) return;

  api('PUT', '/api/auth/password', data)
    .done(function (result) {
      $form[0].reset();
      showMessage('#password-message', result.message, 'success');
    })
    .fail(function (xhr) {
      showMessage('#password-message', errorMessage(xhr), 'error');
    });
}
