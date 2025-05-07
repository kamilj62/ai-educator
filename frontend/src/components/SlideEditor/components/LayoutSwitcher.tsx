import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, Grid, Card, CardContent, Typography, IconButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LayoutOption, layoutOptions } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setSlides } from '../../../store/presentationSlice';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import CloseIcon from '@mui/icons-material/Close';

interface LayoutSwitcherProps {
  layout: string;
  onLayoutChange: (layout: string) => void;
  onClose?: () => void;
}

const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({ layout, onLayoutChange, onClose }) => {
  const [open, setOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<string>(layout);
  const dispatch = useDispatch();
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const activeSlideId = useSelector((state: RootState) => state.presentation.activeSlideId);

  const backgroundColors = [
    { value: 'white', label: 'White' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'blue', label: 'Blue' },
    { value: 'custom', label: 'Custom' }
  ];
  const fontColors = [
    { value: 'black', label: 'Black' },
    { value: 'gray', label: 'Gray' },
    { value: 'custom', label: 'Custom' }
  ];

  const [backgroundColor, setBackgroundColor] = useState('white');
  const [customBg, setCustomBg] = useState('#ffffff');
  const [fontColor, setFontColor] = useState('black');
  const [customFont, setCustomFont] = useState('#000000');

  const onBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    if (color !== 'custom') setCustomBg('');
  };
  const onFontColorChange = (color: string) => {
    setFontColor(color);
    if (color !== 'custom') setCustomFont('');
  };

  const handleClose = () => {
    if (typeof onClose === 'function') onClose();
  };

  const handleLayoutSelect = async (newLayout: string) => {
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
      dispatch(setSlides([])); // Pass an empty array of SlideContent

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
  );
};

export default LayoutSwitcher;
