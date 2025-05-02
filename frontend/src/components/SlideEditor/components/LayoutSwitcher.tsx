<<<<<<< HEAD
import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, Grid, Card, CardContent, Typography, IconButton } from '@mui/material';
import { LayoutOption, SlideLayout, layoutOptions } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setSlides } from '../../../store/presentationSlice';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import CloseIcon from '@mui/icons-material/Close';

interface LayoutSwitcherProps {
  layout: SlideLayout;
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

const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({ layout, onLayoutChange }) => {
  const [open, setOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<SlideLayout>(layout);
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
=======
import { Box, Button, Menu, MenuItem, Typography, styled } from '@mui/material';
import { useState } from 'react';
import LayoutIcon from '@mui/icons-material/ViewQuilt';
import { SlideLayout } from '../types';

const LayoutButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  padding: theme.spacing(1, 2),
  gap: theme.spacing(1),
}));

const LayoutPreview = styled(Box)(({ theme }) => ({
  width: '120px',
  height: '80px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(1),
  gap: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const layoutOptions: { [key in SlideLayout]: string } = {
  'title': 'Title Only',
  'title-image': 'Title with Image',
  'title-body': 'Title and Body',
  'title-body-image': 'Title and Body with Image',
  'title-bullets': 'Title and Bullets',
  'title-bullets-image': 'Title and Bullets with Image',
  'two-column': 'Two Columns',
  'two-column-image': 'Two Columns with Image',
};

interface LayoutSwitcherProps {
  currentLayout: SlideLayout;
  onLayoutChange: (layout: SlideLayout) => void;
}

const LayoutSwitcher = ({ currentLayout, onLayoutChange }: LayoutSwitcherProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLayoutSelect = (layout: SlideLayout) => {
    onLayoutChange(layout);
    handleClose();
  };

  return (
    <Box>
      <LayoutButton
        variant="outlined"
        onClick={handleClick}
        startIcon={<LayoutIcon />}
      >
        {layoutOptions[currentLayout]}
      </LayoutButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: '80vh',
            width: '300px',
            p: 1,
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Select Layout
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1,
            }}
          >
            {Object.entries(layoutOptions).map(([layout, label]) => (
              <MenuItem
                key={layout}
                onClick={() => handleLayoutSelect(layout as SlideLayout)}
                selected={currentLayout === layout}
                sx={{ p: 0 }}
              >
                <Box sx={{ p: 1, width: '100%' }}>
                  <LayoutPreview>
                    <Box
                      sx={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'primary.main',
                        opacity: 0.2,
                        mb: 0.5,
                      }}
                    />
                    {layout.includes('image') && (
                      <Box
                        sx={{
                          width: layout.includes('two-column') ? '45%' : '30%',
                          height: '30px',
                          backgroundColor: 'primary.main',
                          opacity: 0.1,
                          alignSelf: layout.includes('two-column')
                            ? 'flex-end'
                            : 'center',
                        }}
                      />
                    )}
                  </LayoutPreview>
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                    {label}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Box>
        </Box>
      </Menu>
    </Box>
>>>>>>> dd7ecbd (added imagen images)
  );
};

export default LayoutSwitcher;
