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

// Converts from frontend SlideLayout (UPPERCASE) to backend dash-case string
export const convertLayoutToBackend = (layout: string): string => {
  switch (layout) {
    case 'TITLE_ONLY':
      return 'title-only';
    case 'TITLE_BODY':
      return 'title-body';
    case 'TITLE_BULLETS':
      return 'title-bullets';
    case 'TWO_COLUMN':
      return 'two-column';
    case 'TITLE_IMAGE':
      return 'title-image';
    case 'TITLE_BODY_IMAGE':
      return 'title-body-image';
    case 'TITLE_BULLETS_IMAGE':
      return 'title-bullets-image';
    case 'TWO_COLUMN_IMAGE':
      return 'two-column-image';
    default:
      return 'title-only';
  }
};
