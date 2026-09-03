/**
 * Social share + copy-link handling for blog article pages.
 * Works on any domain since it builds links from the current page URL at runtime.
 */
(function () {
  function fallbackCopy(text, onSuccess) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      onSuccess();
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
    document.body.removeChild(textarea);
  }

  function copyText(text, onSuccess) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(function () {
        fallbackCopy(text, onSuccess);
      });
    } else {
      fallbackCopy(text, onSuccess);
    }
  }

  function openSharePopup(url) {
    window.open(url, 'share-window', 'width=600,height=520,noopener,noreferrer');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var containers = document.querySelectorAll('.share-buttons');

    containers.forEach(function (container) {
      var pageUrl = window.location.href.split('#')[0];
      var title = container.getAttribute('data-share-title') || document.title;
      var encodedUrl = encodeURIComponent(pageUrl);
      var encodedTitle = encodeURIComponent(title);

      var shareLinks = {
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
        twitter: 'https://twitter.com/intent/tweet?url=' + encodedUrl + '&text=' + encodedTitle,
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl,
        whatsapp: 'https://wa.me/?text=' + encodedTitle + '%20' + encodedUrl,
        telegram: 'https://t.me/share/url?url=' + encodedUrl + '&text=' + encodedTitle,
        email: 'mailto:?subject=' + encodedTitle + '&body=' + encodedUrl
      };

      var popupNetworks = ['facebook', 'twitter', 'linkedin', 'telegram'];

      container.querySelectorAll('[data-share]').forEach(function (btn) {
        var type = btn.getAttribute('data-share');

        if (type === 'copy') {
          btn.addEventListener('click', function () {
            var label = btn.querySelector('.copy-label');
            var icon = btn.querySelector('i');
            var originalLabel = label ? label.textContent : null;
            var originalIconClass = icon ? icon.className : null;

            copyText(pageUrl, function () {
              btn.classList.add('copied');
              if (label) { label.textContent = 'Link Copied!'; }
              if (icon) { icon.className = 'bi bi-check2'; }

              window.clearTimeout(btn._copyResetTimer);
              btn._copyResetTimer = window.setTimeout(function () {
                btn.classList.remove('copied');
                if (label && originalLabel !== null) { label.textContent = originalLabel; }
                if (icon && originalIconClass !== null) { icon.className = originalIconClass; }
              }, 2000);
            });
          });
          return;
        }

        var href = shareLinks[type];
        if (!href) { return; }
        btn.setAttribute('href', href);

        if (popupNetworks.indexOf(type) !== -1) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            openSharePopup(href);
          });
        }
        // whatsapp / email fall through to normal link behaviour (target="_blank" / mailto:)
      });
    });
  });
})();
