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
import { BackendSlideLayout, getLayoutFeatures, layoutOptions } from '../types';
import { SlideTopic } from '../../../store/presentationSlice';

interface LayoutOption {
  layout: BackendSlideLayout;
  title: string;
  description: string;
  preview: string;
  features: {
    hasImage: boolean;
    hasBullets: boolean;
  };
}

export interface LayoutSelectorProps {
  open: boolean;
  topic: SlideTopic;
  onSelect: (layout: BackendSlideLayout) => void;
  onClose: () => void;
}

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  open,
  topic,
  onSelect,
  onClose,
}) => {
  const handleSelect = (layout: BackendSlideLayout) => {
    onSelect(layout);
  };

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
          {layoutOptions.map((option) => {
            const features = option.features;
            const isRecommended = (
              (topic.image_prompt && features.hasImage) ||
              (topic.key_points?.length > 0 && features.hasBullets)
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
