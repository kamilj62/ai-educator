import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { setActiveSlide, setSlides } from '../../store/presentationSlice';
import SlideSorter from './components/SlideSorter';
import { Slide } from './types';
import SlideLayoutRenderer from './components/SlideLayoutRenderer';

const SlideEditor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const activeSlideId = useSelector((state: RootState) => state.presentation.activeSlideId);
  const activeSlide = slides.find(slide => slide.id === activeSlideId);

  // Set the first slide as active if none is selected
  useEffect(() => {
    if (slides.length > 0 && !activeSlideId) {
      dispatch(setActiveSlide(slides[0].id));
    }
  }, [slides, activeSlideId, dispatch]);

  const handleSlideSelect = (slideId: string) => {
    dispatch(setActiveSlide(slideId));
  };

  const handleSlidesReorder = (newSlides: Slide[]) => {
    dispatch(setSlides(newSlides));
  };

  const handleSlideChange = (updatedSlide: Slide) => {
    const newSlides = slides.map(slide => 
      slide.id === updatedSlide.id ? updatedSlide : slide
    );
    dispatch(setSlides(newSlides));
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
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <SlideSorter
          slides={slides}
          onSlidesReorder={handleSlidesReorder}
          onSlideSelect={handleSlideSelect}
          activeSlideId={activeSlideId ?? undefined}
        />
      </Box>

      <Box sx={{ 
        flex: 1,
        p: 3,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeSlide ? (
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0
          }}>
            <Box sx={{
              width: '100%',
              maxWidth: '90%',
              aspectRatio: '16/9',
              backgroundColor: 'background.paper',
              borderRadius: 1,
              boxShadow: 3,
              overflow: 'hidden',
              position: 'relative'
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'auto'
              }}>
                <SlideLayoutRenderer 
                  slide={activeSlide} 
                  onChange={handleSlideChange}
                />
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="h6" color="text.secondary">
              {slides.length === 0 ? 'No slides available' : 'Select a slide to edit'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SlideEditor;