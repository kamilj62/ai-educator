import { BackendSlideLayout, SlideLayout } from '../types';

export const convertLayoutToFrontend = (layout: BackendSlideLayout): SlideLayout => {
  switch (layout) {
    case 'title-only':
      return 'TITLE_ONLY';
    case 'title-body':
      return 'TITLE_BODY';
    case 'title-bullets':
      return 'TITLE_BULLETS';
    case 'two-column':
      return 'TWO_COLUMN';
    case 'title-image':
      return 'TITLE_IMAGE';
    case 'title-body-image':
      return 'TITLE_BODY_IMAGE';
    case 'title-bullets-image':
      return 'TITLE_BULLETS_IMAGE';
    case 'two-column-image':
      return 'TWO_COLUMN_IMAGE';
    default:
      return 'TITLE_ONLY';
  }
};

export const convertLayoutToBackend = (layout: SlideLayout): BackendSlideLayout => {
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
