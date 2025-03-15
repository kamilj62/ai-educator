export type SlideLayout = 
  | 'title'
  | 'title-image'
  | 'title-body'
  | 'title-body-image'
  | 'title-bullets'
  | 'title-bullets-image'
  | 'two-column'
  | 'two-column-image';

export interface Slide {
  id: string;
  layout: SlideLayout;
  content: {
    title?: string;
    subtitle?: string;
    body?: string;
    bullets?: string[];
    columnLeft?: string;
    columnRight?: string;
    image?: {
      url: string;
      alt: string;
    };
  };
}

export interface EditorProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
}
