<<<<<<< HEAD
import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { setActiveSlide, setSlides } from '../../store/presentationSlice';
import SlideSorter from './components/SlideSorter';
import SavePresentation from './components/SavePresentation';
import SlideEditDialog from './components/SlideEditDialog';
import { Slide, ImageService } from './types';
import SlideLayoutRenderer from './components/SlideLayoutRenderer';

const SlideEditor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const activeSlideId = useSelector((state: RootState) => state.presentation.activeSlideId);
  const activeSlide = slides.find(slide => slide.id === activeSlideId);
  const activeSlideIndex = slides.findIndex(slide => slide.id === activeSlideId);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Set the first slide as active when slides are loaded
  useEffect(() => {
    if (slides.length > 0 && !activeSlideId) {
      dispatch(setActiveSlide(slides[0].id));
    }
  }, [slides, activeSlideId, dispatch]);

  const handleSlideSelect = async (slideId: string) => {
    if (slideId !== activeSlideId) {
      const selectedSlide = slides.find(s => s.id === slideId);
      dispatch(setActiveSlide(slideId));
    }
  };

  const handleSlidesReorder = (newSlides: Slide[]) => {
    dispatch(setSlides(newSlides));
    // Ensure we have an active slide after reordering
    if (!activeSlideId && newSlides.length > 0) {
      dispatch(setActiveSlide(newSlides[0].id));
    }
  };

  const handleSlideDelete = (slideId: string) => {
    const newSlides = slides.filter(slide => slide.id !== slideId);
    dispatch(setSlides(newSlides));
    
    // If the deleted slide was active, select the first available slide
    if (activeSlideId === slideId && newSlides.length > 0) {
      dispatch(setActiveSlide(newSlides[0].id));
    }
  };

  const handleSlideChange = (updatedSlide: Slide) => {
    const newSlides = slides.map(slide => 
      slide.id === updatedSlide.id ? updatedSlide : slide
    );
    dispatch(setSlides(newSlides));
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    // TODO: Implement actual file upload
    return URL.createObjectURL(file);
  };

  const handleImageGenerate = async (prompt: string, service: ImageService = 'dalle'): Promise<string> => {
    try {
      console.log('SlideEditor - Generating image:', { prompt, service });
      const response = await fetch('http://localhost:8000/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          context: { service }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('SlideEditor - Image generation failed:', error);
        throw new Error(error.detail || 'Failed to generate image');
      }

      const data = await response.json();
      console.log('SlideEditor - Image generated:', data);
      return data.imageUrl;
    } catch (error) {
      console.error('SlideEditor - Error generating image:', error);
      throw error;
    }
  };

  const handleSave = (filename: string) => {
    console.log(`Presentation saved as ${filename}.json`);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      editorRef.current?.requestFullscreen().catch(err => {
        console.error("Error attempting to enable full-screen mode:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleNextSlide = () => {
    if (activeSlideIndex < slides.length - 1) {
      dispatch(setActiveSlide(slides[activeSlideIndex + 1].id));
    }
  };

  const handlePreviousSlide = () => {
    if (activeSlideIndex > 0) {
      dispatch(setActiveSlide(slides[activeSlideIndex - 1].id));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <Box ref={editorRef} sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 1, 
        p: 1,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
          <span>
            <IconButton onClick={toggleFullScreen} size="large">
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Edit Slide">
          <span>
            <IconButton
              onClick={() => setEditDialogOpen(true)}
              disabled={!activeSlide}
              size="large"
            >
              <EditIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Save Presentation">
          <span>
            <IconButton
              onClick={() => setSaveDialogOpen(true)}
              disabled={slides.length === 0}
              size="large"
            >
              <SaveIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Box sx={{ 
        display: 'flex', 
        height: '100%',
        overflow: 'hidden',
        bgcolor: 'background.default'
      }}>
        {!isFullscreen && (
          <Box sx={{ 
            width: 300, 
            borderRight: 1, 
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6">Slides</Typography>
            </Box>
            <SlideSorter
              slides={slides}
              onSlidesReorder={handleSlidesReorder}
              onSlideSelect={handleSlideSelect}
              onSlideDelete={handleSlideDelete}
              activeSlideId={activeSlideId || ''}
            />
          </Box>
        )}

        <Box sx={{ 
          flex: 1, 
          p: 3, 
          overflow: 'auto',
          position: 'relative'
        }}>
          {activeSlide ? (
            <>
              {isFullscreen && (
                <Box sx={{ 
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  px: 2,
                  transform: 'translateY(-50%)',
                  zIndex: 1
                }}>
                  <Tooltip title="Previous Slide">
                    <span>
                      <IconButton
                        onClick={handlePreviousSlide}
                        disabled={activeSlideIndex === 0}
                        size="large"
                        sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <NavigateBeforeIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Next Slide">
                    <span>
                      <IconButton
                        onClick={handleNextSlide}
                        disabled={activeSlideIndex === slides.length - 1}
                        size="large"
                        sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <NavigateNextIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              )}
              <SlideLayoutRenderer
                slide={activeSlide}
                onChange={handleSlideChange}
              />
            </>
          ) : (
            <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
              Select a slide to edit
            </Typography>
          )}
        </Box>
      </Box>

      <SavePresentation
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSave}
        slides={slides}
      />

      {activeSlide && (
        <SlideEditDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          slide={activeSlide}
          onSave={handleSlideChange}
          onImageUpload={handleImageUpload}
          onImageGenerate={handleImageGenerate}
        />
      )}
    </Box>
  );
};

export default SlideEditor;
=======
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
>>>>>>> dd7ecbd (added imagen images)
