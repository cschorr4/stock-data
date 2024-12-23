import React from 'react';

interface SwiperParams {
  init: string;
  class: string;
  slidesPerView?: number;
  spaceBetween?: number;
  loop?: boolean;
  autoplay?: {
    delay: number;
    disableOnInteraction: boolean;
  };
  pagination?: {
    clickable: boolean;
  };
  speed?: number;
  effect?: string;
  grabCursor?: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'swiper-container': HTMLElement & SwiperParams & { initialize: () => void };
    'swiper-slide': HTMLElement;
  }
}