import React, { useState, useEffect, useCallback } from 'react';
import { ChromePicker } from 'react-color';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Stack,
  Popover
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Slide } from '../../types';
import { convertLayoutToFrontend, convertLayoutToBackend } from '../utils';
import ImageUploader from './ImageUploader';
import TiptapEditor from './TiptapEditor'; // Fix TiptapEditor import to use named import if required
import { HexColorPicker } from 'react-colorful';

interface SlideEditDialogProps {
  open: boolean;
  onClose: () => void;
  slide: Slide;
  topic?: any;
  onSave: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: string) => Promise<any>;
}

const layoutOptions: { value: string; label: string; description: string }[] = [
  {
    value: 'title-only',
    label: 'Title Only',
    description: 'A single title, no subtitle or bullets',
  },
  {
    value: 'title-bullets',
    label: 'Title & Bullets',
    description: 'A title with bullet points below',
  },
  {
    value: 'title-bullets-image',
    label: 'Title, Bullets & Image',
    description: 'A title with bullet points and an image below',
  },
  {
    value: 'title-image',
    label: 'Title & Image',
    description: 'A title with an image below',
  },
  {
    value: 'two-column',
    label: 'Two Columns',
    description: 'Content split into two columns',
  },
];

const backgroundColors = [
  { label: 'White', value: '#fff' },
  { label: 'Blue', value: '#6366f1' },
  { label: 'Black', value: '#18181b' },
  { label: 'Gray', value: '#e5e7eb' },
  { label: 'Custom...', value: 'custom' },
];

const fontColors = [
  { label: 'Black', value: '#222' },
  { label: 'White', value: '#fff' },
  { label: 'Blue', value: '#6366f1' },
  { label: 'Gray', value: '#888' },
  { label: 'Custom...', value: 'custom' },
];

const SlideEditDialog: React.FC<SlideEditDialogProps> = ({
  open,
  onClose,
  slide,
  topic,
  onSave,
  onImageUpload,
  onImageGenerate,
}) => {
  // Type definitions for bullet items
  type BulletItem = string | { text: string };
  type BulletArray = string[];

  // Helper to parse bullets from HTML string to array
  const parseBulletsFromHtml = (html: string): BulletArray => {
    if (!html) return [];
    if (typeof html !== 'string') return [];
    
    // If it's already an empty list
    if (html.trim() === '<ul></ul>') return [];
    
    // Extract list items
    const listItems = html
      .replace(/<ul[^>]*>/g, '')
      .replace(/<\/ul>/g, '')
      .split(/<li[^>]*>|<\/li>/g)
      .map(item => item.trim())
      .filter(Boolean);
      
    return listItems;
  };

  // Helper to convert bullet array to HTML string
  const bulletsToHtml = (bullets: BulletArray): string => {
    if (!bullets || !bullets.length) return '<ul></ul>';
    const validBullets = bullets.filter((b): b is string => typeof b === 'string');
    return `<ul>${validBullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
  };

  // Helper to normalize bullets to HTML string
  function normalizeBulletsForDialog(bullets: unknown): string {
    if (!bullets) return '<ul></ul>';
    
    // Handle string input
    if (typeof bullets === 'string') {
      const trimmed = bullets.trim();
      if (!trimmed) return '<ul></ul>';
      if (trimmed.startsWith('<ul')) return bullets;
      if (trimmed.startsWith('<li>')) return `<ul>${bullets}</ul>`;
      const lines = bullets.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length) return `<ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
      return '<ul></ul>';
    }
    
    // Handle array input
    if (Array.isArray(bullets)) {
      if (bullets.length === 0) return '<ul></ul>';
      
      const lines = bullets
        .map(b => {
          if (typeof b === 'string') return b;
          if (b && typeof b === 'object' && 'text' in b) return (b as { text: string }).text;
          return '';
        })
        .filter((b): b is string => Boolean(b));
        
      return bulletsToHtml(lines);
    }
    
    return '<ul></ul>';
  }

  // Only update editedSlide when the dialog is opened or the slide changes (not on every render)
  const [editedSlide, setEditedSlide] = useState<Slide>(() => {
    const baseContent = {
      ...slide.content,
      bullets: normalizeBulletsForDialog(slide.content.bullets),
    };
    const layout = convertLayoutToFrontend(slide.layout);
    if (!baseContent.image) {
      baseContent.image = {
        url: '',
        alt: '',
        prompt: '',
        service: 'generated',
      };
    }
    return {
      ...slide,
      layout,
      content: baseContent,
    };
  });

  useEffect(() => {
    if (open) {
      const validLayout = convertLayoutToFrontend(slide.layout);
      const baseContent = {
        ...slide.content,
        bullets: normalizeBulletsForDialog(slide.content.bullets),
      };
      if (!baseContent.image) {
        baseContent.image = {
          url: '',
          alt: '',
          prompt: '',
          service: 'generated',
        };
      }
      setEditedSlide({
        ...slide,
        layout: validLayout,
        content: baseContent,
      });
    }
    // Only re-run when dialog opens or slide changes
  }, [open, slide]);

  const [bodyError, setBodyError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [colorPickerAnchorEl, setColorPickerAnchorEl] = useState<HTMLElement | null>(null);
  const [currentColorType, setCurrentColorType] = useState<'background' | 'font' | null>(null);

  const handleLayoutChange = (newLayout: string) => {
    setEditedSlide((prev) => {
      // Remove image if switching to a layout that does not support images
      const imageLayouts = [
        'title-bullets-image',
        'title-image',
        'two-column-image',
      ];
      const shouldKeepImage = imageLayouts.includes(newLayout);
      return {
        ...prev,
        layout: newLayout,
        content: {
          ...prev.content,
          image: shouldKeepImage ? prev.content.image : undefined,
        },
      };
    });
  };

  const handleTitleChange = (content: string) => {
    setEditedSlide({
      ...editedSlide,
      content: { ...editedSlide.content, title: content },
    });
  };

  const handleSubtitleChange = (value: string) => {
    setEditedSlide({
      ...editedSlide,
      content: { ...editedSlide.content, subtitle: value },
    });
  };

  const handleBodyChange = (content: string) => {
    setEditedSlide({
      ...editedSlide,
      content: { ...editedSlide.content, body: content },
    });
  };

  const handleBulletAdd = () => {
    // Parse the current bullets HTML string into an array, add a new empty bullet, then convert back to HTML string
    const bulletsArr = parseBulletsFromHtml(
      typeof editedSlide.content.bullets === 'string' 
        ? editedSlide.content.bullets 
        : '<ul></ul>'
    );
    bulletsArr.push('');
    
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: bulletsToHtml(bulletsArr),
      },
    });
  };

  const handleBulletChange = (index: number, value: string) => {
    // Parse HTML to array, update the bullet at the given index, then convert back to HTML
    const bulletsArr = parseBulletsFromHtml(
      typeof editedSlide.content.bullets === 'string' 
        ? editedSlide.content.bullets 
        : '<ul></ul>'
    );
    
    // Update the bullet at the given index
    if (index >= 0 && index < bulletsArr.length) {
      bulletsArr[index] = value;
    } else if (index === bulletsArr.length) {
      bulletsArr.push(value);
    }
    
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: bulletsToHtml(bulletsArr),
      },
    });
  };

  const handleBulletDelete = (index: number) => {
    // Parse HTML to array, remove the bullet at the given index, then convert back to HTML
    const bulletsArr = parseBulletsFromHtml(
      typeof editedSlide.content.bullets === 'string' 
        ? editedSlide.content.bullets 
        : '<ul></ul>'
    );
    
    // Remove the bullet at the given index if it exists
    if (index >= 0 && index < bulletsArr.length) {
      bulletsArr.splice(index, 1);
    }
    
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: bulletsToHtml(bulletsArr),
      },
    });
  };

  const handleColumnLeftChange = (content: string) => {
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        columnLeft: content,
      },
    });
  };

  const handleColumnRightChange = (content: string) => {
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        columnRight: content,
      },
    });
  };

  const handleImageChange = useCallback((image: any) => {
    setEditedSlide((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        image,
      },
    }));
  }, []);

  const handleImageGenerate = useCallback(async (prompt: string, service: string = 'dalle'): Promise<any> => {
    if (!onImageGenerate) {
      throw new Error('onImageGenerate is not defined');
    }
    const image = await onImageGenerate(prompt, service);
    handleImageChange(image);
    return image;
  }, [onImageGenerate, handleImageChange]);

  const handleBgColorChange = (color: string) => {
    // If selecting 'custom', don't update the color yet
    if (color === 'custom') return;
    
    setEditedSlide((prev) => ({
      ...prev,
      backgroundColor: color,
    }));
  };

  const handleFontColorChange = (color: string) => {
    // If selecting 'custom', don't update the color yet
    if (color === 'custom') return;
    
    setEditedSlide((prev) => ({
      ...prev,
      fontColor: color,
    }));
  };

  const handleColorPickerOpen = (event: React.MouseEvent<HTMLElement>, type: 'background' | 'font') => {
    event.stopPropagation();
    event.preventDefault();
    setCurrentColorType(type);
    setColorPickerAnchorEl(event.currentTarget);
  };

  const handleColorPickerClose = () => {
    setColorPickerAnchorEl(null);
    setCurrentColorType(null);
  };

  const handleCustomColorChange = (color: any) => {
    if (!color || !color.hex) return;
    
    if (currentColorType === 'background') {
      setEditedSlide(prev => ({
        ...prev,
        backgroundColor: color.hex
      }));
    } else if (currentColorType === 'font') {
      setEditedSlide(prev => ({
        ...prev,
        fontColor: color.hex
      }));
    }
  };

  useEffect(() => {
    if ((editedSlide.layout === 'title-bullets' || editedSlide.layout === 'title-bullets-image')) {
      const bullets = editedSlide.content.bullets;
      const isEmpty = !bullets || 
                    (typeof bullets === 'string' && bullets.trim() === '') ||
                    (Array.isArray(bullets) && bullets.length === 0);
      
      if (isEmpty) {
        setBodyError('Bullet points are empty or missing.');
      } else {
        setBodyError(null);
      }
    } else {
      setBodyError(null);
    }
  }, [editedSlide.layout, editedSlide.content.bullets]);

  useEffect(() => {
    if (editedSlide.layout.includes('image')) {
      if (!editedSlide.content.image || !editedSlide.content.image.url) {
        setImageError('Image is missing or not set. You can save without an image, or generate/upload one below.');
      } else {
        setImageError(null);
      }
    } else {
      setImageError(null);
    }
  }, [editedSlide.layout, editedSlide.content.image]);

  const handleSave = () => {
    onSave({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        title: getHtmlContent(editedSlide.content.title),
        body: getHtmlContent(editedSlide.content.body),
        bullets: getHtmlContent(editedSlide.content.bullets),
      },
    });
    onClose();
  };

  const getHtmlContent = (content: any): string => {
    if (!content) return '';
    if (typeof content !== 'string') return '';
    if (content.startsWith('<')) return content;
    return `<p>${content}</p>`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Slide</DialogTitle>
      <DialogContent>
        {(editedSlide.layout === 'title-bullets-image' || editedSlide.layout === 'title-image') && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              onClick={() => handleImageGenerate(editedSlide.content.title || topic?.title || 'Generate slide content')}
              startIcon={<AutoAwesomeIcon />}
              variant="outlined"
              color="secondary"
              sx={{ minWidth: 180 }}
            >
              AI Generate Image
            </Button>
          </Box>
        )}
        <Box sx={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          bgcolor: 'background.paper',
          pb: 1,
          pt: 1,
          mb: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="bg-color-label">Slide Background</InputLabel>
              <Select
                labelId="bg-color-label"
                value={editedSlide.backgroundColor}
                label="Slide Background"
                onChange={(e) => handleBgColorChange(e.target.value as string)}
                renderValue={(value) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: value === 'custom' ? (editedSlide.backgroundColor || '#ffffff') : value,
                        border: '1px solid #ccc',
                        borderRadius: '50%',
                      }}
                    />
                    {value === 'custom' ? 'Custom' : value}
                  </Box>
                )}
              >
                {backgroundColors.map((opt) => (
                  <MenuItem 
                    key={opt.value} 
                    value={opt.value}
                    onClick={(e) => {
                      if (opt.value === 'custom') {
                        e.preventDefault();
                        handleColorPickerOpen(e as any, 'background');
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: opt.value === 'custom' ? 'transparent' : opt.value,
                          border: '1px solid #ccc',
                          borderRadius: '50%',
                          background: opt.value === 'custom' ? 'linear-gradient(45deg, #ff0000, #ff9900, #ffff00, #33cc33, #3399ff, #cc33ff, #ff0066)' : 'none'
                        }}
                      />
                      {opt.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="font-color-label">Font Color</InputLabel>
              <Select
                labelId="font-color-label"
                value={editedSlide.fontColor}
                label="Font Color"
                onChange={(e) => handleFontColorChange(e.target.value as string)}
                renderValue={(value) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: value === 'custom' ? (editedSlide.fontColor || '#000000') : value,
                        border: '1px solid #ccc',
                        borderRadius: '50%',
                      }}
                    />
                    {value === 'custom' ? 'Custom' : value}
                  </Box>
                )}
              >
                {fontColors.map((opt) => (
                  <MenuItem 
                    key={opt.value} 
                    value={opt.value}
                    onClick={(e) => {
                      if (opt.value === 'custom') {
                        e.preventDefault();
                        handleColorPickerOpen(e as any, 'font');
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: opt.value === 'custom' ? 'transparent' : opt.value,
                          border: '1px solid #ccc',
                          borderRadius: '50%',
                          background: opt.value === 'custom' ? 'linear-gradient(45deg, #000000, #666666, #999999, #cccccc, #ffffff)' : 'none'
                        }}
                      />
                      {opt.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="layout-label">Layout</InputLabel>
            <Select
              labelId="layout-label"
              value={editedSlide.layout}
              label="Layout"
              onChange={(e) => handleLayoutChange(e.target.value as string)}
            >
              {layoutOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TiptapEditor
            content={getHtmlContent(editedSlide.content.title)}
            onChange={handleTitleChange}
            placeholder="Enter slide title..."
          />
          {(editedSlide.layout !== 'title-only') && (
            <TextField
              label="Subtitle"
              fullWidth
              value={editedSlide.content.subtitle || ''}
              onChange={(e) => handleSubtitleChange(e.target.value)}
            />
          )}
          {(editedSlide.layout === 'title-body' || editedSlide.layout === 'title-body-image') && (
            <TiptapEditor
              content={getHtmlContent(editedSlide.content.body)}
              onChange={handleBodyChange}
              placeholder="Enter slide body..."
            />
          )}
          {(editedSlide.layout === 'title-bullets' || editedSlide.layout === 'title-bullets-image') && (
            <Box>
              <Typography variant="h6" gutterBottom>Bullet Points</Typography>
              {(() => {
                // Parse HTML to array for editing using our helper function
                const bulletsArr = parseBulletsFromHtml(
                  typeof editedSlide.content.bullets === 'string' 
                    ? editedSlide.content.bullets 
                    : '<ul></ul>'
                );
                
                return bulletsArr.map((bullet, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      value={bullet}
                      onChange={e => handleBulletChange(index, e.target.value)}
                      placeholder={`Bullet point ${index + 1}`}
                    />
                    <IconButton onClick={() => handleBulletDelete(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ));
              })()}
              <Button onClick={handleBulletAdd} variant="outlined" sx={{ mt: 1 }}>
                Add Bullet
              </Button>
            </Box>
          )}
          {editedSlide.layout === 'two-column' && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TiptapEditor
                  content={getHtmlContent(editedSlide.content.columnLeft)}
                  onChange={handleColumnLeftChange}
                  placeholder="Enter left column content..."
                />
              </Grid>
              <Grid item xs={6}>
                <TiptapEditor
                  content={getHtmlContent(editedSlide.content.columnRight)}
                  onChange={handleColumnRightChange}
                  placeholder="Enter right column content..."
                />
              </Grid>
            </Grid>
          )}
          {(editedSlide.layout === 'title-image' || 
            editedSlide.layout === 'title-bullets-image') && (
            <Box>
              <Typography variant="h6" gutterBottom>Image</Typography>
              <ImageUploader
                image={editedSlide.content.image}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
                onImageGenerate={handleImageGenerate}
                prompt={editedSlide.content.title || topic?.title || 'Generate slide content'}
              />
              {imageError && (
                <Typography color="warning" variant="body2" sx={{ mt: 1 }}>{imageError}</Typography>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Popover
          open={Boolean(colorPickerAnchorEl)}
          anchorEl={colorPickerAnchorEl}
          onClose={handleColorPickerClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <ChromePicker
            color={currentColorType === 'background' 
              ? editedSlide.backgroundColor || '#ffffff' 
              : editedSlide.fontColor || '#000000'}
            onChange={handleCustomColorChange}
          />
        </Popover>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlideEditDialog;
