import { useState, useCallback } from 'react';
import { Box, Grid, styled } from '@mui/material';
import SlideSorter from './SlideSorter';
import LayoutSwitcher from './components/LayoutSwitcher';
import TitleImageLayout from './layouts/TitleImageLayout';
import TitleBodyLayout from './layouts/TitleBodyLayout';
import TitleBulletsLayout from './layouts/TitleBulletsLayout';
import TwoColumnLayout from './layouts/TwoColumnLayout';
import type { Slide, SlideLayout } from './types';
import { useEffect } from 'react';
import Reveal from 'reveal.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/white.css';

const EditorContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  backgroundColor: theme.palette.grey[100],
}));

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  overflowY: 'auto',
}));

const EditorToolbar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'center',
}));

interface SlideEditorProps {
  slides: Slide[];
  onChange: (slides: Slide[]) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

const SlideEditor = ({ slides, onChange, onImageUpload }: SlideEditorProps) => {
  const [activeSlideId, setActiveSlideId] = useState<string>(slides[0]?.id);
  const [reveal, setReveal] = useState<Reveal.Api | null>(null);

  const handleSlideChange = useCallback((updatedSlide: Slide) => {
    const newSlides = slides.map((slide) =>
      slide.id === updatedSlide.id ? updatedSlide : slide
    );
    onChange(newSlides);
  }, [slides, onChange]);

  const handleSlidesReorder = useCallback((newSlides: Slide[]) => {
    onChange(newSlides);
  }, [onChange]);

  const handleLayoutChange = useCallback((layout: SlideLayout) => {
    const activeSlide = slides.find((slide) => slide.id === activeSlideId);
    if (!activeSlide) return;

    // Preserve content when switching layouts
    const updatedSlide: Slide = {
      ...activeSlide,
      layout,
      content: {
        ...activeSlide.content,
        // Reset incompatible content fields based on new layout
        bullets: layout.includes('bullets') ? activeSlide.content.bullets : undefined,
        body: layout.includes('body') ? activeSlide.content.body : undefined,
        columnLeft: layout.includes('two-column') ? activeSlide.content.columnLeft : undefined,
        columnRight: layout.includes('two-column') ? activeSlide.content.columnRight : undefined,
        image: layout.includes('image') ? activeSlide.content.image : undefined,
      },
    };

    handleSlideChange(updatedSlide);
  }, [activeSlideId, slides, handleSlideChange]);

  const getLayoutComponent = (slide: Slide) => {
    switch (slide.layout) {
      case 'title':
      case 'title-image':
        return (
          <TitleImageLayout
            slide={slide}
            onChange={handleSlideChange}
            onImageUpload={onImageUpload}
          />
        );
      case 'title-body':
      case 'title-body-image':
        return (
          <TitleBodyLayout
            slide={slide}
            onChange={handleSlideChange}
            onImageUpload={onImageUpload}
          />
        );
      case 'title-bullets':
      case 'title-bullets-image':
        return (
          <TitleBulletsLayout
            slide={slide}
            onChange={handleSlideChange}
            onImageUpload={onImageUpload}
          />
        );
      case 'two-column':
      case 'two-column-image':
        return (
          <TwoColumnLayout
            slide={slide}
            onChange={handleSlideChange}
            onImageUpload={onImageUpload}
          />
        );
      default:
        return (
          <TitleImageLayout
            slide={slide}
            onChange={handleSlideChange}
            onImageUpload={onImageUpload}
          />
        );
    }
  };

  // Initialize Reveal.js for presentation mode
  useEffect(() => {
    const deck = new Reveal({
      embedded: true,
      hash: false,
      mouseWheel: false,
      transition: 'slide',
    });

    deck.initialize().then(() => {
      setReveal(deck);
    });

    return () => {
      deck.destroy();
    };
  }, []);

  const activeSlide = slides.find((slide) => slide.id === activeSlideId);

  return (
    <EditorContainer>
      <Box width={280}>
        <SlideSorter
          slides={slides}
          activeSlideId={activeSlideId}
          onSlidesReorder={handleSlidesReorder}
          onSlideSelect={setActiveSlideId}
        />
      </Box>
      <MainContent>
        {activeSlide && (
          <>
            <EditorToolbar>
              <LayoutSwitcher
                currentLayout={activeSlide.layout}
                onLayoutChange={handleLayoutChange}
              />
            </EditorToolbar>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  {getLayoutComponent(activeSlide)}
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </MainContent>
    </EditorContainer>
  );
};

export default SlideEditor;
