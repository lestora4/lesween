(function () {
  'use strict';

  function qs(el, sel) {
    return el.querySelector(sel);
  }

  function setDisplay(el, value) {
    if (el) el.style.display = value;
  }

  document.querySelectorAll('form.ls-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var loadingEl = qs(form, '.loading');
      var errorEl = qs(form, '.error-message');
      var sentEl = qs(form, '.sent-message');
      var submitBtn = form.querySelector('button[type="submit"]');

      setDisplay(loadingEl, 'block');
      setDisplay(errorEl, 'none');
      setDisplay(sentEl, 'none');
      if (errorEl) errorEl.textContent = '';
      if (submitBtn) submitBtn.disabled = true;

      var formData = new FormData(form);
      var data = {};
      formData.forEach(function (value, key) {
        if (key.endsWith('[]')) {
          var cleanKey = key.slice(0, -2);
          if (!data[cleanKey]) data[cleanKey] = [];
          data[cleanKey].push(value);
        } else {
          data[key] = value;
        }
      });
      data.source = form.getAttribute('data-source') || document.title || 'Website';

      fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (response) {
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (json) {
              return { ok: response.ok, json: json };
            });
        })
        .then(function (result) {
          setDisplay(loadingEl, 'none');
          if (submitBtn) submitBtn.disabled = false;

          if (result.ok && result.json && result.json.ok) {
            setDisplay(sentEl, 'block');
            form.reset();
          } else {
            if (errorEl) {
              errorEl.textContent =
                (result.json && result.json.error) ||
                'Something went wrong. Please try again or WhatsApp us.';
              setDisplay(errorEl, 'block');
            }
          }
        })
        .catch(function () {
          setDisplay(loadingEl, 'none');
          if (submitBtn) submitBtn.disabled = false;
          if (errorEl) {
            errorEl.textContent =
              'Network error. Please check your connection and try again, or WhatsApp us.';
            setDisplay(errorEl, 'block');
          }
        });
    });
  });
})();
