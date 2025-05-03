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
import { setSlides, setActiveSlide } from '../../store/presentationSlice';
import SlideSorter from './components/SlideSorter';
import SavePresentation from './components/SavePresentation';
import SlideEditDialog from './components/SlideEditDialog';
import { Slide, ImageService, SlideImage } from './types';
import SlideLayoutRenderer from './components/SlideLayoutRenderer';
import { backendSlideToFrontend } from './utils';

const SlideEditor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Redux selectors
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const activeSlideId = useSelector((state: RootState) => state.presentation.activeSlideId);

  // Find the active slide if any
  const activeSlide = slides.find(slide => slide.id === activeSlideId);

  const handleSlideSelect = async (slideId: string) => {
    dispatch(setActiveSlide(slideId));
  };

  const handleSlidesReorder = (newSlides: Slide[]) => {
    // If setSlides expects Slide[], dispatch newSlides directly.
    dispatch(setSlides(newSlides));
  };

  const handleSlideDelete = (slideId: string) => {
    const newSlides = slides.filter(slide => slide.id !== slideId);
    dispatch(setSlides(newSlides));
    // If the deleted slide was active, set the next available slide as active
    if (activeSlideId === slideId && newSlides.length > 0) {
      dispatch(setActiveSlide(newSlides[0].id));
    } else if (newSlides.length === 0) {
      dispatch(setActiveSlide(''));
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

  const handleImageGenerate = async (prompt: string, service: ImageService = 'dalle'): Promise<SlideImage> => {
    try {
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
      console.log('[SlideEditor] Image API response:', response);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate image');
      }

      const data = await response.json();
      return {
        url: data.imageUrl,
        alt: prompt,
        prompt,
        service,
      };
    } catch (error) {
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
    // Removed setActiveSlide call
  };

  const handlePreviousSlide = () => {
    // Removed setActiveSlide call
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
              disabled={true} // Removed slides check
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
            <SlideLayoutRenderer slide={activeSlide} />
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
