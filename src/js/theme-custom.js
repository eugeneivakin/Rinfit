// Function to clear selected sizes and lock button
function clearSizeSelectionAndDisableBuyBtn() {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has("variant")) {
    // Remove checked from radio inputs of size inside .product-info
    const sizeSwatches = document.querySelectorAll('.product-info .variant-picker__option[data-option-type="size"] input[type="radio"][checked]');
    if (sizeSwatches.length > 0) {
      sizeSwatches.forEach(function (input) {
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
}

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
    this.addEventListener('click', this._onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
  }

  _onClick(e) {
    if (this._loaded) return;
    this._loaded = true;
    const url = this.getAttribute('data-url');
    if (!url) {
      console.warn('No data-url attribute found on size-chart-button');
      return;
    }
    const sizeChartSelectors = [
      '.shopify-section--guide',
      '.shopify-section--size-calculator',
      // Add additional selectors here as needed
    ];
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        let found = false;
        let guideSection = null;
        let sizeCalculatorSection = null;
        // First we look for the necessary sections
        for (const selector of sizeChartSelectors) {
          const sections = doc.querySelectorAll(selector);
          if (sections.length > 0) {
            sections.forEach((section) => {
              if (section.classList.contains('shopify-section--guide')) {
                guideSection = section;
              }
              if (section.classList.contains('shopify-section--size-calculator')) {
                sizeCalculatorSection = section;
              }
            });
          }
        }
        // If both sections are found, move the size-calculator inside guide
        if (guideSection && sizeCalculatorSection) {
          // We are looking for a multi-column tag inside guideSection
          const multiColumn = guideSection.querySelector('multi-column');
          if (multiColumn) {
            // Clone sizeCalculatorSection for insertion
            const sizeCalculatorClone = sizeCalculatorSection.cloneNode(true);
            // Insert a clone after multi-column
            multiColumn.insertAdjacentElement('afterend', sizeCalculatorClone);
            // Removing the original from the DOM
            sizeCalculatorSection.remove();
          }
        }
        // Now we collect html for insertion
        const target = document.querySelector('[data-size-chart-page-content]');
        if (target) {
          let htmlContent = '';
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
                if (
                  !section.classList.contains('shopify-section--guide') &&
                  !section.classList.contains('shopify-section--size-calculator')
                ) {
                  htmlContent += section.outerHTML;
                }
              });
            }
          }
          target.innerHTML += htmlContent;
          found = true;
        }
        if (!found) {
          console.warn('Section for size chart not found by selectors:', sizeChartSelectors);
        }
      });
  }
}

if (!window.customElements.get("size-chart-button")) {
  customElements.define("size-chart-button", SizeChartButton);
}
