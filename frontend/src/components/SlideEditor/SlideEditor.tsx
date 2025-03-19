import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
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
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const activeSlideId = useSelector((state: RootState) => state.presentation.activeSlideId);
  const activeSlide = slides.find(slide => slide.id === activeSlideId);

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

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
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
          <Tooltip title="Save Presentation">
            <IconButton onClick={() => setSaveDialogOpen(true)}>
              <SaveIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <SlideSorter
          slides={slides}
          onSlidesReorder={handleSlidesReorder}
          onSlideSelect={handleSlideSelect}
          activeSlideId={activeSlideId || ''}
        />
      </Box>

      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {activeSlide ? (
          <>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              mb: 2
            }}>
              <Button
                startIcon={<EditIcon />}
                variant="contained"
                onClick={() => setEditDialogOpen(true)}
              >
                Edit Slide
              </Button>
            </Box>
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