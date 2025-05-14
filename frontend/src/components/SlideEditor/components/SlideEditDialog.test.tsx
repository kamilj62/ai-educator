import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';
import SlideEditDialog from './SlideEditDialog';
import { Slide } from '../../types';

// Mock the ChromePicker to avoid canvas errors in tests
jest.mock('react-color', () => ({
  ChromePicker: () => <div data-testid="chrome-picker" />,
}));

// Mock the TiptapEditor to avoid CSS parsing errors
jest.mock('./TiptapEditor', () => ({
  __esModule: true,
  default: ({ content, onChange, placeholder }: { 
    content: string; 
    onChange: (html: string) => void; 
    placeholder?: string 
  }) => (
    <div data-testid="tiptap-editor" data-placeholder={placeholder}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <button onClick={() => onChange && onChange('<p>Updated content</p>')}>
        Update Content
      </button>
    </div>
  ),
}));

const mockSlide: Slide = {
  id: '1',
  layout: 'title-bullets',
  backgroundColor: '#fff', // Use a value that matches one of the options
  fontColor: '#222',       // Use a value that matches one of the options
  content: {
    title: 'Test Title',
    bullets: '<ul><li>Test bullet</li></ul>',
    image: undefined,
  },
};

describe('SlideEditDialog', () => {
  it('renders the dialog with the correct title', () => {
    const handleSave = jest.fn();
    
    render(
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

    // Check that the dialog is rendered with the correct title
    expect(screen.getByText('Edit Slide')).toBeInTheDocument();
  });

  it('calls onClose when the Cancel button is clicked', () => {
    const handleClose = jest.fn();
    
    const { getByRole } = render(
      <SlideEditDialog
        open={true}
        onClose={handleClose}
        slide={mockSlide}
        topic={undefined}
        onSave={jest.fn()}
        onImageUpload={jest.fn()}
        onImageGenerate={jest.fn()}
      />
    );
    
    // Find the Cancel button and click it
    const cancelButton = getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    // Check that onClose was called
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders TiptapEditor with the correct content', () => {
    const { getByTestId } = render(
      <SlideEditDialog
        open={true}
        onClose={jest.fn()}
        slide={mockSlide}
        topic={undefined}
        onSave={jest.fn()}
        onImageUpload={jest.fn()}
        onImageGenerate={jest.fn()}
      />
    );
    
    // Check that the TiptapEditor is rendered with the correct content
    const tiptapEditor = getByTestId('tiptap-editor');
    expect(tiptapEditor).toBeInTheDocument();
    
    // Check that the content is rendered
    expect(tiptapEditor).toHaveTextContent('Test Title');
  });
});
