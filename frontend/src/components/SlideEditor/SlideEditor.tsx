import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { setSlides, setActiveSlide } from '../../store/presentationSlice';
import SlideSorter from './components/SlideSorter';
import SavePresentation from './components/SavePresentation';
import SlideEditDialog from './components/SlideEditDialog';
import { Slide, SlideContent, SlideImage, ImageService, SlideTopic } from '../types';
import SlideLayoutRenderer from './components/SlideLayoutRenderer';
import { convertLayoutToFrontend } from './utils';
import EditorControls from './components/EditorControls';
import AddIcon from '@mui/icons-material/Add';

const DEFAULT_BG_COLOR = '#fff';
const DEFAULT_FONT_COLOR = '#222';

const SlideEditor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pendingNewSlide, setPendingNewSlide] = useState<Slide | null>(null);

  const slides = useSelector((state: RootState) => state.presentation.slides);
  const activeSlideId = useSelector((state: RootState) => state.presentation.activeSlideId);
  const activeSlideIdx = slides.findIndex(s => s.id === activeSlideId);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " ", "Enter"].includes(e.key)) {
        if (activeSlideIdx < slides.length - 1) {
          dispatch(setActiveSlide(slides[activeSlideIdx + 1].id));
        }
        e.preventDefault();
      } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        if (activeSlideIdx > 0) {
          dispatch(setActiveSlide(slides[activeSlideIdx - 1].id));
        }
        e.preventDefault();
      } else if (e.key === "Escape") {
        document.exitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, activeSlideIdx, slides, dispatch]);

  useEffect(() => {
    if (slides.length > 0 && !activeSlideId) {
      // Removed setActiveSlide dispatch call
    }
  }, [slides, activeSlideId, dispatch]);

  // Ensure we have a valid active slide ID
  useEffect(() => {
    if (slides.length > 0 && !activeSlideId) {
      // Set the first slide as active if no active slide is set
      dispatch(setActiveSlide(slides[0].id));
    } else if (activeSlideId && !slides.some(slide => slide.id === activeSlideId)) {
      // Reset active slide if it's not in the slides array
      dispatch(setActiveSlide(slides[0]?.id || null));
    }
  }, [slides, activeSlideId, dispatch]);

  const activeSlide = activeSlideId ? slides.find(slide => slide.id === activeSlideId) : null;
  
  // Debug logging
  console.log('Active Slide ID:', activeSlideId);
  console.log('Active Slide:', activeSlide);
  console.log('All Slides:', slides);

  const handleSlideSelect = async (slideId: string) => {
    dispatch(setActiveSlide(slideId));
  };

  const handleSlidesReorder = (newSlides: Slide[]) => {
    dispatch(setSlides(newSlides));
    // Update active slide ID if the current active slide was removed
    if (activeSlideId && !newSlides.some(slide => slide.id === activeSlideId)) {
      dispatch(setActiveSlide(newSlides[0]?.id || null));
    }
  };

  const handleSlideDelete = (slideId: string) => {
    const newSlides = slides.filter(slide => slide.id !== slideId);
    dispatch(setSlides(newSlides));
    
    // Update active slide if the current one was deleted
    if (activeSlideId === slideId) {
      if (newSlides.length > 0) {
        // Set the first slide as active
        dispatch(setActiveSlide(newSlides[0].id));
      } else {
        // No slides left
        dispatch(setActiveSlide(null));
      }
    }
  };

  const handleSlideChange = (updatedSlide: Slide) => {
    const newSlides = slides.map(slide =>
      slide.id === updatedSlide.id ? updatedSlide : slide
    );
    dispatch(setSlides(newSlides));
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    return URL.createObjectURL(file);
  };

  const IMAGE_PROMPT_QUALITY_TEMPLATE = 'highly detailed, photorealistic, trending on ArtStation, 4k, vibrant colors, dramatic lighting';

  const enhancePrompt = (prompt: string) => {
    if (!prompt) return IMAGE_PROMPT_QUALITY_TEMPLATE;
    if (prompt.toLowerCase().includes('artstation') || prompt.toLowerCase().includes('photorealistic')) {
      return prompt;
    }
    return `${prompt}, ${IMAGE_PROMPT_QUALITY_TEMPLATE}`;
  };

  const handleImageGenerate = async (prompt: string, service: ImageService = 'dalle'): Promise<SlideImage> => {
    try {
      const enhancedPrompt = enhancePrompt(prompt);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/generate/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: enhancedPrompt,
          context: { service }
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate image');
      }
      const data = await response.json();
      let url = data.imageUrl || data.image_url || '';
      if (url && url.startsWith('/static/')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
        url = baseUrl ? `${baseUrl}${url}` : url;
      }
      return {
        url,
        alt: enhancedPrompt,
        prompt: enhancedPrompt,
        service,
      };
    } catch (error) {
      throw error;
    }
  };

  const handleSave = () => {
    console.log('Save triggered from EditorControls');
  };

  const handleCancel = () => {
    console.log('Cancel triggered from EditorControls');
  };

  const handleAddSlide = () => {
    const { v4: uuidv4 } = require('uuid');
    const blankSlide = {
      id: uuidv4(),
      layout: 'title-body',
      content: {
        title: '',
        subtitle: '',
        body: '',
        bullets: '',
      },
    };
    setPendingNewSlide(blankSlide as Slide);
    setEditDialogOpen(true);
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

  const handleNextSlide = () => {};

  const handlePreviousSlide = () => {};

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const [topics, setTopics] = useState<SlideTopic[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).topicsToGenerate) {
        setTopics((window as any).topicsToGenerate);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const getTopicForSlide = (slide: Slide): SlideTopic | undefined => {
    if (!slide || !slide.content || !slide.content.title) return undefined;
    const normalize = (str: string) => str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return topics.find(
      (topic: SlideTopic) =>
        normalize(topic.title) === normalize(slide.content.title)
    );
  };

  const handleLayoutChange = (slideId: string, newLayout: string) => {
    const newSlides = slides.map(slide =>
      slide.id === slideId ? { ...slide, layout: newLayout } : slide
    );
    dispatch(setSlides(newSlides));
  };

  return (
    <Box ref={editorRef} sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      overflowY: 'hidden',
    }}>
      {!isFullscreen && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 1, 
          p: 1,
          bgcolor: 'primary.light',
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
                disabled={false} 
                size="large"
              >
                <SaveIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}
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
            flexDirection: 'column',
            bgcolor: 'primary.main',
            color: 'white',
          }}>
            <Box sx={{ 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              bgcolor: 'primary.main', // blue background
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ color: 'inherit', fontWeight: 700 }}>Slides</Typography>
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
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'primary.light',
          minHeight: 0, 
          minWidth: 0, 
          overflow: 'hidden', 
        }}>
          {!isFullscreen && activeSlide && (
            <EditorControls
              onSave={handleSave}
              onCancel={handleCancel}
              onAddSlide={handleAddSlide}
              onDuplicateSlide={undefined}
              onDeleteSlide={undefined}
              onStartPresentation={undefined}
            />
          )}
          <Box sx={{ p: 2 }} />
          <Box sx={{ 
            flex: 1, 
            p: 3, 
            overflow: 'auto',
            position: 'relative',
            display: 'block',
            minHeight: '80vh',
            minWidth: 0,
            bgcolor: 'primary.light',
          }}>
            {activeSlide && (
              <Box
                sx={{
                  width: '100%',
                  background: DEFAULT_BG_COLOR,
                  p: 0,
                  minHeight: 400,
                  position: 'relative',
                  zIndex: 1000,
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '100%',
                    background: '#fffbe7',
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {activeSlide && (
                    <SlideLayoutRenderer
                      slide={activeSlide}
                      onChange={handleSlideChange}
                      onImageUpload={handleImageUpload}
                      onImageGenerate={handleImageGenerate}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      <SavePresentation
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSave}
        slides={slides}
      />
      {(pendingNewSlide || activeSlide) && (
        <SlideEditDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setPendingNewSlide(null);
          }}
          slide={pendingNewSlide || activeSlide!}
          topic={pendingNewSlide ? undefined : getTopicForSlide(activeSlide!)}
          onSave={(slide) => {
            if (pendingNewSlide) {
              dispatch(setSlides([...slides, slide]));
              // Removed setActiveSlide dispatch call
              setPendingNewSlide(null);
            } else {
              handleSlideChange(slide);
            }
            setEditDialogOpen(false);
          }}
          onImageUpload={handleImageUpload}
          onImageGenerate={handleImageGenerate}
        />
      )}
    </Box>
  );
};

export default SlideEditor;
