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
