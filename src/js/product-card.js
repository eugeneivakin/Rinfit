document.addEventListener('DOMContentLoaded', function () {
  // Utility: заменить последний сегмент пути в URL на новое имя файла
  function replaceFilenameInUrl(rawUrl, newFileName) {
    if (!rawUrl) return rawUrl;
    const prefix = rawUrl.startsWith('//') ? window.location.protocol : '';
    try {
      const u = new URL(rawUrl, prefix + window.location.origin);
      const parts = u.pathname.split('/');
      if (parts.length) parts[parts.length - 1] = newFileName;
      u.pathname = parts.join('/');
      return u.toString();
    } catch (e) {
      // fallback: простая строковая замена перед `?` или в конце
      return rawUrl.replace(/\/[^\/\?]+(?=(\?|$))/, '/' + newFileName);
    }
  }

  // Обновить primary image внутри productCard, заменив имя файла
  function updatePrimaryImage(productCard, newFileName) {
    if (!productCard || !newFileName) return;
    const primaryImage = productCard.querySelector('.product-card__image--primary');
    if (!primaryImage) return;

    // Обновляем src
    if (primaryImage.src) {
      const replaced = replaceFilenameInUrl(primaryImage.src, newFileName);
      primaryImage.src = replaced;
    }

    // Обновляем srcset (если есть) — аккуратно разбираем и заменяем отдельные URL'ы
    if (primaryImage.srcset) {
      const parts = primaryImage.srcset.split(',').map(s => s.trim());
      const newParts = parts.map(part => {
        const [url, descriptor] = part.split(/\s+/, 2);
        const newUrl = replaceFilenameInUrl(url, newFileName);
        return descriptor ? `${newUrl} ${descriptor}` : newUrl;
      });
      primaryImage.srcset = newParts.join(', ');
    }
  }

  // Обработчик кликов и change для свотчей
  document.addEventListener('click', function (event) {
    const target = event.target;

    // Клик по label.color-swatch
    const label = target.closest('label.color-swatch');
    if (label) {
      const img = label.querySelector('img[data-file-name]');
      if (img && img.dataset.fileName) {
        const fileName = img.dataset.fileName;
        const productCard = label.closest('product-card, .product-card');
        updatePrimaryImage(productCard, fileName);
      }
      return; // если клик был по label, ничего больше не делаем
    }

    // Клик по кнопке показать ещё
    const btn = target.closest('button.color-swatch--show-more');
    if (btn) {
      btn.classList.toggle('active');
      return;
    }
  }, false);

  // Обработчик change на input (радио) — обновляет изображение при переключении
  document.addEventListener('change', function (event) {
    const el = event.target;
    if (el && el.matches && el.matches('input[type="radio"][data-option-position]')) {
      // найти label для этого input
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) {
        const img = label.querySelector('img[data-file-name]');
        if (img && img.dataset.fileName) {
          const fileName = img.dataset.fileName;
          const productCard = el.closest('product-card, .product-card');
          updatePrimaryImage(productCard, fileName);
        }
      }
    }
  }, false);
});
