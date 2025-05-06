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
<<<<<<< HEAD
<<<<<<< HEAD
import { setSlides, setActiveSlide } from '../../store/presentationSlice';
=======
import { updateSlides } from '../../store/presentationSlice';
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)
import SlideSorter from './components/SlideSorter';
import SavePresentation from './components/SavePresentation';
import SlideEditDialog from './components/SlideEditDialog';
import { Slide, ImageService, SlideImage, SlideTopic, BackendSlideLayout } from './types';
=======
import { setSlides, setActiveSlide } from '../../store/presentationSlice';
import SlideSorter from './components/SlideSorter';
import SavePresentation from './components/SavePresentation';
import SlideEditDialog from './components/SlideEditDialog';
<<<<<<< HEAD
import { Slide, ImageService, SlideImage } from './types';
>>>>>>> 11d5af65 (Add /api/generate/image endpoint and enhancements)
=======
import { Slide, ImageService, SlideImage, SlideTopic } from './types';
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
import SlideLayoutRenderer from './components/SlideLayoutRenderer';
<<<<<<< HEAD
import { backendSlideToFrontend, convertLayoutToFrontend, convertLayoutToBackend } from './utils';
import EditorControls from './components/EditorControls';
import AddIcon from '@mui/icons-material/Add';

const DEFAULT_BG_COLOR = '#fff';
const DEFAULT_FONT_COLOR = '#222';
=======
import { backendSlideToFrontend } from './utils';
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)

const SlideEditor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pendingNewSlide, setPendingNewSlide] = useState<Slide | null>(null);

<<<<<<< HEAD
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

<<<<<<< HEAD
  useEffect(() => {
    if (slides.length > 0 && !activeSlideId) {
      dispatch(setActiveSlide(slides[0].id));
    }
  }, [slides, activeSlideId, dispatch]);

  const activeSlide = slides.find(slide => slide.id === activeSlideId);

  const handleSlideSelect = async (slideId: string) => {
    dispatch(setActiveSlide(slideId));
  };

  const handleSlidesReorder = (newSlides: Slide[]) => {
    dispatch(setSlides(newSlides));
  };

  const handleSlideDelete = (slideId: string) => {
    const newSlides = slides.filter(slide => slide.id !== slideId);
    dispatch(setSlides(newSlides));
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
=======
=======
  // Redux selectors
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const activeSlideId = useSelector((state: RootState) => state.presentation.activeSlideId);

  // Find the active slide if any
  const activeSlide = slides.find(slide => slide.id === activeSlideId);

>>>>>>> 11d5af65 (Add /api/generate/image endpoint and enhancements)
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
<<<<<<< HEAD
    // Removed setSlides call
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)
=======
    const newSlides = slides.map(slide =>
      slide.id === updatedSlide.id ? updatedSlide : slide
    );
    dispatch(setSlides(newSlides));
>>>>>>> 11d5af65 (Add /api/generate/image endpoint and enhancements)
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    return URL.createObjectURL(file);
  };

<<<<<<< HEAD
<<<<<<< HEAD
=======
  // Enhance prompts for better image quality
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
  const IMAGE_PROMPT_QUALITY_TEMPLATE = 'highly detailed, photorealistic, trending on ArtStation, 4k, vibrant colors, dramatic lighting';

  const enhancePrompt = (prompt: string) => {
    if (!prompt) return IMAGE_PROMPT_QUALITY_TEMPLATE;
<<<<<<< HEAD
=======
    // Avoid duplicating the template if user already added it
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
    if (prompt.toLowerCase().includes('artstation') || prompt.toLowerCase().includes('photorealistic')) {
      return prompt;
    }
    return `${prompt}, ${IMAGE_PROMPT_QUALITY_TEMPLATE}`;
  };

<<<<<<< HEAD
  const handleImageGenerate = async (prompt: string, service: ImageService = 'dalle'): Promise<SlideImage> => {
    try {
      const enhancedPrompt = enhancePrompt(prompt);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/generate/image`, {
=======
  const handleImageGenerate = async (prompt: string, service: ImageService = 'dalle'): Promise<SlideImage> => {
    try {
      const response = await fetch('http://localhost:8000/api/generate-image', {
>>>>>>> 11d5af65 (Add /api/generate/image endpoint and enhancements)
=======
  const handleImageGenerate = async (prompt: string, service: ImageService = 'dalle'): Promise<SlideImage> => {
    try {
      // Enhance the prompt before sending to backend
      const enhancedPrompt = enhancePrompt(prompt);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/generate/image`, {
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
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
<<<<<<< HEAD
<<<<<<< HEAD
      let url = data.imageUrl || data.image_url || '';
=======
      // Support both imageUrl (old Flask) and image_url (FastAPI)
      let url = data.imageUrl || data.image_url || '';
      // If url is a relative path, prepend backend base URL
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
      if (url && url.startsWith('/static/')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
        url = baseUrl ? `${baseUrl}${url}` : url;
      }
<<<<<<< HEAD
      return {
        url,
        alt: enhancedPrompt,
        prompt: enhancedPrompt,
=======
      return {
        url: data.imageUrl,
        alt: prompt,
        prompt,
>>>>>>> 11d5af65 (Add /api/generate/image endpoint and enhancements)
=======
      return {
        url,
        alt: enhancedPrompt,
        prompt: enhancedPrompt,
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
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

<<<<<<< HEAD
  const handleNextSlide = () => {};
  const handlePreviousSlide = () => {};
=======
  const handleNextSlide = () => {
    // Removed setActiveSlide call
  };

  const handlePreviousSlide = () => {
    // Removed setActiveSlide call
  };
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const [topics, setTopics] = useState<SlideTopic[]>([]);
<<<<<<< HEAD
=======

>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).topicsToGenerate) {
        setTopics((window as any).topicsToGenerate);
      }
<<<<<<< HEAD
    }, 200);
=======
    }, 200); // check every 200ms
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
    return () => clearInterval(interval);
  }, []);

  const getTopicForSlide = (slide: Slide): SlideTopic | undefined => {
    if (!slide || !slide.content || !slide.content.title) return undefined;
<<<<<<< HEAD
    const normalize = (str: string) => str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
=======
    // Fuzzy match: ignore punctuation and spaces, match lowercased
    const normalize = (str: string) => str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    console.log('Normalized topic title:', normalize(slide.content.title));
    console.log('Normalized topic titles:', topics.map(t => normalize(t.title)));
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
    return topics.find(
      (topic: SlideTopic) =>
        normalize(topic.title) === normalize(slide.content.title)
    );
  };

<<<<<<< HEAD
  const handleLayoutChange = (slideId: string, newLayout: BackendSlideLayout) => {
    const newSlides = slides.map(slide =>
      slide.id === slideId ? { ...slide, layout: newLayout } : slide
    );
    dispatch(setSlides(newSlides));
  };
=======
  // Debug logs for topic matching
  console.log('topics:', topics);
  console.log('activeSlide:', activeSlide);
  if (activeSlide) {
    console.log('activeSlide.content.title:', activeSlide.content.title);
    console.log('All topic titles:', topics.map(t => t.title));
  }
  if (activeSlide) {
    console.log('getTopicForSlide(activeSlide):', getTopicForSlide(activeSlide));
  }

  if (!activeSlide) return null;
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)

  return (
    <Box ref={editorRef} sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      overflowY: 'hidden',
    }}>
<<<<<<< HEAD
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
=======
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
              disabled={false} 
              size="large"
            >
              <SaveIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)
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
<<<<<<< HEAD
<<<<<<< HEAD
          {!isFullscreen && activeSlide && (
            <EditorControls
              onAddSlide={() => {
                // Prepare a new slide but do not add it yet
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
              }}
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
=======
          {/* Removed activeSlide check */}
          <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
            Select a slide to edit
          </Typography>
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)
=======
          {activeSlide ? (
<<<<<<< HEAD
            <SlideLayoutRenderer slide={activeSlide} />
          ) : (
            <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
              Select a slide to edit
            </Typography>
          )}
>>>>>>> 11d5af65 (Add /api/generate/image endpoint and enhancements)
=======
            <SlideLayoutRenderer
              slide={activeSlide}
              onChange={updated => dispatch(setSlides(slides.map(s => s.id === updated.id ? updated : s)))}
            />
          ) : null}
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
        </Box>
      </Box>
      <SavePresentation
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSave}
        slides={slides}
      />
<<<<<<< HEAD
      {(pendingNewSlide || (activeSlide && topics.length > 0)) && (
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
              dispatch(setActiveSlide(slide.id));
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
=======

<<<<<<< HEAD
<<<<<<< HEAD
      {/* Removed SlideEditDialog */}
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)
=======
      {activeSlide && (
=======
      {activeSlide && topics.length > 0 && (
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
        <SlideEditDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          slide={activeSlide}
          topic={getTopicForSlide(activeSlide)}
          onSave={handleSlideChange}
          onImageUpload={handleImageUpload}
          onImageGenerate={handleImageGenerate}
        />
      )}
>>>>>>> 11d5af65 (Add /api/generate/image endpoint and enhancements)
    </Box>
  );
};

export default SlideEditor;
<<<<<<< HEAD
<<<<<<< HEAD
=======
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
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
