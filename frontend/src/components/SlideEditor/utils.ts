import type { Slide } from '../types';

export const convertLayoutToFrontend = (layout: string): string => {
  switch (layout) {
    case 'title-only':
    case 'title-body':
    case 'title-bullets':
    case 'two-column':
    case 'title-image':
    case 'title-body-image':
    case 'title-bullets-image':
    case 'two-column-image':
      return layout;
    default:
      return 'title-only';
  }
};

export const convertLayoutToBackend = (layout: string): string => {
  switch (layout) {
    case 'title-only':
    case 'title-body':
    case 'title-bullets':
    case 'two-column':
    case 'title-image':
    case 'title-body-image':
    case 'title-bullets-image':
    case 'two-column-image':
      return layout;
    default:
      return 'title-only';
  }
};

// Remove all font-size declarations from inline style attributes in HTML
export function stripFontSizeStyles(html: string): string {
  if (!html) return html;
  // Remove font-size from any style attribute (even if there are other styles)
  return html.replace(/style=(\"|\')([^\"']*?)(font-size\s*:[^;\"']+;?)([^\"']*)(\"|\')/gi, (match, p1, before, fontSize, after, p5) => {
    // Remove just the font-size declaration, keep other styles
    let newStyle = (before + after).replace(/;;+/g, ';').replace(/^;|;$/g, '');
    return newStyle.trim() ? `style=${p1}${newStyle}${p5}` : '';
  });
}

// Convert backend slide API response to frontend Slide object
export function backendSlideToFrontend(raw: any): Slide {
  return {
    id: raw.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)),
    layout: convertLayoutToFrontend(raw.layout || 'title-body'),
    content: {
      title: raw.title,
      subtitle: raw.subtitle,
      body: raw.body || '',
      bullets: Array.isArray(raw.bullets) ? raw.bullets : (Array.isArray(raw.bullet_points) ? raw.bullet_points : []),
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
