import React from 'react';
import { useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setSlides } from '../../../store/presentationSlice';
import { SlideLayout, layoutOptions } from '../types';

<<<<<<< HEAD
interface ColorOption {
  label: string;
  value: string;
=======
interface LayoutSwitcherProps {
  layout: SlideLayout;
  onLayoutChange: (layout: SlideLayout) => void;
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
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
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const activeSlideId = useSelector((state: RootState) => state.presentation.activeSlideId);
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)

interface LayoutSwitcherProps {
  backgroundColor: string;
  fontColor: string;
  onBackgroundColorChange: (color: string) => void;
  onFontColorChange: (color: string) => void;
}

const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({ backgroundColor, fontColor, onBackgroundColorChange, onFontColorChange }) => {
  const [customBg, setCustomBg] = useState('');
  const [customFont, setCustomFont] = useState('');

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
