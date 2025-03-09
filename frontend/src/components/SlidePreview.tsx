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
import { Slide } from '../components/types';

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

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await slideRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
    const imageName = imageUrl.replace('static/images/', '');
    const fullUrl = `${imageUrl}`;
    console.log('Image URL construction:', {
      originalUrl: imageUrl,
      imageName,
      fullUrl
    });
    return fullUrl;

    return `${API_BASE_URL}/api/images/${imageName}`;
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
