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
import { Slide, SlideLayout, BulletPoint, ImageService, SlideImage, convertLayoutToFrontend, convertLayoutToBackend } from '../types';
import ImageUploader from './ImageUploader';
import TiptapEditor from './TiptapEditor'; // Import TiptapEditor

interface SlideEditDialogProps {
  open: boolean;
  onClose: () => void;
  slide: Slide;
  onSave: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<string>;
}

const layoutOptions: { value: SlideLayout; label: string; description: string }[] = [
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
    value: 'title-body',
    label: 'Title & Body',
    description: 'A title with a text body below',
  },
  {
    value: 'title-image',
    label: 'Title & Image',
    description: 'A title with an image below',
  },
  {
    value: 'title-body-image',
    label: 'Title, Body & Image',
    description: 'A title with a text body and an image below',
  },
  {
    value: 'two-column',
    label: 'Two Columns',
    description: 'Content split into two columns',
  },
];

const SlideEditDialog: React.FC<SlideEditDialogProps> = ({
  open,
  onClose,
  slide,
  onSave,
  onImageUpload,
  onImageGenerate,
}) => {
  const [editedSlide, setEditedSlide] = useState<Slide>({
    ...slide,
    layout: convertLayoutToFrontend(slide.layout),
    content: {
      ...slide.content,
      bullets: slide.content.bullets ? [...slide.content.bullets] : [],
      image: slide.content.image || (slide.content.image_prompt ? {
        url: '',
        alt: slide.content.image_prompt,
        caption: slide.content.image_prompt,
        prompt: slide.content.image_prompt,
        service: 'dalle' as ImageService
      } : undefined)
    },
  });

  const handleLayoutChange = (newLayout: SlideLayout) => {
    setEditedSlide((prev) => ({
      ...prev,
      layout: newLayout,
      content: {
        ...prev.content,
      },
    }));
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedSlide({
      ...editedSlide,
      content: { ...editedSlide.content, title: event.target.value },
    });
  };

  const handleSubtitleChange = (value: string) => {
    setEditedSlide({
      ...editedSlide,
      content: { ...editedSlide.content, subtitle: value },
    });
  };

  const handleBodyChange = (value: string) => {
    setEditedSlide((prev) => ({
      ...prev,
      content: { ...prev.content, body: value },
    }));
  };

  const handleBulletAdd = () => {
    const newBullets = [...(editedSlide.content.bullets || []), { text: '' }];
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: newBullets
      }
    });
  };

  const handleBulletDelete = (index: number) => {
    const newBullets = [...(editedSlide.content.bullets || [])];
    newBullets.splice(index, 1);
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: newBullets
      }
    });
  };

  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...(editedSlide.content.bullets || [])];
    newBullets[index] = { text: value };
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: newBullets
      }
    });
  };

  const handleColumnLeftChange = (value: string) => {
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        columnLeft: value,
      },
    });
  };

  const handleColumnRightChange = (value: string) => {
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        columnRight: value,
      },
    });
  };

  const handleImageChange = (image: SlideImage) => {
    setEditedSlide((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        image,
      },
    }));
  };

  const handleImageGenerate = useCallback(async (prompt: string) => {
    if (!onImageGenerate) return;
    try {
      console.log('SlideEditDialog - Generating image with prompt:', prompt);
      const imageUrl = await onImageGenerate(prompt, 'dalle');
      handleImageChange({
        url: imageUrl,
        alt: prompt,
        caption: prompt,
        service: 'dalle' as ImageService,
        prompt
      });
    } catch (err) {
      console.error('Failed to generate image:', err);
    }
  }, [onImageGenerate, handleImageChange]);

  useEffect(() => {
    const newSlide = {
      ...slide,
      layout: convertLayoutToFrontend(slide.layout),
      content: {
        ...slide.content,
        bullets: slide.content.bullets ? [...slide.content.bullets] : [],
        image: slide.content.image || (slide.content.image_prompt ? {
          url: '',
          alt: slide.content.image_prompt,
          caption: slide.content.image_prompt,
          prompt: slide.content.image_prompt,
          service: 'dalle' as ImageService
        } : undefined)
      }
    };
    setEditedSlide(newSlide);

    // Auto-generate image if needed
    if (slide.content.image_prompt && (!slide.content.image || !slide.content.image.url)) {
      console.log('Auto-generating image in edit dialog');
      handleImageGenerate(slide.content.image_prompt);
    }
  }, [slide, handleImageGenerate]);

  const handleSave = () => {
    onSave({
      ...editedSlide,
      layout: convertLayoutToBackend(editedSlide.layout)
    });
    onClose();
  };

  // Helper to ensure HTML content for TiptapEditor
  const getHtmlContent = (content: string | undefined): string => {
    if (!content) return '';
    if (content.startsWith('<')) return content;
    return `<p>${content}</p>`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Slide</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Layout</InputLabel>
            <Select
              value={editedSlide.layout}
              label="Layout"
              onChange={(e) => handleLayoutChange(e.target.value as SlideLayout)}
            >
              {layoutOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Title"
            fullWidth
            value={editedSlide.content.title || ''}
            onChange={handleTitleChange}
          />

          <TextField
            label="Subtitle"
            fullWidth
            value={editedSlide.content.subtitle || ''}
            onChange={(e) => handleSubtitleChange(e.target.value)}
          />

          {(editedSlide.layout === 'title-body' || editedSlide.layout === 'title-body-image') && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Body</Typography>
              <TiptapEditor
                content={getHtmlContent(editedSlide.content.body || editedSlide.content.description)}
                onChange={handleBodyChange}
                placeholder="Enter body content..."
                bulletList={false}
              />
            </Box>
          )}

          {(editedSlide.layout === 'title-bullets' || editedSlide.layout === 'title-bullets-image') && (
            <Box>
              <Typography variant="h6" gutterBottom>Bullet Points</Typography>
              {editedSlide.content.bullets?.map((bullet, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    value={bullet.text}
                    onChange={(e) => handleBulletChange(index, e.target.value)}
                    placeholder={`Bullet point ${index + 1}`}
                  />
                  <IconButton 
                    onClick={() => handleBulletDelete(index)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleBulletAdd}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              >
                Add Bullet Point
              </Button>
            </Box>
          )}

          {editedSlide.layout === 'two-column' && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Left Column"
                  multiline
                  rows={4}
                  value={editedSlide.content.columnLeft || ''}
                  onChange={(e) => handleColumnLeftChange(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Right Column"
                  multiline
                  rows={4}
                  value={editedSlide.content.columnRight || ''}
                  onChange={(e) => handleColumnRightChange(e.target.value)}
                />
              </Grid>
            </Grid>
          )}

          {(editedSlide.layout === 'title-image' || 
            editedSlide.layout === 'title-bullets-image' || 
            editedSlide.layout === 'title-body-image') && (
            <Box>
              <Typography variant="h6" gutterBottom>Image</Typography>
              <ImageUploader
                currentImage={editedSlide.content.image}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
                onImageGenerate={onImageGenerate}
              />
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
