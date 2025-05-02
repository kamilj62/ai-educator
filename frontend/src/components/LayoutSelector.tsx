import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { SlideLayout } from './SlideEditor/types';

interface LayoutOption {
  layout: SlideLayout;
  title: string;
  description: string;
  preview: string;
}

const layoutOptions: LayoutOption[] = [
  {
    layout: 'title-body',
    title: 'Title and Body',
    description: 'Classic layout with a title and text content',
    preview: '📝',
  },
  {
    layout: 'title-bullets',
    title: 'Title and Bullets',
    description: 'Title with bullet points for key information',
    preview: '🔍',
  },
  {
    layout: 'title-body-image',
    title: 'Title, Body, and Image',
    description: 'Title and text with a supporting image',
    preview: '📸',
  },
  {
    layout: 'title-bullets-image',
    title: 'Title, Bullets, and Image',
    description: 'Title with bullet points and an image',
    preview: '📊',
  },
  {
    layout: 'two-column',
    title: 'Two Columns',
    description: 'Split content into two columns',
    preview: '⚡',
  },
  {
    layout: 'two-column-image',
    title: 'Two Columns with Image',
    description: 'Two columns with an image',
    preview: '🎯',
  },
];

interface LayoutSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (layout: SlideLayout) => void;
  topic: string;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  open,
  onClose,
  onSelect,
  topic,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">Choose Layout for &quot;{topic}&quot;</Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {layoutOptions.map((option) => (
            <Grid item xs={12} sm={6} key={option.layout}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 3,
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                }}
                onClick={() => {
                  onSelect(option.layout);
                  onClose();
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h2" sx={{ mr: 2 }}>
                      {option.preview}
                    </Typography>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {option.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LayoutSelector;
