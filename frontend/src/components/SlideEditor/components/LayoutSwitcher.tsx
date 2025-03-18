import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, Grid, Card, CardContent, Typography, IconButton } from '@mui/material';
import { LayoutOption, SlideLayout, layoutOptions } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setSlides } from '../../../store/presentationSlice';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import CloseIcon from '@mui/icons-material/Close';

interface LayoutSwitcherProps {
  currentLayout: SlideLayout;
  onLayoutChange: (layout: SlideLayout) => void;
}

const layoutTitles: Record<SlideLayout, string> = {
  'title-only': 'Title Only',
  'title-image': 'Title with Image',
  'title-body': 'Title with Body',
  'title-body-image': 'Title with Body and Image',
  'title-bullets': 'Title with Bullets',
  'title-bullets-image': 'Title with Bullets and Image',
  'two-column': 'Two Columns',
  'two-column-image': 'Two Columns with Image'
};

const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({ currentLayout, onLayoutChange }) => {
  const [open, setOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<SlideLayout>(currentLayout);
  const dispatch = useDispatch();
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const activeSlideId = useSelector((state: RootState) => state.presentation.activeSlideId);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleLayoutSelect = async (newLayout: SlideLayout) => {
    setSelectedLayout(newLayout);
    
    try {
      // Validate the layout change
      const response = await fetch('/api/layout/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newLayout,
          type: 'slide',
          content: {}
        })
      });

      if (!response.ok) {
        console.error('Failed to validate layout:', await response.text());
        return;
      }

      // Update the layout
      if (activeSlideId) {
        const updatedSlides = slides.map(slide =>
          slide.id === activeSlideId
            ? { ...slide, layout: newLayout }
            : slide
        );
        dispatch(setSlides(updatedSlides));
      }

      onLayoutChange(newLayout);
      handleClose();
    } catch (error) {
      console.error('Error switching layout:', error);
    }
  };

  const getLayoutPreview = (layout: LayoutOption) => {
    return (
      <Box sx={{ textAlign: 'center', p: 1 }}>
        <Typography variant="h3" sx={{ fontSize: '2rem', mb: 1 }}>
          {layout.preview}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          {layout.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {layout.description}
        </Typography>
      </Box>
    );
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        startIcon={<ViewQuiltIcon />}
        variant="outlined"
        size="small"
      >
        Change Layout
      </Button>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Choose Layout
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {layoutOptions.map((layout) => (
              <Grid item xs={12} sm={6} md={4} key={layout.layout}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: layout.layout === selectedLayout ? 'primary.light' : 'background.paper',
                    '&:hover': {
                      bgcolor: layout.layout === selectedLayout 
                        ? 'primary.light' 
                        : 'action.hover'
                    }
                  }}
                  onClick={() => handleLayoutSelect(layout.layout)}
                >
                  <CardContent>
                    {getLayoutPreview(layout)}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LayoutSwitcher;
