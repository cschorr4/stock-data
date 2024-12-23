interface SwiperContainerElement extends HTMLElement {
    initialize: () => void;
  }
  
  interface SwiperSlideElement extends HTMLElement {}
  
  declare global {
    namespace React {
      interface HTMLElementTagNameMap {
        'swiper-container': SwiperContainerElement;
        'swiper-slide': SwiperSlideElement;
      }
    }
  }