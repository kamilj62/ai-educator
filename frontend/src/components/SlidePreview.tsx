import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Slide, BackendSlideLayout, getLayoutFeatures } from './SlideEditor/types';

interface SlidePreviewProps {
  slide: Slide;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({ slide }) => {
  const layoutFeatures = getLayoutFeatures(slide.layout);

  const renderContent = () => {
    switch (slide.layout) {
      case 'title-only':
      case 'title-image':
        return (
          <>
            <Typography variant="h4" align="center" gutterBottom>
              {slide.content.title}
            </Typography>
            {slide.content.subtitle && (
              <Typography variant="h6" align="center" color="textSecondary" gutterBottom>
                {slide.content.subtitle}
              </Typography>
            )}
            {slide.content.image?.url && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <CardMedia
                  component="img"
                  image={slide.content.image.url}
                  alt={slide.content.image.caption || 'Slide image'}
                  sx={{ maxHeight: 300, objectFit: 'contain' }}
                />
              </Box>
            )}
          </>
        );

      case 'title-body':
      case 'title-body-image':
        return (
          <>
            <Typography variant="h5" gutterBottom>
              {slide.content.title}
            </Typography>
            {slide.content.body && (
              <Typography variant="body1" paragraph>
                {slide.content.body}
              </Typography>
            )}
            {slide.content.image?.url && (
              <Box sx={{ mt: 2 }}>
                <CardMedia
                  component="img"
                  image={slide.content.image.url}
                  alt={slide.content.image.caption || 'Slide image'}
                  sx={{ maxHeight: 200, objectFit: 'contain' }}
                />
              </Box>
            )}
          </>
        );

      case 'title-bullets':
      case 'title-bullets-image':
        return (
          <>
            <Typography variant="h5" gutterBottom>
              {slide.content.title}
            </Typography>
            {slide.content.bullets && slide.content.bullets.length > 0 && (
              <List>
                {slide.content.bullets.map((point, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText primary={point.text} />
                  </ListItem>
                ))}
              </List>
            )}
            {slide.content.image?.url && (
              <Box sx={{ mt: 2 }}>
                <CardMedia
                  component="img"
                  image={slide.content.image.url}
                  alt={slide.content.image.caption || 'Slide image'}
                  sx={{ maxHeight: 200, objectFit: 'contain' }}
                />
              </Box>
            )}
          </>
        );

      case 'two-column':
      case 'two-column-image':
        return (
          <>
            <Typography variant="h5" gutterBottom>
              {slide.content.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                {slide.content.columnLeft && (
                  <Typography variant="body1">
                    {slide.content.columnLeft}
                  </Typography>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                {slide.content.columnRight && (
                  <Typography variant="body1">
                    {slide.content.columnRight}
                  </Typography>
                )}
                {slide.content.image?.url && (
                  <CardMedia
                    component="img"
                    image={slide.content.image.url}
                    alt={slide.content.image.caption || 'Slide image'}
                    sx={{ maxHeight: 200, objectFit: 'contain', mt: 2 }}
                  />
                )}
              </Box>
            </Box>
          </>
        );

      default:
        return (
          <Typography variant="body1" color="error">
            Unsupported layout: {slide.layout}
          </Typography>
        );
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default SlidePreview;
