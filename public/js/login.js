// Owner: Yasin Shafiei
// Requirement: FR1 (log in)
// What it does: checks the login form, sends it to POST /api/auth/login, saves the session
// in localStorage, then goes to the "next" page or the home page for the user's role.

$(function () {
  const $form = $('#login-form');

  if (getQueryParam('next')) {
    showMessage('#login-message', 'Please log in to continue.', 'info');
  }

  $form.on('submit', function (event) {
    event.preventDefault();
    clearMessage('#login-message');

    const data = {
      email: $('#email').val().trim(),
      password: $('#password').val()
    };

    // 1. Check in the browser first (the server checks again).
    const errors = {
      email: checkEmail(data.email),
      password: checkRequired(data.password, 'Enter your password.')
    };
    if (showFieldErrors($form, errors)) return;

    // 2. Send it.
    const $button = $form.find('button[type="submit"]').prop('disabled', true);
    api('POST', '/api/auth/login', data)
      .done(function (result) {
        saveSession(result.token, result.user);
        showMessage('#login-message', 'Welcome back, ' + result.user.full_name + '!', 'success');
        setTimeout(function () {
          window.location.href = pageAfterLogin(result.user);
        }, 600);
      })
      .fail(function (xhr) {
        showMessage('#login-message', errorMessage(xhr), 'error');
        $button.prop('disabled', false);
      });
  });
});

// Where to go after logging in.
function pageAfterLogin(user) {
  const next = getQueryParam('next');
  // Only follow "next" if it is one of our own pages, e.g. "/restaurant.html?id=3",
  // so a link cannot send the user to another website.
  if (next && /^\/[\w-]+\.html(\?[\w=&%-]*)?$/.test(next)) return next;
  if (user.role === 'owner') return '/owner.html';
  if (user.role === 'admin') return '/admin.html';
  return '/index.html';
}
