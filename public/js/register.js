// Owner: Yasin Shafiei
// Requirement: FR1 (create an account)
// What it does: checks the sign-up form, sends it to POST /api/auth/register,
// saves the new session, then opens the right page for a customer or an owner.

$(function () {
  const $form = $('#register-form');

  $form.on('submit', function (event) {
    event.preventDefault();
    clearMessage('#register-message');

    const data = {
      full_name: $('#full_name').val().trim(),
      email: $('#email').val().trim(),
      password: $('#password').val(),
      role: $form.find('input[name="role"]:checked').val() || ''
    };

    // Same rules as the server (utils/validate.js checkRegister).
    const errors = {
      full_name: checkFullName(data.full_name),
      email: checkEmail(data.email),
      password: checkPassword(data.password),
      role: checkRegisterRole(data.role)
    };
    if (showFieldErrors($form, errors)) return;

    const $button = $form.find('button[type="submit"]').prop('disabled', true);
    api('POST', '/api/auth/register', data)
      .done(function (result) {
        saveSession(result.token, result.user);
        showMessage('#register-message', 'Your account is ready. Welcome to Sahaan, ' + result.user.full_name + '!', 'success');
        setTimeout(function () {
          window.location.href = result.user.role === 'owner' ? '/owner.html' : '/index.html';
        }, 900);
      })
      .fail(function (xhr) {
        showMessage('#register-message', errorMessage(xhr), 'error');
        $button.prop('disabled', false);
      });
  });
});
