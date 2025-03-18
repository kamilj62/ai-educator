import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
} from '@mui/material';

export interface SlideLayout {
  id: string;
  name: string;
  description: string;
  image: string;
}

export const slideLayouts: SlideLayout[] = [
  {
    id: 'title',
    name: 'Title Slide',
    description: 'A clean title slide with an optional subtitle',
    image: '/title-slide.png'
  },
  {
    id: 'title-image',
    name: 'Title with Image',
    description: 'Title slide with a supporting image',
    image: '/title-image.png'
  },
  {
    id: 'title-body',
    name: 'Title and Body',
    description: 'Title with detailed paragraph text',
    image: '/title-body.png'
  },
  {
    id: 'title-body-image',
    name: 'Title, Body, and Image',
    description: 'Title with text and a supporting image',
    image: '/title-body-image.png'
  },
  {
    id: 'title-bullets',
    name: 'Title with Bullets',
    description: 'Title with key points as bullet points',
    image: '/title-bullets.png'
  },
  {
    id: 'title-bullets-image',
    name: 'Title, Bullets, and Image',
    description: 'Title with bullet points and an image',
    image: '/title-bullets-image.png'
  },
  {
    id: 'two-column',
    name: 'Two Columns',
    description: 'Content split into two columns',
    image: '/two-column.png'
  },
  {
    id: 'two-column-image',
    name: 'Two Columns with Image',
    description: 'Two columns of content with an image',
    image: '/two-column-image.png'
  }
];

interface SlideLayoutModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (layout: string) => void;
}

export const SlideLayoutModal: React.FC<SlideLayoutModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Choose a Slide Layout
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {slideLayouts.map((layout) => (
            <Grid item xs={12} sm={6} md={4} key={layout.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'scale(1.02)',
                    transition: 'all 0.2s ease-in-out',
                  },
                }}
                onClick={() => {
                  onSelect(layout.id);
                  onClose();
                }}
              >
                <Box 
                  component="img"
                  src={layout.image}
                  alt={layout.name}
                  sx={{ 
                    width: '100%',
                    height: 140,
                    objectFit: 'contain',
                    bgcolor: 'grey.50',
                    p: 2,
                  }}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {layout.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {layout.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
