    document.addEventListener("DOMContentLoaded", function() {
        new Swiper(".mySwiper", {
            slidesPerView: 7,
            spaceBetween: 10,
            loop: false, 
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            breakpoints: {
                0: {    
                    slidesPerView: "auto",
                },
                768: {
                    slidesPerView: 4,
                },
                1024: {
                    slidesPerView: 5,
                },
                1440: {
                    slidesPerView: 7,
                }
            }
        });
    });