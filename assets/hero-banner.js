document.addEventListener("DOMContentLoaded", function() {
  if (document.querySelectorAll('.hero-swiper .swiper-slide').length > 1) {
    new Swiper(".hero-swiper", {
      pagination: {
        el: ".swiper-pagination.custom-progress",
        clickable: true,
      },
      autoplay: {
        delay: 4000, 
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const banner = document.querySelector('.promo-banner-wrapper');
  const heroes = document.querySelectorAll('.hero-single');

  if (!banner || heroes.length === 0) return;

  const updateHeroMargin = () => {
    const isHidden = window.getComputedStyle(banner).display === 'none';
    heroes.forEach(el => el.classList.toggle('hero-margin', !isHidden));
  };

  updateHeroMargin();

  new MutationObserver(updateHeroMargin).observe(banner, {
    attributes: true,
    attributeFilter: ['style']
  });
});