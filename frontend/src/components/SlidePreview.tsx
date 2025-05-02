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
import { API_BASE_URL } from '../../config';
import { Slide } from '../components/types';
import Image from 'next/image';

interface SlidePreviewProps {
  slides: Slide[];
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

  // Helper to get image URL and caption (fix type errors)
  const getImageUrl = (image?: any) => {
    if (!image) return undefined;
    // If image is a string (legacy), treat as URL
    if (typeof image === 'string') {
      // If it's already a full URL, return as is
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
      }
      // Remove leading slash if present
      const cleanPath = image.startsWith('/') ? image.slice(1) : image;
      // If it starts with static/images, use API_BASE_URL
      if (cleanPath.startsWith('static/images/')) {
        return `${API_BASE_URL}/api/images/${cleanPath.replace('static/images/', '')}`;
      }
      return `${API_BASE_URL}/${cleanPath}`;
    }
    // If image is an object with url
    if (image.url) {
      if (image.url.startsWith('http://') || image.url.startsWith('https://')) {
        return image.url;
      }
      const cleanPath = image.url.startsWith('/') ? image.url.slice(1) : image.url;
      if (cleanPath.startsWith('static/images/')) {
        return `${API_BASE_URL}/api/images/${cleanPath.replace('static/images/', '')}`;
      }
      return `${API_BASE_URL}/${cleanPath}`;
    }
    return undefined;
  };

  const getImageCaption = (image?: any) => {
    if (!image) return '';
    if (typeof image === 'string') return '';
    return image.caption || image.alt || '';
  };

  // Helper to safely get array fields
  const getArray = (field: any) => Array.isArray(field) ? field : [];

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
            {currentSlide.content.title}
          </Typography>

          {/* BODY CONTENT: Render HTML or plain text */}
          {currentSlide.content?.body && (
            currentSlide.content.body.trim().startsWith('<') ? (
              <Box
                sx={{ mt: 2, mb: 2, fontSize: '1.25rem', color: 'text.secondary' }}
                dangerouslySetInnerHTML={{ __html: currentSlide.content.body }}
              />
            ) : (
              <Typography sx={{ mt: 2, mb: 2, fontSize: '1.25rem', color: 'text.secondary', whiteSpace: 'pre-line' }}>
                {currentSlide.content.body}
              </Typography>
            )
          )}

          {(currentSlide.content?.image) && (
            <Box sx={{ my: 3, textAlign: 'center' }}>
              <Image
                src={getImageUrl(currentSlide.content.image)}
                alt={getImageCaption(currentSlide.content.image) || 'Slide illustration'}
                width={800}
                height={600}
                style={{
                  objectFit: 'contain',
                  maxHeight: isFullscreen ? '60vh' : '400px',
                  width: 'auto'
                }}
              />
              {getImageCaption(currentSlide.content.image) && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {getImageCaption(currentSlide.content.image)}
                </Typography>
              )}
            </Box>
          )}

          {getArray(currentSlide.content?.bullets).length > 0 && (
            <List>
              {getArray(currentSlide.content.bullets).map((point: any, index: number) => (
                <ListItem key={index}>
                  <ListItemText primary={point.text} />
                </ListItem>
              ))}
            </List>
          )}

          {getArray(currentSlide.content?.examples).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Examples:</Typography>
              <List>
                {getArray(currentSlide.content.examples).map((example: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={example.text || example} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {getArray(currentSlide.content?.discussion_questions).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Discussion Questions:</Typography>
              <List>
                {getArray(currentSlide.content.discussion_questions).map((question: any, index: number) => (
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
