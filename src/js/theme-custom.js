function querySelectorAllDeep(selector, root = document) {
  const result = [];

  if (root.querySelectorAll) {
    result.push(...root.querySelectorAll(selector));
    root.querySelectorAll("*").forEach((node) => {
      if (node.shadowRoot) {
        result.push(...querySelectorAllDeep(selector, node.shadowRoot));
      }
    });
  }

  return result;
}

function escapeCssValue(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }

  return String(value).replace(/"/g, '\\"');
}

function getBuyButtonForVariantPicker(variantPicker) {
  const contextRoot = variantPicker.closest("product-rerender") || variantPicker.closest("quick-buy-modal") || variantPicker.closest("form") || variantPicker;

  return querySelectorAllDeep('.buy-buttons button[type="submit"]', contextRoot)[0] || null;
}

function updateBuyButtonStateForVariantPicker(variantPicker) {
  const sizeOptionBlocks = querySelectorAllDeep('.variant-picker__option[data-option-type*="size"]', variantPicker);
  if (sizeOptionBlocks.length === 0) return;

  const isEverySizeSelected = sizeOptionBlocks.every((sizeOptionBlock) => {
    return querySelectorAllDeep('input[type="radio"]:checked', sizeOptionBlock).length > 0;
  });

  const buyBtn = getBuyButtonForVariantPicker(variantPicker);
  if (!buyBtn) return;

  if (!buyBtn.dataset.originalLabel) {
    buyBtn.dataset.originalLabel = buyBtn.innerHTML;
  }

  if (isEverySizeSelected) {
    buyBtn.disabled = false;
    buyBtn.classList.remove("buy-button--disabled");
    buyBtn.innerHTML = buyBtn.dataset.originalLabel;
  } else {
    buyBtn.disabled = true;
    buyBtn.classList.add("buy-button--disabled");
    if (window.themeStrings?.addedToCartDisabled) {
      buyBtn.innerHTML = window.themeStrings.addedToCartDisabled;
    }
  }
}

function getQuickBuyRerenderScope(node) {
  const rerenderScope = node?.closest?.("product-rerender");
  if (!rerenderScope) return null;
  if (!rerenderScope.closest("quick-buy-modal")) return null;

  return rerenderScope;
}

function getQuickBuySelectedSizePositions(rerenderScope) {
  const rawValue = rerenderScope?.dataset.quickBuySelectedSizePosition || "";

  return rawValue
    .split(",")
    .map((position) => position.trim())
    .filter(Boolean);
}

function setQuickBuySelectedSizePositions(rerenderScope, positions) {
  if (!rerenderScope) return;

  const uniquePositions = Array.from(new Set((positions || []).filter(Boolean)));

  if (uniquePositions.length === 0) {
    delete rerenderScope.dataset.quickBuySelectedSizePosition;
    return;
  }

  rerenderScope.dataset.quickBuySelectedSizePosition = uniquePositions.join(",");
}

function rememberQuickBuySizePosition(sizeInput) {
  const rerenderScope = getQuickBuyRerenderScope(sizeInput);
  if (!rerenderScope) return;

  const sizeOptionBlock = sizeInput.closest('.variant-picker__option[data-option-type*="size"]');
  if (!sizeOptionBlock) return;

  const sizeOptionPosition = sizeOptionBlock.getAttribute("data-option-position") || "";
  if (!sizeOptionPosition) return;

  const selectedPositions = getQuickBuySelectedSizePositions(rerenderScope);
  if (!selectedPositions.includes(sizeOptionPosition)) {
    selectedPositions.push(sizeOptionPosition);
  }

  setQuickBuySelectedSizePositions(rerenderScope, selectedPositions);
}

function resetSizeOptionsForVariantPicker(variantPicker) {
  const sizeOptionBlocks = querySelectorAllDeep('.variant-picker__option[data-option-type*="size"]', variantPicker);
  if (sizeOptionBlocks.length === 0) return;

  const rerenderScope = getQuickBuyRerenderScope(variantPicker);
  const selectedQuickBuySizePositions = getQuickBuySelectedSizePositions(rerenderScope);

  sizeOptionBlocks.forEach((sizeOptionBlock) => {
    const blockPosition = sizeOptionBlock.getAttribute("data-option-position") || "";
    const shouldPreserveByQuickBuyMarker = selectedQuickBuySizePositions.includes(blockPosition);

    querySelectorAllDeep('input[type="radio"]', sizeOptionBlock).forEach((input) => {
      if (shouldPreserveByQuickBuyMarker) {
        const shouldStayChecked = input.checked || input.hasAttribute("checked") || input.hasAttribute("data-manually");

        if (shouldStayChecked) {
          input.checked = true;
          input.setAttribute("checked", "checked");
          input.setAttribute("data-manually", "true");
        } else {
          input.checked = false;
          input.removeAttribute("checked");
          input.removeAttribute("data-manually");
        }

        return;
      }

      const shouldPreserve = input.hasAttribute("data-manually");

      if (shouldPreserve) {
        input.checked = true;
        input.setAttribute("checked", "checked");
      } else {
        input.checked = false;
        input.removeAttribute("checked");
      }
    });

    const hasSelectedInBlock = querySelectorAllDeep('input[type="radio"]:checked', sizeOptionBlock).length > 0;
    if (!hasSelectedInBlock) {
      querySelectorAllDeep(".variant-picker__selected-variant", sizeOptionBlock).forEach((el) => {
        el.textContent = "";
      });
    }
  });

  updateBuyButtonStateForVariantPicker(variantPicker);
}

function processAllVariantPickers(scopeRoot = document) {
  querySelectorAllDeep("variant-picker", scopeRoot).forEach((variantPicker) => {
    resetSizeOptionsForVariantPicker(variantPicker);
  });
}

function getVariantPickersForFormId(formId) {
  if (!formId) return [];

  let rerenderScopes = querySelectorAllDeep(`product-rerender[observe-form="${escapeCssValue(formId)}"]`);
  if (rerenderScopes.length === 0) {
    rerenderScopes = querySelectorAllDeep("product-rerender");
  }

  let variantPickers = [];
  rerenderScopes.forEach((scope) => {
    variantPickers.push(...querySelectorAllDeep("variant-picker", scope));
  });

  if (variantPickers.length === 0) {
    variantPickers = querySelectorAllDeep(`variant-picker[form-id="${escapeCssValue(formId)}"]`);
  }

  return variantPickers;
}

function runSizeResetForFormId(formId) {
  const variantPickers = getVariantPickersForFormId(formId);

  variantPickers.forEach((variantPicker) => {
    resetSizeOptionsForVariantPicker(variantPicker);
  });
}

function onVariantPickerChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.type !== "radio") return;

  const variantPicker = target.closest("variant-picker");
  if (!variantPicker) return;
  const form = target.form || target.closest("form");
  if (!form) return;

  // Mark only the option actually chosen by user for this option group.
  Array.from(form.elements).forEach((item) => {
    if (!(item instanceof HTMLInputElement)) return;
    if (item.type !== "radio") return;
    if (!item.matches("input[data-option-position]")) return;
    if (item.name !== target.name) return;
    item.removeAttribute("data-manually");
  });
  target.setAttribute("data-manually", "true");

  const isSizeOption = Boolean(target.closest('.variant-picker__option[data-option-type*="size"]'));

  if (!isSizeOption) {
    return;
  }

  rememberQuickBuySizePosition(target);

  if (!target.checked) return;

  updateBuyButtonStateForVariantPicker(variantPicker);
}

document.addEventListener("change", onVariantPickerChange, true);

function onVariantChanged(event) {
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  const formId = form?.id || event.detail?.formId || null;

  runSizeResetForFormId(formId);
}

document.addEventListener("variant:change", onVariantChanged);

function onProductRerender(event) {
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  const formId = form?.id || null;
  if (!formId) return;

  // Wait one tick so replaced nodes are in DOM before scanning.
  setTimeout(() => {
    runSizeResetForFormId(formId);
  }, 0);
}

document.addEventListener("product:rerender", onProductRerender);

function onProductRerenderFull(event) {
  const rerenderElement = event.target;
  const quickBuyModal = rerenderElement.closest("quick-buy-modal");
  if (!quickBuyModal) return;

  // Wait one tick so replaced nodes are fully painted before scanning.
  setTimeout(() => {
    processAllVariantPickers(rerenderElement);
  }, 0);
}

document.addEventListener("product:rerender:full", onProductRerenderFull);

function setupQuickBuySizeReset() {
  querySelectorAllDeep("quick-buy-modal").forEach((quickBuyModal) => {
    if (quickBuyModal.dataset.sizeResetAttached === "true") return;

    quickBuyModal.dataset.sizeResetAttached = "true";

    let mutationTimerId = null;
    const scheduleModalRecheck = (reason) => {
      if (mutationTimerId) {
        clearTimeout(mutationTimerId);
      }

      mutationTimerId = setTimeout(() => {
        processAllVariantPickers(quickBuyModal);
        mutationTimerId = null;
      }, 0);
    };

    quickBuyModal.addEventListener("dialog:after-show", () => {
      scheduleModalRecheck("dialog:after-show");
    });

    const observer = new MutationObserver((mutationList) => {
      const hasStructuralChanges = mutationList.some(
        (mutation) => mutation.type === "childList" && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0),
      );

      if (hasStructuralChanges) {
        scheduleModalRecheck("mutation");
      }
    });

    observer.observe(quickBuyModal, { childList: true, subtree: true });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  processAllVariantPickers(document);
  setupQuickBuySizeReset();
});

class SizeCalculator extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // We are waiting for the button and elements to appear inside the component
    const waitForElements = () => {
      const button = this.querySelector("button.button");
      const unitElem = this.querySelector("[data-unit]");
      const typeElem = this.querySelector("[data-type]");
      const valueElem = this.querySelector("[data-value]");
      const resultDiv = this.querySelector("[data-result]");
      if (button && unitElem && typeElem && valueElem && resultDiv) {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          this.calculateSize();
        });
      } else {
        setTimeout(waitForElements, 100);
      }
    };
    waitForElements();
  }

  calculateSize() {
    const unitElem = this.querySelector("[data-unit]");
    const typeElem = this.querySelector("[data-type]");
    const valueElem = this.querySelector("[data-value]");
    const resultDiv = this.querySelector("[data-result]");

    if (!unitElem || !typeElem || !valueElem || !resultDiv) return;

    const unit = unitElem.value;
    const type = typeElem.value;
    const value = parseFloat(valueElem.value);

    if (isNaN(value)) {
      resultDiv.textContent = "Please enter a number.";
      return;
    }

    const key = type === "diameter" ? (unit === "mm" ? "dia_mm" : "dia_in") : unit === "mm" ? "cir_mm" : "cir_in";

    let closest = null;
    let minDiff = Infinity;
    (window.ringData || []).forEach((r) => {
      const diff = Math.abs(r[key] - value);
      if (diff < minDiff) {
        minDiff = diff;
        closest = r;
      }
    });

    if (closest) {
      resultDiv.innerHTML = `
        <h3>${window.themeStrings.sizeCalculatorHeading}: ${closest.size}</h3>
        <p>${window.themeStrings.sizeCalculatorMeasurementType1}: ${closest.dia_mm} mm (${closest.dia_in} inches)</p>
        <p>${window.themeStrings.sizeCalculatorMeasurementType2}: ${closest.cir_mm} mm (${closest.cir_in} inches)</p>
      `;
    } else {
      resultDiv.innerHTML = `
        <p>Size not found, please check the size chart and try again.</p>
      `;
    }
  }
}

if (!window.customElements.get("size-calculator")) {
  customElements.define("size-calculator", SizeCalculator);
}

class SizeChartButton extends HTMLElement {
  constructor() {
    super();
    this._onClick = this._onClick.bind(this);
    this._loaded = false;
  }

  connectedCallback() {
    this.addEventListener("click", this._onClick);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this._onClick);
  }

  _onClick(e) {
    if (this._loaded) return;
    this._loaded = true;
    const url = this.getAttribute("data-url");
    if (!url) {
      console.warn("No data-url attribute found on size-chart-button");
      return;
    }
    const sizeChartSelectors = [
      ".shopify-section--guide",
      ".shopify-section--size-calculator",
      // Add additional selectors here as needed
    ];
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        let found = false;
        let guideSection = null;
        let sizeCalculatorSection = null;
        // First we look for the necessary sections
        for (const selector of sizeChartSelectors) {
          const sections = doc.querySelectorAll(selector);
          if (sections.length > 0) {
            sections.forEach((section) => {
              if (section.classList.contains("shopify-section--guide")) {
                guideSection = section;
              }
              if (section.classList.contains("shopify-section--size-calculator")) {
                sizeCalculatorSection = section;
              }
            });
          }
        }
        // If both sections are found, move the size-calculator inside guide
        if (guideSection && sizeCalculatorSection) {
          // We are looking for a multi-column tag inside guideSection
          const multiColumn = guideSection.querySelector("multi-column");
          if (multiColumn) {
            // Clone sizeCalculatorSection for insertion
            const sizeCalculatorClone = sizeCalculatorSection.cloneNode(true);
            // Insert a clone after multi-column
            multiColumn.insertAdjacentElement("afterend", sizeCalculatorClone);
            // Removing the original from the DOM
            sizeCalculatorSection.remove();
          }
        }
        // Now we collect html for insertion
        const targets = document.querySelectorAll("[data-size-chart-page-content]");
        if (targets.length > 0) {
          let htmlContent = "";
          // Add guideSection (if found)
          if (guideSection) {
            // Updating header
            // const header = guideSection.querySelector('.section-header h2');
            // if (header) {
            //   const modal = target.closest('.modal');
            //   if (modal) {
            //     const headerSpan = modal.querySelector('span.h2[slot="header"]');
            //     if (headerSpan) {
            //       headerSpan.innerHTML = header.outerHTML;
            //     }
            //   }
            // }
            htmlContent += guideSection.outerHTML;
          }
          // If guideSection is not found, add the remaining sections
          for (const selector of sizeChartSelectors) {
            const sections = doc.querySelectorAll(selector);
            if (sections.length > 0) {
              sections.forEach((section) => {
                // Add only those that have not been moved
                if (!section.classList.contains("shopify-section--guide") && !section.classList.contains("shopify-section--size-calculator")) {
                  htmlContent += section.outerHTML;
                }
              });
            }
          }
          // Add content to all targets
          targets.forEach((target) => {
            target.innerHTML += htmlContent;
          });
          found = true;
        }
        if (!found) {
          console.warn("Section for size chart not found by selectors:", sizeChartSelectors);
        }
      });
  }
}

if (!window.customElements.get("size-chart-button")) {
  customElements.define("size-chart-button", SizeChartButton);
}

class BundleFrequently extends HTMLElement {
  constructor() {
    super();
    this._onRemoveClick = this._onRemoveClick.bind(this);
  }

  connectedCallback() {
    this.addEventListener("click", this._onRemoveClick);
    this._setupVariantImageSwitcher();
  }

  disconnectedCallback() {
    this.removeEventListener("click", this._onRemoveClick);
  }

  _setupVariantImageSwitcher() {
    this.querySelectorAll("product-card").forEach((card) => {
      const select = card.querySelector("select[data-variants]");
      if (!select) return;
      select.addEventListener("change", function () {
        const selectedOption = select.options[select.selectedIndex];
        if (!selectedOption) return;
        const imageUrl = selectedOption.getAttribute("image-url");
        if (!imageUrl) return;
        // Update src and srcset of the image
        const img = card.querySelector(".product-card__image--primary");
        if (img) {
          img.src = imageUrl;
          img.srcset = imageUrl;
        }
      });
    });
  }

  _onRemoveClick(e) {
    const removeBtn = e.target.closest("[data-remove-from-bundle]");
    if (removeBtn && this.contains(removeBtn)) {
      const productCard = removeBtn.closest(".product-card");
      if (productCard) {
        productCard.remove();
        this._recalculateTotal();
      }
    }
  }

  _recalculateTotal() {
    // We collect all the remaining cards with data-price
    const productCards = this.querySelectorAll(".product-card[data-price]");
    let total = 0;
    productCards.forEach((card) => {
      let priceStr = card.getAttribute("data-price");
      if (priceStr) {
        // Remove all characters except numbers, periods and commas
        priceStr = priceStr.replace(/[^\d.,]/g, "");
        // Replace the comma with a dot, if any.
        priceStr = priceStr.replace(",", ".");
        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          total += price;
        }
      }
    });

    // Checking for the presence of a product-card with data-position="0"
    const hasMainProduct = !!this.querySelector('.product-card[data-position="0"]');

    // Getting the discount percentage from data-discount-value
    let discountPercent = 0;
    const discountAttr = this.getAttribute("data-discount-value");
    if (discountAttr) {
      discountPercent = parseFloat(discountAttr);
      if (isNaN(discountPercent)) discountPercent = 0;
    }

    // We calculate the discounted amount only if there is a main product
    let saleTotal = total;
    if (hasMainProduct && discountPercent > 0 && discountPercent < 100) {
      saleTotal = total * (1 - discountPercent / 100);
    } else {
      saleTotal = total;
    }

    // Update compare-at-price and sale-price inside data-price-total
    const priceTotal = this.querySelector("[data-price-total]");
    if (priceTotal) {
      const compareAt = priceTotal.querySelector("compare-at-price");
      const salePrice = priceTotal.querySelector("sale-price");
      if (hasMainProduct && discountPercent > 0 && discountPercent < 100) {
        // Discount applies: we show both prices and class
        if (compareAt) {
          compareAt.innerHTML = `$${total.toFixed(2)}`;
          compareAt.style.display = "";
        }
        if (salePrice) {
          salePrice.innerHTML = `$${saleTotal.toFixed(2)}`;
          salePrice.classList.add("text-on-sale");
        }
      } else {
        // The discount does not apply: we remove compare-at-price and the text-on-sale class
        if (compareAt) {
          compareAt.remove();
        }
        if (salePrice) {
          salePrice.innerHTML = `$${saleTotal.toFixed(2)}`;
          salePrice.classList.remove("text-on-sale");
        }
      }
    }
  }
}

if (!window.customElements.get("bundle-frequently")) {
  customElements.define("bundle-frequently", BundleFrequently);
}
