import React from 'react';
import { render, fireEvent, getAllByText } from '@testing-library/react';
import SlideEditDialog from './SlideEditDialog';
import { Slide, BackendSlideLayout } from '../types';

const mockSlide: Slide = {
  id: '1',
  layout: 'title-bullets',
  backgroundColor: '#ffffff',
  fontColor: '#222222',
  content: {
    title: 'Test Title',
    bullets: 'Test bullet',
    image: undefined,
  },
};

describe('SlideEditDialog', () => {
  it('should allow picking a background color and font color', () => {
    const handleSave = jest.fn();
    const { getByLabelText, getByText, getAllByText } = render(
      <SlideEditDialog
        open={true}
        onClose={() => {}}
        slide={mockSlide}
        topic={undefined}
        onSave={handleSave}
        onImageUpload={jest.fn()}
        onImageGenerate={jest.fn()}
      />
    );

    // Open background color dropdown
    const bgColorSelect = getByLabelText('Slide Background');
    fireEvent.mouseDown(bgColorSelect);
    const customOptions = getAllByText('Custom...');
    fireEvent.click(customOptions[0]); // The first Custom... is for background

    // Check that the color picker appears
    expect(getByLabelText('Pick custom background color')).toBeInTheDocument();

    // Open font color dropdown
    const fontColorSelect = getByLabelText('Font Color');
    fireEvent.mouseDown(fontColorSelect);
    // Re-query for all Custom... options, now the second is for font
    const customFontOptions = getAllByText('Custom...');
    fireEvent.click(customFontOptions[1]); // The second Custom... is for font

    // Check that the font color picker appears
    expect(getByLabelText('Pick custom font color')).toBeInTheDocument();

    // Save changes
    const saveButton = getByText('Save');
    fireEvent.click(saveButton);

    // The handler should be called (color values are not tested here since we can't simulate the picker)
    expect(handleSave).toHaveBeenCalled();
  });
});
