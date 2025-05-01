import { BackendSlideLayout, SlideLayout } from '../types';

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
