import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  DialogActions,
  Button,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { SlideTopic } from '../../types';
import { getLayoutFeatures } from '../types';

interface LayoutOption {
  layout: string;
  title: string;
  description: string;
  preview: string;
  features: {
    supportsImage: boolean;
    supportsBullets: boolean;
  };
}

export interface LayoutSelectorProps {
  open: boolean;
  topic: SlideTopic;
  onSelect: (layout: string) => void;
  onClose: () => void;
}

function addLegacyFeatureKeys(features: any): any {
  return {
    ...features,
    hasImage: features.supportsImage,
    hasBullets: features.supportsBullets,
  };
}

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  open,
  topic,
  onSelect,
  onClose,
}) => {
  const handleSelect = (layout: string) => {
    onSelect(layout);
  };

  const layoutOptionsList: LayoutOption[] = [
    {
      layout: 'title-only',
      title: 'Title Only',
      description: 'Simple title slide with optional subtitle',
      preview: '📝',
      features: addLegacyFeatureKeys(getLayoutFeatures('title-only')),
    },
    {
      layout: 'title-image',
      title: 'Title with Image',
      description: 'Title slide with an image',
      preview: '🖼️',
      features: addLegacyFeatureKeys(getLayoutFeatures('title-image')),
    },
    {
      layout: 'title-body',
      title: 'Title and Body',
      description: 'Classic layout with a title and text content',
      preview: '📝',
      features: addLegacyFeatureKeys(getLayoutFeatures('title-body')),
    },
    {
      layout: 'title-body-image',
      title: 'Title, Body, and Image',
      description: 'Layout with a title, text content, and an image',
      preview: '📝🖼️',
      features: addLegacyFeatureKeys(getLayoutFeatures('title-body-image')),
    },
    {
      layout: 'title-bullets',
      title: 'Title and Bullets',
      description: 'Title slide with bullet points',
      preview: '📝•••',
      features: addLegacyFeatureKeys(getLayoutFeatures('title-bullets')),
    },
    {
      layout: 'title-bullets-image',
      title: 'Title, Bullets, and Image',
      description: 'Layout with a title, bullet points, and an image',
      preview: '📝•••🖼️',
      features: addLegacyFeatureKeys(getLayoutFeatures('title-bullets-image')),
    },
    {
      layout: 'two-column',
      title: 'Two Columns',
      description: 'Title with two text columns',
      preview: '🔲🔲',
      features: addLegacyFeatureKeys(getLayoutFeatures('two-column')),
    },
    {
      layout: 'two-column-image',
      title: 'Two Columns with Image',
      description: 'Two columns of text and an image',
      preview: '🔲🔲🖼️',
      features: addLegacyFeatureKeys(getLayoutFeatures('two-column-image')),
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Select Layout</Typography>
          <IconButton edge="end" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {layoutOptionsList.map((option) => {
            const features = option.features;
            // Fix property names to match actual type
            const isRecommended = (
              (topic.image_prompt && features.supportsImage) ||
              (topic.bullet_points?.length > 0 && features.supportsBullets)
            );

            return (
              <Grid item xs={12} sm={6} md={4} key={option.layout}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, border-color 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      borderColor: 'primary.main',
                    },
                    border: isRecommended ? '2px solid' : '1px solid',
                    borderColor: isRecommended ? 'primary.main' : 'divider',
                  }}
                  onClick={() => handleSelect(option.layout)}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography variant="h2" sx={{ fontSize: '3rem' }}>
                        {option.preview}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {option.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                      {isRecommended && (
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ mt: 'auto', pt: 1 }}
                        >
                          Recommended for this content
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
