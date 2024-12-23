declare module 'react' {
    namespace JSX {
      interface IntrinsicElements {
        'swiper-container': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
          init: string;
          ref: React.RefObject<HTMLElement>;
        }, HTMLElement>;
        'swiper-slide': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      }
    }
  }