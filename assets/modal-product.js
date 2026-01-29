let clicked = false;

document.addEventListener("click", (e) => {
  const form = e.target.closest(".modal-add-to-cart-form");
  if (!clicked && e.target.closest(".modal-buy-button-cart")) {
    e.preventDefault();
    
    if (form) {
      const formData = new FormData(form);

      fetch("/cart/add.js", {
        method: "POST",
        body: formData,
      })
      .then(res => {
        if (!res.ok) throw new Error("Помилка запиту");
        return res.json();
      })
      .then(() => {
        return fetch("/cart.js", {
        headers: { "Accept": "application/json" }
      });
    })
    .then(res => res.json())
    .then(cart => {
      document.querySelectorAll(".cart-count").forEach(el => {
        el.textContent = cart.item_count;
      });
    
      const event = new CustomEvent("cart:refresh", { detail: cart });
      document.dispatchEvent(event);
      
      const cartDrawer = document.querySelector("cart-drawer-component");
      if (cartDrawer?.hasAttribute("auto-open")) {
        cartDrawer.open();
      }
    })
    .then(data => {
      const closeBtn = document.querySelector(".close-modal");
      if (closeBtn) {
        closeBtn.click(); 
      }

      const cartTrigger = document.querySelector('a[aria-controls="cart-drawer"]');      
      if (cartTrigger) {
        cartTrigger.click();
      }
    })
    .catch(err => console.error("Помилка:", err));
  }
  clicked = true;
}
  clicked = false;
});

document.addEventListener("DOMContentLoaded", function () {
  function debounce(func, wait = 100) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  document.querySelectorAll(".conatiner-collection-main").forEach(container => {
    const swiperEl = container.querySelector(".main-collection-swiper-js");
    if (!swiperEl || swiperEl.classList.contains("swiper-initialized")) return;

    const sectionClass = Array.from(container.classList).find(c => c.startsWith("section-"));
    const sectionId = sectionClass ? sectionClass.replace("section-", "") : "";

    const nextBtn = container.querySelector(`.button-next-collection-${sectionId}`);
    const prevBtn = container.querySelector(`.button-prev-collection-${sectionId}`);
    const paginationEl = swiperEl.querySelector(`.swiper-pagination-${sectionId}`);

    const swiper = new Swiper(swiperEl, {
      slidesPerView: 'auto',
      spaceBetween: 10,
      watchOverflow: true,
      pagination: {
        el: paginationEl,
        clickable: true,
      },
      navigation: {
        nextEl: nextBtn,
        prevEl: prevBtn,
      },
      on: {
        init: updateUI,
        resize: updateUI
      }
    });

    function updateUI() {
      const wrapperWidth = swiperEl.querySelector('.swiper-wrapper').scrollWidth;
      const containerWidth = swiperEl.clientWidth;
      const windowWidth = window.innerWidth;

      if (paginationEl) {
        if (paginationEl.scrollWidth > paginationEl.clientWidth) {
          paginationEl.classList.add("overflowed");
        } else {
          paginationEl.classList.remove("overflowed");
        }
      }

      if (wrapperWidth <= containerWidth) {
        swiperEl.classList.add('no-scroll'); 
      } else {
        swiperEl.classList.remove('no-scroll'); 
      }

      if (windowWidth < 768 || wrapperWidth <= containerWidth) {
        nextBtn.style.display = 'none';
        prevBtn.style.display = 'none';
      } else {
        nextBtn.style.display = 'flex';
        prevBtn.style.display = 'flex';
      }
    }

    window.addEventListener('resize', debounce(updateUI, 150));

    updateUI();

    swiperEl.classList.add("swiper-initialized");
  });
});

document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll('.product-card').forEach(card => {
    const mainImg = card.querySelector('.main-product-image'); 
    const variantInput = card.querySelector('.variant-input'); 
    const variantThumbs = card.querySelectorAll('.variant-thumb');

    variantThumbs.forEach(btn => btn.classList.add('no-swiping'));

    variantThumbs.forEach((btn, index) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); 

        const imgSrc = btn.dataset.image; 
        if (mainImg) mainImg.src = imgSrc; 

        const variantId = btn.dataset.variantId;
        if (variantInput) variantInput.value = variantId;

        variantThumbs.forEach(b => b.classList.remove('ring-2', 'ring-black'));
        btn.classList.add('ring-2', 'ring-black');
      });

      if (index === 0 && variantInput) {
        variantInput.value = btn.dataset.variantId;
      }
    });

    const showMoreBtn = card.querySelector('.show-more-variants');
    if (showMoreBtn) {
      showMoreBtn.addEventListener('click', () => {
        card.querySelectorAll('.hidden-variant').forEach(el => el.classList.remove('hidden-variant'));
        showMoreBtn.remove();
      });
    }
  });
});



document.addEventListener("DOMContentLoaded", () => {

  const formatMoney = cents => "$" + (cents / 100).toFixed(2);

  const getCoreFromVariant = src => {
    const fileName = src.split("/").pop().split("?")[0];
    return fileName.replace(/_100x100\.(jpg|png|webp)$/i, "");
  };

  const getCoreFromSlide = src => {
    const fileName = src.split("/").pop().split("?")[0];
    return fileName.replace(/_400x\.(jpg|png|webp)$/i, "");
  };
  
  function setupQuantityControls(modal, qtyInput, hiddenQtyInput, modalPrice) {
    const updatePrice = () => {
      let val = parseInt(qtyInput.value) || 1;
      let price = parseInt(qtyInput.dataset.currentPrice || 0);
      modalPrice.textContent = formatMoney(price * val);
      modal.querySelector(".modal-product-price-text").textContent = formatMoney(price * val);
      hiddenQtyInput.value = val;
    };
    
    modal.querySelectorAll(".qty-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        let val = parseInt(qtyInput.value) || 1;
        if (btn.dataset.action === "increase") val++;
        else if (btn.dataset.action === "decrease" && val > 1) val--;
        qtyInput.value = val;
        updatePrice();
      });
    });

  qtyInput.addEventListener("input", updatePrice);
}

function updateModal(modal, productData) {
  const detailsLink = modal.querySelector(".modal-more-details");
  if (detailsLink) {
    detailsLink.href = `/products/${productData.handle}`;
  }
  
  const modalContent = modal.querySelector(".modal-content");
  const addToCartBtn = modalContent.querySelector(".modal-buy-button-cart");
  const chooseSizeBtn = modalContent.querySelector(".modal-chose-size-cart");
  
  if (addToCartBtn && chooseSizeBtn) {
    addToCartBtn.style.display = "none";
    chooseSizeBtn.style.display = "inline-block";
  } 
  
  let imageInput = modalContent.querySelector("input[name='image']");
  if (!imageInput) {
    imageInput = document.createElement("input");
    imageInput.type = "hidden";
    imageInput.name = "image";
    modalContent.querySelector("form").appendChild(imageInput);
  }
    
  const modalTitle = modalContent.querySelector(".modal-product-title");
  const imagesWrapper = modalContent.querySelector(".modal-images-container");
  const variantsContainer = modalContent.querySelector(".modal-variants-container");
  const modalPrice = modalContent.querySelector(".modal-product-price");
  const modalComparePrice = modalContent.querySelector(".modal-product-compare-price");
  const qtyInput = modalContent.querySelector("input[name='quantity']");
  const hiddenQtyInput = modalContent.querySelector("input[name='quantity'][type='hidden']");
  const hiddenInput = modalContent.querySelector("input[name='id']");
  const option1Input = modalContent.querySelector("input[name='option1']");
  const option2Input = modalContent.querySelector("input[name='option2']");



  modalTitle.textContent = productData.title;
  modalTitle.href = `/products/${productData.handle}`;


  modal.querySelector(".close-modal-collection-products")?.addEventListener("click", closeModal);
  const option1Block = modalContent.querySelector(".option1-size").closest(".modal-size-buttons");
  const option2Block = modalContent.querySelector(".option2-size").closest(".modal-size-buttons");
  const singleBlock = modalContent.querySelector(".modal-size-buttons:not(:has(.option1-size)):not(:has(.option2-size))");

  const option1Wrapper = modalContent.querySelector(".option1-size");
  const option2Wrapper = modalContent.querySelector(".option2-size");
  const singleWrapper = singleBlock.querySelector(".size-buttons-wrapper");

  option1Wrapper.innerHTML = "";
  option2Wrapper.innerHTML = "";
  singleWrapper.innerHTML = "";

  const option1Values = [
    ...new Set(productData.variants.map(v => !isNaN(Number(v.option1)) ? v.option1 : null).filter(Boolean))
  ];
  const option2Values = [
    ...new Set(productData.variants.map(v => !isNaN(Number(v.option2)) ? v.option2 : null).filter(Boolean))
  ];
  
  const hasNumericOption1 = option1Values.length > 0;
  const hasNumericOption2 = option2Values.length > 0;

  if (hasNumericOption1 && hasNumericOption2) {
      
    option1Block.style.display = "block";
    option2Block.style.display = "block";
    singleBlock.style.display = "none";

    option1Values.forEach(size => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "size-button px-3 py-1 border rounded text-sm hover:bg-gray-100";
      btn.textContent = size;
      btn.dataset.size = size;
      btn.dataset.option = "option1";
      option1Wrapper.appendChild(btn);
    });

    option2Values.forEach(size => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "size-button px-3 py-1 border rounded text-sm hover:bg-gray-100";
      btn.textContent = size;
      btn.dataset.size = size;
      btn.dataset.option = "option2";
      option2Wrapper.appendChild(btn);
    });

  } else if (hasNumericOption1 && !hasNumericOption2) {
    
    option1Block.style.display = "none";
    option2Block.style.display = "none";
    singleBlock.style.display = "block";

    option1Values.forEach(size => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "size-button px-3 py-1 border rounded text-sm hover:bg-gray-100";
      btn.textContent = size;
      btn.dataset.size = size;
      btn.dataset.option = "option1";
      singleWrapper.appendChild(btn);
    });
  
  } else {
      
    option1Block.style.display = "none";
    option2Block.style.display = "none";
    singleBlock.style.display = "block";

    const optionValues = [
      ...new Set(productData.variants.map(v => v.option2).filter(Boolean))
    ];

    optionValues.forEach(size => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "size-button px-3 py-1 border rounded text-sm hover:bg-gray-100";
      btn.textContent = size.replace(/\D/g, "");
      btn.dataset.size = size;
      btn.dataset.option = "option1";
      singleWrapper.appendChild(btn);
    });
  }

  const sizeButtons = modalContent.querySelectorAll(".size-button");
  let currentVariantPrice = 0;

    var mainOption1 = false;
    var mainOption2 = false;

    sizeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const parentWrapper = btn.closest(".size-buttons-wrapper");
        
        parentWrapper.querySelectorAll(".size-button").forEach(b => b.classList.remove("active-size-main"));
        btn.classList.add("active-size-main");
        
        const selectedSize = btn.dataset.size;   
        const optionType = btn.dataset.option;  
        const productHasNumericOption1 = productData.variants.some(v => !isNaN(Number(v.option1)));
        
        if (productHasNumericOption1) {
          if (optionType === "option1") {
            const sizeValue1 = document.querySelector(".main-modal-first-size")
            sizeValue1.textContent = btn.dataset.size;
            mainOption1 = true;
            option1Input.value = selectedSize;
          } else if (optionType === "option2") {
            const sizeValue2 = document.querySelector(".main-modal-second-size")
            sizeValue2.textContent = btn.dataset.size;
            mainOption2 = true;
            option2Input.value = selectedSize;
          }
        } else {
          mainOption1 = true;
          mainOption2 = true;
          
          const sizeValue = document.querySelector(".main-modal-size")
          sizeValue.textContent = btn.dataset.size.replace(/\D/g, "");
      
          option2Input.value = selectedSize;
        }
        if(mainOption1 && mainOption2){
          if (addToCartBtn && chooseSizeBtn) {
            addToCartBtn.style.display = "inline-block";
            chooseSizeBtn.style.display = "none";
          }
        }
        
        const normalize = val => (!isNaN(Number(val)) ? Number(val) : val);
        
        const selectedVariant = productData.variants.find(v =>
          normalize(v.option1) === normalize(option1Input.value) &&
          normalize(v.option2) === normalize(option2Input.value)
        );
        
        if (selectedVariant) {
          hiddenInput.value = selectedVariant.id;
          currentVariantPrice = selectedVariant.price;
          qtyInput.dataset.currentPrice = selectedVariant.price;
          
          modalPrice.textContent = formatMoney(currentVariantPrice * (parseInt(qtyInput.value) || 1));
          hiddenQtyInput.value = qtyInput.value;
          
          if (selectedVariant.compare_at_price && selectedVariant.compare_at_price > selectedVariant.price) {
            modalComparePrice.textContent = formatMoney(selectedVariant.compare_at_price * parseInt(qtyInput.value));
            modalComparePrice.style.display = "inline";
          } else {
            modalComparePrice.style.display = "none";
          }
          
          if (addToCartBtn && currentVariantPrice) {
            const qty = parseInt(qtyInput.value) || 1;
            addToCartBtn.querySelector(".modal-product-price-text").textContent = formatMoney(currentVariantPrice * qty);
          }
          
          let optionsToSend = {
            option1: !isNaN(Number(selectedVariant.option1)) 
            ? Number(selectedVariant.option1) 
            : (selectedVariant.option1 || ""),
            option2: selectedVariant.option2 || "",
            image: selectedVariant.featured_image?.src || ""
          };
          
          if (!productHasNumericOption1) {
            optionsToSend.option2 = selectedSize;
            option2Input.value = selectedSize;
          }
          
          imageInput.value = optionsToSend.image;
        }
      });
      
      function selectFirstVariant() {
        let firstVariant = productData.variants[0];
        if (!firstVariant) return;
        
        const hiddenInput = modal.querySelector("input[name='id']");
        const option1Input = modal.querySelector("input[name='option1']");
        const option2Input = modal.querySelector("input[name='option2']");
        const imageInput = modal.querySelector("input[name='image']");
        const modalPrice = modal.querySelector(".modal-product-price");
        const hiddenQtyInput = modal.querySelector("input[name='quantity'][type='hidden']");
        const qtyInput = modal.querySelector("input[name='quantity']");
        
        hiddenInput.value = firstVariant.id;
        option1Input.value = firstVariant.option1 || "";
        option2Input.value = firstVariant.option2 || "";
        imageInput.value = firstVariant.featured_image?.src || "";
        
        const qty = parseInt(qtyInput.value) || 1;
        modalPrice.textContent = "$" + (firstVariant.price * qty / 100).toFixed(2);
        qtyInput.dataset.currentPrice = firstVariant.price;
        
        modal.querySelector(".modal-product-price-text").textContent = "$" + (firstVariant.price / 100).toFixed(2);
        hiddenQtyInput.value = qty;
        
        const sizeButtons = modal.querySelectorAll(".size-button");
        sizeButtons.forEach(btn => {
          btn.classList.remove("active-size-main");
          if (btn.dataset.size === firstVariant.option1 || btn.dataset.size === firstVariant.option2) {
            btn.classList.add("active-size-main");
          }
        });
        
        const swiperInstance = modal.querySelector(".modal-swiper-collection").swiper;
        const variantCore = firstVariant.featured_image?.src?.split("/").pop().replace(/_100x100\.(jpg|png|webp)$/i, "");
        const slidesArray = Array.from(modal.querySelectorAll(".modal-swiper-collection .swiper-slide:not(.swiper-slide-duplicate) img"));
        const slidesCore = slidesArray.map(img => img.src.split("/").pop().replace(/_400x\.(jpg|png|webp)$/i, ""));
        const targetSlideIndex = slidesCore.findIndex(c => c === variantCore);
        if (targetSlideIndex !== -1) swiperInstance.slideToLoop(targetSlideIndex, 0);
      }
      
      selectFirstVariant();
    });
    
    option1Wrapper.querySelectorAll(".size-button").forEach(btn => btn.classList.remove("active-size-main"));
    option2Wrapper.querySelectorAll(".size-button").forEach(btn => btn.classList.remove("active-size-main"));
    singleWrapper.querySelectorAll(".size-button").forEach(btn => btn.classList.remove("active-size-main"));

    imagesWrapper.innerHTML = "";
    const addedImages = new Set();
    productData.images.forEach((imgSrc, i) => {
      if (!addedImages.has(imgSrc)) {
        addedImages.add(imgSrc);
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.dataset.image = imgSrc;
        slide.innerHTML = `
          <a href='/products/${productData.handle}'>
            <img src="${imgSrc}" alt="${productData.title} ${i + 1}" class="w-full h-auto">
          </a>
        `;
        imagesWrapper.appendChild(slide);
      }
    });

    const swiperInstance = new Swiper(modalContent.querySelector(".modal-swiper-collection"), {
      slidesPerView: 1,
      spaceBetween: 10,
      loop: true,
      navigation: {
        nextEl: modalContent.querySelector(".swiper-button-next"),
        prevEl: modalContent.querySelector(".swiper-button-prev"),
      },
      pagination: {
        el: modalContent.querySelector(".swiper-pagination"),
        clickable: true,
      },
    });

    variantsContainer.innerHTML = "";
    const addedVariantImages = new Set();
    const allVariantButtons = [];

    productData.variants.forEach((variant, index) => {
      if (!variant.featured_image) return;
      const imgSrc = variant.featured_image.src;
      if (addedVariantImages.has(imgSrc)) return;
      addedVariantImages.add(imgSrc);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `variant-button-collection-main variant-thumb w-8 h-8 rounded-full overflow-hidden border ${index === 0 ? "ring-2 ring-black" : "border-gray-300 hover:border-black"}`;
      btn.dataset.image = imgSrc;
      btn.dataset.variantId = variant.id;
      btn.dataset.price = variant.price;
      btn.dataset.compareAtPrice = variant.compare_at_price || 0;
      btn.innerHTML = `<img src="${imgSrc.replace('.jpg','_100x100.jpg')}" alt="${variant.title}" class="w-full h-full object-cover">`;
      
      btn.addEventListener("click", () => {
        currentVariantPrice = variant.price;
        modalPrice.textContent = formatMoney(currentVariantPrice * (parseInt(qtyInput.value) || 1));
        hiddenQtyInput.value = qtyInput.value;
        hiddenInput.value = variant.id;
        
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          modalComparePrice.textContent = formatMoney(variant.compare_at_price * parseInt(qtyInput.value));
          modalComparePrice.style.display = "inline";
        } else {
          modalComparePrice.style.display = "none";
        }
        
        variantsContainer.querySelectorAll("button").forEach(b => b.classList.remove("ring-2", "ring-black"));
        btn.classList.add("ring-2", "ring-black");
        
        option1Input.value = variant.option1 || "";
        option2Input.value = variant.option2 || "";
        imageInput.value = variant.featured_image?.src || "";
        
        const selectedOptionsDisplay = modalContent.querySelector(".modal-selected-options");
        if (selectedOptionsDisplay) {
          selectedOptionsDisplay.textContent = `${variant.option1 || ""} ${variant.option2 || ""}`.trim();
        }
        
        const variantCore = getCoreFromVariant(btn.querySelector("img").src);
        const slidesArray = Array.from(modalContent.querySelectorAll(".modal-swiper-collection .swiper-slide:not(.swiper-slide-duplicate) img"));
        const slidesCore = slidesArray.map(img => getCoreFromSlide(img.src));
        
        const targetSlideIndex = slidesCore.findIndex(c => c === variantCore);
        if (targetSlideIndex !== -1) {
          swiperInstance.slideToLoop(targetSlideIndex, 300);
        }
        
        const optionsToSend = {
          option1: variant.option1 || "",
          option2: variant.option2 || "",
          image: variant.featured_image?.src || "",
        };
        
        
        option1Input.value = optionsToSend.option1;
        option2Input.value = optionsToSend.option2;
        imageInput.value = optionsToSend.image;
        hiddenInput.value = variant.id; 
      });

      allVariantButtons.push(btn);
    });

    const maxVisibleVariants = 6;
    allVariantButtons.forEach((btn, i) => {
      if (i < maxVisibleVariants) {
        variantsContainer.appendChild(btn);
      } else {
        btn.style.display = "none";
        variantsContainer.appendChild(btn);
      }
    });

    if (allVariantButtons.length > maxVisibleVariants) {
      const showAllBtn = document.createElement("button");
      showAllBtn.innerHTML = `
        <div class='main_button-show'>
          <img src="{{ 'VectorModal12.svg' | asset_url }}" alt="All" />
        </div>
      `;
      showAllBtn.className = "show-all-variants-btn text-sm text-blue-600 hover:underline mt-2";
      showAllBtn.type = "button";

      showAllBtn.addEventListener("click", () => {
        allVariantButtons.forEach(btn => {
          btn.style.display = "flex";
        });
        showAllBtn.remove();
      });

      variantsContainer.appendChild(showAllBtn);
    }

    qtyInput.value = 1;
    hiddenQtyInput.value = 1;



    setupQuantityControls(modal, qtyInput, hiddenQtyInput, modalPrice);

    const reviewsCount = productData.reviewsCount || 0;
    const avgRating = productData.avgRating || 0;
    const roundedRating = Math.round(avgRating);

    const reviewsContainer = modal.querySelector(".modal-reviews");
    const starsContainer = modal.querySelector(".modal-stars");
    const ratingText = modal.querySelector(".modal-rating-text");

    if (reviewsCount > 0) {
      starsContainer.innerHTML = "";
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.textContent = i <= roundedRating ? "★" : "☆";
        star.style.color = i <= roundedRating ? "#FBBF24" : "#D1D5DB";
        star.style.fontSize = "18px";
        starsContainer.appendChild(star);
      }
      ratingText.textContent = `${avgRating.toFixed(2)}/5.00`;
      reviewsContainer.style.display = "flex";
    } else {
      reviewsContainer.style.display = "none";
    }

    document.body.style.overflow = "hidden";
    function closeModal() {
      modal.remove();
      document.body.style.overflow = "";
    }
    modal.querySelector(".close-modal")?.addEventListener("click", closeModal);
    modal.querySelector(".modal-overlay").addEventListener("click", closeModal);
  }
  document.querySelectorAll(".add-to-cart-form").forEach(form => {
    const triggerBtn = form.querySelector("button, input[type='submit']");
    if (triggerBtn) {
      triggerBtn.addEventListener("click", e => {
        e.preventDefault();
        document.querySelector(".container-modal-collection-main")?.remove();
        
        const productDataElem = form.querySelector(".product-data");
        const handle = productDataElem.dataset.productHandle;
        const variants = JSON.parse(productDataElem.querySelector(".product-variants-json").textContent);
        const images = JSON.parse(productDataElem.dataset.productImages);
        const title = productDataElem.dataset.productTitle;
        
        const reviewsCount = parseInt(productDataElem.dataset.reviewsCount) || 0;
        const avgRating = parseFloat(productDataElem.dataset.avgRating) || 0;
        
        const template = document.querySelector("#addToCartModalTemplate-{{ section.id }}");
        const modalClone = template.content.cloneNode(true);
        const modal = modalClone.querySelector(".container-modal-collection-main");
        
        document.body.appendChild(modal);
        updateModal(modal, { title, images, variants, reviewsCount, avgRating, handle });

        
        modal.classList.remove("hidden");
      });
    }
  });
});