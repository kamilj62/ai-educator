import React from 'react';
import {
  useState,
  useEffect,
  useCallback
} from 'react';
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
import { Slide, SlideLayout, BulletPoint, ImageService, SlideImage, SlideTopic } from '../types';
import { convertLayoutToFrontend, convertLayoutToBackend } from '../utils';
import ImageUploader from './ImageUploader';
import TiptapEditor from './TiptapEditor';
import { HexColorPicker } from 'react-colorful';

interface SlideEditDialogProps {
  open: boolean;
  onClose: () => void;
  slide: Slide;
  topic?: SlideTopic;
  onSave: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
}

const layoutOptions: { value: SlideLayout; label: string; description: string }[] = [
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
}): JSX.Element => {
  console.log('[SlideEditDialog] onImageGenerate present:', typeof onImageGenerate === 'function');

  function normalizeBulletsForDialog(bullets?: string[]): string[] {
    if (!bullets) return [];
    return bullets;
  }

  // Store bullets as string[] for Slide
  const [bullets, setBullets] = useState<string[]>(() => normalizeBulletsForDialog(slide.content.bullets));
  const [editedSlide, setEditedSlide] = useState<Slide>(() => {
    const baseContent = {
      ...slide.content,
      bullets: Array.isArray(slide.content.bullets) ? slide.content.bullets : [],
    };
    if (!baseContent.image) {
      baseContent.image = {
        url: '',
        alt: '',
        service: 'generated',
      };
    }
    return {
      ...slide,
      layout: convertLayoutToFrontend(slide.layout),
      content: baseContent,
    };
  });

  useEffect(() => {
    if (open) {
      const validLayout = convertLayoutToFrontend(slide.layout);
      const baseContent = {
        ...slide.content,
        bullets: Array.isArray(slide.content.bullets) ? slide.content.bullets : [],
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

  const [bgColor, setBgColor] = useState(slide.backgroundColor || '#fff');
  const [fontColor, setFontColor] = useState(slide.fontColor || '#222');
  const [customBg, setCustomBg] = useState('');
  const [customFont, setCustomFont] = useState('');

  useEffect(() => {
    if (open) {
      setBgColor(slide.backgroundColor || '#fff');
      setFontColor(slide.fontColor || '#222');
      setCustomBg(slide.backgroundColor && !backgroundColors.some(opt => opt.value === slide.backgroundColor) ? slide.backgroundColor : '');
      setCustomFont(slide.fontColor && !fontColors.some(opt => opt.value === slide.fontColor) ? slide.fontColor : '');
    }
  }, [open, slide.backgroundColor, slide.fontColor]);

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
    // Add a new empty bullet to the array
    const bulletsArr = Array.isArray(editedSlide.content.bullets) ? [...editedSlide.content.bullets] : [];
    bulletsArr.push('');
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: bulletsArr,
      },
    });
    
  };

  const handleBulletChange = (index: number, value: string) => {
    // Update a bullet in the array
    const bulletsArr = Array.isArray(editedSlide.content.bullets) ? [...editedSlide.content.bullets] : [];
    bulletsArr[index] = value;
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: bulletsArr,
      },
    });
    
  };

  const handleBulletDelete = (index: number) => {
    // Remove a bullet from the array
    const bulletsArr = Array.isArray(editedSlide.content.bullets) ? [...editedSlide.content.bullets] : [];
    bulletsArr.splice(index, 1);
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: bulletsArr,
      },
    });
    
  };

  const handleColumnLeftChange = (content: string): void => {
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        columnLeft: content,
      },
    });
  };

  const handleColumnRightChange = (content: string): void => {
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        columnRight: content,
      },
    });
  };

  // Fix: useCallback for handleImageChange to avoid lint warning
  const handleImageChange = useCallback((image: SlideImage) => {
    setEditedSlide((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        image,
      },
    }));
  }, []);

   // Correctly type handleImageGenerate to match the expected prop signature
  const handleImageGenerate = useCallback(async (prompt: string, service?: ImageService): Promise<SlideImage> => {
    if (!onImageGenerate) {
      throw new Error('onImageGenerate is not defined');
    }
    try {
      const image = await onImageGenerate(prompt, service);
      handleImageChange(image);
      return image;
    } catch (err: any) {
      setImageError(err.message || 'Image generation failed');
      // Return a fallback SlideImage object to satisfy return type
      return {
        url: '',
        alt: 'Image generation failed',
        service: 'generated',
      };
    }
  }, [onImageGenerate, handleImageChange]);

  const handleAIGenerate = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      // Use the current title or topic as prompt, fallback to 'Generate slide content'
      const prompt = editedSlide.content.title || topic?.title || 'Generate slide content';
      // Prepare the topic object for the backend
      const topicForBackend = topic || {
        title: prompt,
        description: '',
        key_points: [],
        image_prompt: prompt,
        subtopics: []
      };
      // Use slide layout or fallback
      const layout = editedSlide.layout || 'title-bullets';
      const instructional_level = (topic && (topic as any).instructionalLevel) || 'high_school';
      const response = await fetch('/api/generate/slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicForBackend,
          instructional_level,
          layout
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      // The backend returns { data: { slide: { ...fields } } }
      const data = result.data?.slide || result.slide || result.data || result;
      setEditedSlide(prev => ({
        ...prev,
        // Add any updated fields here as needed
      }));
      return data;
    } catch (err: any) {
      setAiError(err.message || 'AI generation failed');
      // Return a fallback object to satisfy return type
      return {
        // Add any default fields here as needed
      };
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if ((editedSlide.layout === 'title-bullets' || editedSlide.layout === 'title-bullets-image')) {
      if (!editedSlide.content.bullets || !Array.isArray(editedSlide.content.bullets) || editedSlide.content.bullets.length === 0 || editedSlide.content.bullets.every(b => !b || b.trim() === '')) {
        setBodyError('Bullet points are empty or missing.');
      } else {
        setBodyError(null);
      }
    } else {
      setBodyError(null);
    }
  }, [editedSlide.layout, editedSlide.content.bullets]);

  useEffect(() => {
    if ((editedSlide.layout === 'title-body' || editedSlide.layout === 'title-body-image')) {
      if (!editedSlide.content.body || editedSlide.content.body.trim() === '') {
        setBodyError('Body content is empty or missing.');
      } else if (!editedSlide.content.body.startsWith('<')) {
        setBodyError('Body content is not HTML.');
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

  useEffect(() => {
    console.log('SlideEditDialog image:', editedSlide.content.image);
  }, [editedSlide.content.image]);

   const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleBgColorChange = (color: string) => {
    setBgColor(color);
    if (color !== 'custom') setCustomBg('');
  };

  const handleFontColorChange = (color: string) => {
    setFontColor(color);
    if (color !== 'custom') setCustomFont('');
  };

  const handleLayoutChange = (newLayout: SlideLayout) => {
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

  const handleSave = () => {
    onSave(editedSlide);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Slide</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {(editedSlide.layout === 'two-column') && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TiptapEditor
                  content={typeof editedSlide.content.title === 'string' ? editedSlide.content.title : ''}
                  onChange={handleTitleChange}
                  placeholder="Enter slide title..."
                />
              </Grid>
              <Grid item xs={6}>
                <TiptapEditor
                  content={Array.isArray(editedSlide.content.bullets) ? `<ul>${editedSlide.content.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
                  onChange={(content: string) => {
                    const bulletsArr = content
                      .replace(/<ul>|<\/ul>/g, '')
                      .split(/<li>|<\/li>/)
                      .map((b: string) => b.trim())
                      .filter((b: string) => !!b);
                    setBullets(bulletsArr);
                    setEditedSlide({
                      ...editedSlide,
                      content: { ...editedSlide.content, bullets: bulletsArr },
                    });
                  }}
                  placeholder="Enter bullet points..."
                />
              </Grid>
            </Grid>
          )}
{(editedSlide.layout === 'two-column') && (
  <Grid container spacing={2}>
    <Grid item xs={6}>
      <TiptapEditor
        content={typeof editedSlide.content.title === 'string' ? editedSlide.content.title : ''}
        onChange={handleTitleChange}
        placeholder="Enter slide title..."
      />
    </Grid>
    <Grid item xs={6}>
      <TiptapEditor
        content={Array.isArray(editedSlide.content.bullets) ? `<ul>${editedSlide.content.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
        onChange={(content: string) => {
          const bulletsArr = content
            .replace(/<ul>|<\/ul>/g, '')
            .split(/<li>|<\/li>/)
            .map((b: string) => b.trim())
            .filter((b: string) => !!b);
          setBullets(bulletsArr);
          setEditedSlide({
            ...editedSlide,
            content: { ...editedSlide.content, bullets: bulletsArr },
          });
        }}
        placeholder="Enter bullet points..."
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
                prompt={editedSlide.content.title || ''}
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
        <Button onClick={() => handleSave()} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlideEditDialog;
