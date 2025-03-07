import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import { NavigateNext, NavigateBefore } from '@mui/icons-material';
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
    // Extract image name from the static/images path
    const imageName = imageUrl.replace('static/images/', '');
    const fullUrl = `${API_BASE_URL}/api/images/${imageName}`;
    console.log('Image URL construction:', {
      originalUrl: imageUrl,
      imageName,
      apiBaseUrl: API_BASE_URL,
      fullUrl
    });
    return fullUrl;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton 
          onClick={onPrevious} 
          disabled={currentIndex === 0}
          sx={{ mr: 1 }}
        >
          <NavigateBefore />
        </IconButton>
        <Typography variant="body1" sx={{ mx: 2 }}>
          Slide {currentIndex + 1} of {slides.length}
        </Typography>
        <IconButton 
          onClick={onNext} 
          disabled={currentIndex === slides.length - 1}
          sx={{ ml: 1 }}
        >
          <NavigateNext />
        </IconButton>
      </Box>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 1, bgcolor: 'background.paper' }}>
        <Typography variant="h4" gutterBottom>
          {currentSlide.title}
        </Typography>
        {currentSlide.subtitle && (
          <Typography variant="h6" gutterBottom color="text.secondary">
            {currentSlide.subtitle}
          </Typography>
        )}
        {currentSlide.image_url && (
          <Box sx={{ my: 3, textAlign: 'center' }}>
            <img 
              src={getImageUrl(currentSlide.image_url)}
              alt={currentSlide.image_caption || 'Slide illustration'}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '400px',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            />
            {currentSlide.image_caption && (
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                {currentSlide.image_caption}
              </Typography>
            )}
          </Box>
        )}
        {currentSlide.introduction && (
          <Typography variant="body1" paragraph>
            {currentSlide.introduction}
          </Typography>
        )}
        {currentSlide.bullet_points?.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'medium' }}>
              Key Points:
            </Typography>
            <List>
              {currentSlide.bullet_points.map((bullet, idx) => (
                <ListItem key={idx} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={bullet.text}
                    secondary={
                      bullet.sub_points?.length > 0 && (
                        <List dense>
                          {bullet.sub_points.map((sub, subIdx) => (
                            <ListItem key={subIdx} sx={{ py: 0.5 }}>
                              <ListItemText secondary={`• ${sub}`} />
                            </ListItem>
                          ))}
                        </List>
                      )
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
        {currentSlide.examples?.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'medium' }}>
              Examples:
            </Typography>
            <List>
              {currentSlide.examples.map((example, idx) => (
                <ListItem key={idx} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={example.text}
                    secondary={
                      example.details?.length > 0 && (
                        <List dense>
                          {example.details.map((detail, detailIdx) => (
                            <ListItem key={detailIdx} sx={{ py: 0.5 }}>
                              <ListItemText secondary={`• ${detail}`} />
                            </ListItem>
                          ))}
                        </List>
                      )
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
        {currentSlide.key_takeaway && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'medium' }}>
              Key Takeaway:
            </Typography>
            <Typography variant="body1" paragraph>
              {currentSlide.key_takeaway}
            </Typography>
          </>
        )}
        {currentSlide.discussion_questions?.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'medium' }}>
              Discussion Questions:
            </Typography>
            <List>
              {currentSlide.discussion_questions.map((question, idx) => (
                <ListItem key={idx} sx={{ py: 0.5 }}>
                  <ListItemText primary={`${idx + 1}. ${question}`} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default SlidePreview;
