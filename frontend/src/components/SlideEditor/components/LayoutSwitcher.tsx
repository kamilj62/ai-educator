<<<<<<< HEAD
<<<<<<< HEAD
import React from 'react';
import { useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
=======
<<<<<<< HEAD
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, Grid, Card, CardContent, Typography, IconButton } from '@mui/material';
import { LayoutOption, SlideLayout, layoutOptions } from '../types';
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
<<<<<<< HEAD
import { setSlides } from '../../../store/presentationSlice';
import { SlideLayout, layoutOptions } from '../types';
=======
import { updateSlides } from '../../../store/presentationSlice';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import CloseIcon from '@mui/icons-material/Close';
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)

<<<<<<< HEAD
interface ColorOption {
  label: string;
  value: string;
=======
interface LayoutSwitcherProps {
  layout: SlideLayout;
  onLayoutChange: (layout: SlideLayout) => void;
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
}

const backgroundColors: ColorOption[] = [
  { label: 'White', value: '#fff' },
  { label: 'Blue', value: '#6366f1' },
  { label: 'Black', value: '#18181b' },
  { label: 'Gray', value: '#e5e7eb' },
  { label: 'Custom...', value: 'custom' },
];

<<<<<<< HEAD
const fontColors: ColorOption[] = [
  { label: 'Black', value: '#222' },
  { label: 'White', value: '#fff' },
  { label: 'Blue', value: '#6366f1' },
  { label: 'Gray', value: '#888' },
  { label: 'Custom...', value: 'custom' },
];
=======
const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({ layout, onLayoutChange }) => {
  const [open, setOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<SlideLayout>(layout);
  const dispatch = useDispatch();
<<<<<<< HEAD
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const activeSlideId = useSelector((state: RootState) => state.presentation.activeSlideId);
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
=======
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)

interface LayoutSwitcherProps {
  backgroundColor: string;
  fontColor: string;
  onBackgroundColorChange: (color: string) => void;
  onFontColorChange: (color: string) => void;
}

<<<<<<< HEAD
const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({ backgroundColor, fontColor, onBackgroundColorChange, onFontColorChange }) => {
  const [customBg, setCustomBg] = useState('');
  const [customFont, setCustomFont] = useState('');
=======
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
      dispatch(updateSlides([])); // Pass an empty array of SlideContent

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
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)

  return (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', py: 1 }}>
      <FormControl size="small">
        <InputLabel id="bg-color-label">Slide Background</InputLabel>
        <Select
          labelId="bg-color-label"
          value={backgroundColor.startsWith('#') ? backgroundColor : ''}
          label="Slide Background"
          onChange={e => {
            if (e.target.value === 'custom') return;
            onBackgroundColorChange(e.target.value as string);
          }}
        >
          {backgroundColors.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
        {backgroundColor === 'custom' && (
          <input
            type="color"
            value={customBg}
            onChange={e => {
              setCustomBg(e.target.value);
              onBackgroundColorChange(e.target.value);
            }}
<<<<<<< HEAD
            style={{ marginTop: 8 }}
          />
        )}
      </FormControl>
      <FormControl size="small">
        <InputLabel id="font-color-label">Font Color</InputLabel>
        <Select
          labelId="font-color-label"
          value={fontColor.startsWith('#') ? fontColor : ''}
          label="Font Color"
          onChange={e => {
            if (e.target.value === 'custom') return;
            onFontColorChange(e.target.value as string);
          }}
        >
          {fontColors.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
        {fontColor === 'custom' && (
          <input
            type="color"
            value={customFont}
            onChange={e => {
              setCustomFont(e.target.value);
              onFontColorChange(e.target.value);
            }}
            style={{ marginTop: 8 }}
          />
        )}
      </FormControl>
    </Box>
=======
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
<<<<<<< HEAD
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
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
  );
};

export default LayoutSwitcher;
