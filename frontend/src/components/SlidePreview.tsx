import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import { NavigateNext, NavigateBefore, Fullscreen, FullscreenExit } from '@mui/icons-material';
import { SlideContent } from '../store/presentationSlice';
import { API_BASE_URL } from '../../config';

interface SlidePreviewProps {
  slides: SlideContent[];
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({
  slides = [],
  currentIndex = 0,
  onPrevious,
  onNext,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const slideRef = React.useRef<HTMLDivElement>(null);

  // Check if fullscreen is supported
  const isFullscreenSupported = document.fullscreenEnabled || 
    (document as any).webkitFullscreenEnabled || 
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled;

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreenSupported) {
        console.warn('Fullscreen mode is not supported in this browser');
        return;
      }

      if (!document.fullscreenElement) {
        if (slideRef.current) {
          // Try different vendor prefixes for better browser support
          if (slideRef.current.requestFullscreen) {
            await slideRef.current.requestFullscreen();
          } else if ((slideRef.current as any).webkitRequestFullscreen) {
            await (slideRef.current as any).webkitRequestFullscreen();
          } else if ((slideRef.current as any).mozRequestFullScreen) {
            await (slideRef.current as any).mozRequestFullScreen();
          } else if ((slideRef.current as any).msRequestFullscreen) {
            await (slideRef.current as any).msRequestFullscreen();
          }
          setIsFullscreen(true);
        }
      } else {
        // Try different vendor prefixes for exiting fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      // Some browsers may not support fullscreen or may deny the request
      console.error('Fullscreen error:', err instanceof Error ? err.message : 'Fullscreen mode not supported');
      // Continue in non-fullscreen mode
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isInFullscreen);
    };

    // Add event listeners for all vendor prefixes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      // Clean up event listeners
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  if (!slides || slides.length === 0 || !slides[currentIndex]) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No slide content available. Please generate slides first.
        </Typography>
      </Box>
    );
  }

  const currentSlide = slides[currentIndex];

  const getImageUrl = (imageUrl: string) => {
    // If it's already a full URL, return it as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Handle case where imageUrl might start with a slash
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    // Construct the full URL
    return `${API_BASE_URL}/${cleanPath}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper 
        ref={slideRef}
        elevation={2} 
        sx={{ 
          p: 3, 
          borderRadius: 1, 
          bgcolor: 'background.paper',
          ...(isFullscreen && {
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: '2rem',
            borderRadius: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
          })
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          ...(isFullscreen && {
            position: 'fixed',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 1001
          })
        }}>
          <IconButton onClick={onPrevious} disabled={currentIndex === 0}>
            <NavigateBefore />
          </IconButton>
          <Typography variant="body1">
            Slide {currentIndex + 1} of {slides.length}
          </Typography>
          <Box>
            <IconButton onClick={toggleFullscreen} sx={{ mr: 1 }}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
            <IconButton onClick={onNext} disabled={currentIndex === slides.length - 1}>
              <NavigateNext />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ mt: isFullscreen ? 6 : 0 }}>
          <Typography variant="h4" gutterBottom>
            {currentSlide.title}
          </Typography>

          {currentSlide.image_url && (
            <Box sx={{ my: 3, textAlign: 'center' }}>
              <img 
                src={getImageUrl(currentSlide.image_url)}
                alt={currentSlide.image_caption || 'Slide illustration'}
                style={{ 
                  maxWidth: '100%',
                  maxHeight: isFullscreen ? '50vh' : '400px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              />
              {currentSlide.image_caption && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {currentSlide.image_caption}
                </Typography>
              )}
            </Box>
          )}

          {currentSlide.bullet_points?.length > 0 && (
            <List>
              {currentSlide.bullet_points.map((point, index) => (
                <ListItem key={index}>
                  <ListItemText primary={point.text} />
                </ListItem>
              ))}
            </List>
          )}

          {currentSlide.examples?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Examples:</Typography>
              <List>
                {currentSlide.examples.map((example, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={example.text} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {currentSlide.discussion_questions?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Discussion Questions:</Typography>
              <List>
                {currentSlide.discussion_questions.map((question, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={question} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SlidePreview;
