// Converts from backend dash-case string to frontend SlideLayout (UPPERCASE)
// export const convertLayoutToFrontend = (layout: string): string => {
//   switch (layout) {
//     case 'title-only':
//     case 'title-body':
//     case 'title-bullets':
//     case 'two-column':
//     case 'title-image':
//     case 'title-body-image':
//     case 'title-bullets-image':
//     case 'two-column-image':
//       return layout;
//     default:
//       return 'title-only';
//   }
// };

<<<<<<< HEAD
// Converts from frontend SlideLayout (UPPERCASE) to backend dash-case string
export const convertLayoutToBackend = (layout: string): string => {
  switch (layout) {
    case 'TITLE_ONLY':
=======
export const convertLayoutToFrontend = (layout: BackendSlideLayout): SlideLayout => {
  switch (layout) {
    case 'title-only':
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
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

// Normalize bullets to HTML string
export function normalizeBullets(bullets: any): string {
  if (!bullets) return '';
  if (typeof bullets === 'string') {
    // If already HTML, return as is
    if (bullets.trim().startsWith('<ul')) return bullets;
    // If plain text, split by newlines
    const lines = bullets.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length) return `<ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
    return '';
  }
  if (Array.isArray(bullets)) {
    // Array of strings or objects
    const lines = bullets.map(b => typeof b === 'string' ? b : (b && b.text ? b.text : '')).filter(Boolean);
    if (lines.length) return `<ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
    return '';
  }
  return '';
}
