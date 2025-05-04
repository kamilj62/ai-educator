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
import { Slide, ImageService, SlideImage, SlideTopic } from './types';
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

  // Enhance prompts for better image quality
  const IMAGE_PROMPT_QUALITY_TEMPLATE = 'highly detailed, photorealistic, trending on ArtStation, 4k, vibrant colors, dramatic lighting';

  const enhancePrompt = (prompt: string) => {
    if (!prompt) return IMAGE_PROMPT_QUALITY_TEMPLATE;
    // Avoid duplicating the template if user already added it
    if (prompt.toLowerCase().includes('artstation') || prompt.toLowerCase().includes('photorealistic')) {
      return prompt;
    }
    return `${prompt}, ${IMAGE_PROMPT_QUALITY_TEMPLATE}`;
  };

  const handleImageGenerate = async (prompt: string, service: ImageService = 'dalle'): Promise<SlideImage> => {
    try {
      // Enhance the prompt before sending to backend
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
      console.log('[SlideEditor] Image API response:', response);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate image');
      }

      const data = await response.json();
      // Support both imageUrl (old Flask) and image_url (FastAPI)
      let url = data.imageUrl || data.image_url || '';
      // If url is a relative path, prepend backend base URL
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

  const [topics, setTopics] = useState<SlideTopic[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).topicsToGenerate) {
        setTopics((window as any).topicsToGenerate);
      }
    }, 200); // check every 200ms
    return () => clearInterval(interval);
  }, []);

  const getTopicForSlide = (slide: Slide): SlideTopic | undefined => {
    if (!slide || !slide.content || !slide.content.title) return undefined;
    // Fuzzy match: ignore punctuation and spaces, match lowercased
    const normalize = (str: string) => str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    console.log('Normalized topic title:', normalize(slide.content.title));
    console.log('Normalized topic titles:', topics.map(t => normalize(t.title)));
    return topics.find(
      (topic: SlideTopic) =>
        normalize(topic.title) === normalize(slide.content.title)
    );
  };

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
              disabled={false} 
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
            <SlideLayoutRenderer
              slide={activeSlide}
              onChange={updated => dispatch(setSlides(slides.map(s => s.id === updated.id ? updated : s)))}
            />
          ) : null}
        </Box>
      </Box>

      <SavePresentation
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSave}
        slides={slides}
      />

      {activeSlide && topics.length > 0 && (
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
    </Box>
  );
};

export default SlideEditor;
