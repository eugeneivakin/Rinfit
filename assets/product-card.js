document.addEventListener('DOMContentLoaded', function () {
  // Utility: replace the last path segment in the URL with the new filename
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
      // fallback: simple string replacement before `?` or at the end
      return rawUrl.replace(/\/[^\/\?]+(?=(\?|$))/, '/' + newFileName);
    }
  }

  //Update primary image inside productCard by replacing filename
  function updatePrimaryImage(productCard, newFileName) {
    if (!productCard || !newFileName) return;
    const primaryImage = productCard.querySelector('.product-card__image--primary');
    if (!primaryImage) return;

    // Update src
    if (primaryImage.src) {
      const replaced = replaceFilenameInUrl(primaryImage.src, newFileName);
      primaryImage.src = replaced;
    }

    // Update srcset (if any) -carefully parse and replace individual URLs
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

  // Click and change handler for swatches
  document.addEventListener('click', function (event) {
    const target = event.target;

    //Click on label.color-swatch
    const label = target.closest('label.color-swatch');
    if (label) {
      const img = label.querySelector('img[data-file-name]');
      if (img && img.dataset.fileName) {
        const fileName = img.dataset.fileName;
        const productCard = label.closest('product-card, .product-card');
        updatePrimaryImage(productCard, fileName);
      }
      return; //if the click was on the label, we do nothing else
    }

    //Click on the show more button
    const btn = target.closest('button.color-swatch--show-more');
    if (btn) {
      btn.classList.toggle('active');
      return;
    }
  }, false);

  //Change handler on input (radio) -updates the image when switching
  document.addEventListener('change', function (event) {
    const el = event.target;
    if (el && el.matches && el.matches('input[type="radio"][data-option-position]')) {
      //find the label for this input
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
