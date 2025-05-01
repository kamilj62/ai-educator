import { BackendSlideLayout, SlideLayout, Slide } from './types';

export const convertLayoutToFrontend = (layout: BackendSlideLayout): SlideLayout => {
  switch (layout) {
    case 'title-only':
      return 'title-only';
    case 'title-body':
      return 'title-body';
    case 'title-bullets':
      return 'title-bullets';
    case 'two-column':
      return 'two-column';
    case 'title-image':
      return 'title-image';
    case 'title-body-image':
      return 'title-body-image';
    case 'title-bullets-image':
      return 'title-bullets-image';
    case 'two-column-image':
<<<<<<< HEAD
=======
      return 'two-column-image';
    default:
      return 'title-only';
  }
};

export const convertLayoutToBackend = (layout: SlideLayout): BackendSlideLayout => {
  switch (layout) {
    case 'title-only':
      return 'title-only';
    case 'title-body':
      return 'title-body';
    case 'title-bullets':
      return 'title-bullets';
    case 'two-column':
      return 'two-column';
    case 'title-image':
      return 'title-image';
    case 'title-body-image':
      return 'title-body-image';
    case 'title-bullets-image':
      return 'title-bullets-image';
    case 'two-column-image':
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
      return 'two-column-image';
    default:
      return 'title-only';
  }
};

export const convertLayoutToBackend = (layout: SlideLayout): BackendSlideLayout => {
  switch (layout) {
    case 'title-only':
      return 'title-only';
    case 'title-body':
      return 'title-body';
    case 'title-bullets':
      return 'title-bullets';
    case 'two-column':
      return 'two-column';
    case 'title-image':
      return 'title-image';
    case 'title-body-image':
      return 'title-body-image';
    case 'title-bullets-image':
      return 'title-bullets-image';
    case 'two-column-image':
      return 'two-column-image';
    default:
      return 'title-only';
  }
};

// Remove all font-size declarations from inline style attributes in HTML
export function stripFontSizeStyles(html: string): string {
  if (!html) return html;
  // Remove font-size from any style attribute (even if there are other styles)
  return html.replace(/style=("|')([^"']*?)(font-size\s*:[^;"']+;?)([^"']*)("|')/gi, (match, p1, before, fontSize, after, p5) => {
    // Remove just the font-size declaration, keep other styles
    let newStyle = (before + after).replace(/;;+/g, ';').replace(/^;|;$/g, '');
    return newStyle.trim() ? `style=${p1}${newStyle}${p5}` : '';
  });
}

// Convert backend slide API response to frontend Slide object
export function backendSlideToFrontend(raw: any): Slide {
  return {
    id: raw.id || crypto.randomUUID(),
    layout: raw.layout || 'title-body',
    content: {
      title: raw.title,
      subtitle: raw.subtitle,
      body: raw.body || '',
      bullets: (raw.bullets || raw.bullet_points || []).map((text: string) => ({ text })),
      image: raw.image_url
        ? {
            url: raw.image_url,
            alt: raw.image_alt,
            caption: raw.image_caption,
            service: raw.image_service,
            prompt: raw.image_prompt,
          }
        : undefined,
      image_prompt: raw.image_prompt,
      // Add other fields as needed
    },
  };
}
