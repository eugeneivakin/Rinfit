// Function to clear selected sizes and lock button
function clearSizeSelectionAndDisableBuyBtn() {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has("variant")) {
    // Remove checked from radio inputs of size inside .product-info
    document.querySelectorAll('.product-info .variant-picker__option[data-option-type="size"] input[type="radio"][checked]').forEach(function (input) {
      input.removeAttribute("checked");
    });
    // Clearing the selected size option
    document.querySelectorAll('.product-info .variant-picker__option[data-option-type="size"] .variant-picker__selected-variant').forEach(function (el) {
      el.textContent = "";
    });
    // Deactivate the buy button if there is one
    var buyBtn = document.querySelector('.product-info .buy-buttons button[type="submit"]');
    if (buyBtn) {
      buyBtn.disabled = true;
      buyBtn.innerHTML = window.themeStrings.addedToCartDisabled;
      buyBtn.classList.add("buy-button--disabled");
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // attach a handler to all existing quick-buy-modals
  clearSizeSelectionAndDisableBuyBtn();
  document.querySelectorAll("quick-buy-modal").forEach(function (modal) {
    modal.addEventListener("dialog:after-show", function (e) {
      clearSizeSelectionAndDisableBuyBtn();
    });
  });
  // track the emergence of new quick-buy-modals via MutationObserver
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType === 1 && node.matches && node.matches("quick-buy-modal")) {
          node.addEventListener("dialog:after-show", function (e) {
            clearSizeSelectionAndDisableBuyBtn();
          });
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
