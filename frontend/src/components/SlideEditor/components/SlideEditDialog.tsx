import React, { useState, useEffect, useCallback } from 'react';
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
  Stack
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
  // Helper to normalize bullets to HTML string
  function normalizeBulletsForDialog(bullets: any): string {
    if (!bullets) return '';
    if (typeof bullets === 'string') {
      if (bullets.trim().startsWith('<ul')) return bullets;
      const lines = bullets.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length) return `<ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
      return '';
    }
    if (Array.isArray(bullets)) {
      const lines = bullets.map(b => typeof b === 'string' ? b : (b && b.text ? b.text : '')).filter(Boolean);
      if (lines.length) return `<ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
      return '';
    }
    return '';
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
    let bulletsArr: string[] = [];
    if (typeof editedSlide.content.bullets === 'string') {
      bulletsArr = editedSlide.content.bullets
        .replace(/<ul>|<\/ul>/g, '')
        .split(/<li>|<\/li>/)
        .map(b => b.trim())
        .filter(Boolean);
    }
    bulletsArr.push('');
    const bulletsHtml = `<ul>${bulletsArr.map(b => `<li>${b}</li>`).join('')}</ul>`;
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: bulletsHtml,
      },
    });
  };

  const handleBulletChange = (index: number, value: string) => {
    // Parse HTML to array, change, then convert back to HTML
    let bulletsArr: string[] = [];
    if (typeof editedSlide.content.bullets === 'string') {
      bulletsArr = editedSlide.content.bullets
        .replace(/<ul>|<\/ul>/g, '')
        .split(/<li>|<\/li>/)
        .map(b => b.trim())
        .filter(Boolean);
    }
    bulletsArr[index] = value;
    const bulletsHtml = `<ul>${bulletsArr.map(b => `<li>${b}</li>`).join('')}</ul>`;
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: bulletsHtml,
      },
    });
  };

  const handleBulletDelete = (index: number) => {
    // Parse HTML to array, delete, then convert back to HTML
    let bulletsArr: string[] = [];
    if (typeof editedSlide.content.bullets === 'string') {
      bulletsArr = editedSlide.content.bullets
        .replace(/<ul>|<\/ul>/g, '')
        .split(/<li>|<\/li>/)
        .map(b => b.trim())
        .filter(Boolean);
    }
    bulletsArr.splice(index, 1);
    const bulletsHtml = `<ul>${bulletsArr.map(b => `<li>${b}</li>`).join('')}</ul>`;
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: bulletsHtml,
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
    setEditedSlide((prev) => ({
      ...prev,
      backgroundColor: color,
    }));
  };

  const handleFontColorChange = (color: string) => {
    setEditedSlide((prev) => ({
      ...prev,
      fontColor: color,
    }));
  };

  useEffect(() => {
    if ((editedSlide.layout === 'title-bullets' || editedSlide.layout === 'title-bullets-image')) {
      if (!editedSlide.content.bullets || editedSlide.content.bullets.trim() === '') {
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
              >
                {backgroundColors.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
              >
                {fontColors.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                // Parse HTML to array for editing
                let bulletsArr: string[] = [];
                if (typeof editedSlide.content.bullets === 'string') {
                  bulletsArr = editedSlide.content.bullets
                    .replace(/<ul>|<\/ul>/g, '')
                    .split(/<li>|<\/li>/)
                    .map(b => b.trim())
                    .filter(Boolean);
                }
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
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlideEditDialog;
