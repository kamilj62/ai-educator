import React, { useCallback, useState } from 'react';
import { Box, Button, Typography, styled, CircularProgress, TextField } from '@mui/material';
import { AddPhotoAlternate as AddPhotoIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import type { SlideImage, ImageService } from '../types';

const UploadContainer = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(['border-color', 'background-color']),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main,
  },
}));

const ImagePreview = styled('img')({
  maxWidth: '100%',
  maxHeight: '300px',
  objectFit: 'contain',
  borderRadius: 8,
});

export interface ImageUploaderProps {
  image?: string | SlideImage;
  onImageChange: (image: SlideImage) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
  maxWidth?: number;
  maxHeight?: number;
  acceptedTypes?: string[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  image,
  onImageChange,
  onImageUpload,
  onImageGenerate,
  maxWidth = 1920,
  maxHeight = 1080,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif'],
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');

  const handleFileUpload = useCallback(async (file: File) => {
    if (!onImageUpload) return;
    try {
      setIsLoading(true);
      setError(null);
      const imageUrl = await onImageUpload(file);
      onImageChange({ url: imageUrl, alt: 'Uploaded image', service: 'upload' });
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Image upload error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onImageUpload, onImageChange]);

  const handleImageGenerate = useCallback(async () => {
    if (!onImageGenerate || !prompt.trim()) {
      setError('Please enter a prompt for image generation');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const imageObj = await onImageGenerate(prompt, 'dalle');
      onImageChange(imageObj);
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error('Image generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onImageGenerate, onImageChange, prompt]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  let imageUrl = '';
  if (typeof image === 'string') {
    imageUrl = image;
  } else if (image && typeof image === 'object' && 'url' in image) {
    imageUrl = image.url;
  }

  return (
    <Box>
      {imageUrl ? (
        <Box sx={{ textAlign: 'center' }}>
          <ImagePreview src={imageUrl} alt="Slide image" />
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
            {onImageGenerate && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleImageGenerate}
                disabled={isLoading || !prompt.trim()}
              >
                Regenerate Image
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <UploadContainer
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography>Generating image...</Typography>
            </Box>
          ) : (
            <>
              <AddPhotoIcon sx={{ fontSize: 48, color: 'action.active' }} />
              <Typography variant="body1" color="text.secondary" align="center">
                Drag and drop an image here, or click to select
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', width: '100%', maxWidth: 400 }}>
                {onImageGenerate && (
                  <TextField
                    label="Image Prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Enter a description of the image you want to generate..."
                  />
                )}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    component="label"
                    disabled={isLoading || !onImageUpload}
                  >
                    Upload Image
                    <input
                      type="file"
                      hidden
                      accept={acceptedTypes.join(',')}
                      onChange={handleFileSelect}
                    />
                  </Button>
                  {onImageGenerate && (
                    <Button
                      variant="outlined"
                      onClick={handleImageGenerate}
                      disabled={isLoading || !prompt.trim()}
                    >
                      Generate Image
                    </Button>
                  )}
                </Box>
              </Box>
              {error && (
                <Typography variant="body2" color="error" align="center">
                  {error}
                </Typography>
              )}
            </>
          )}
        </UploadContainer>
      )}
    </Box>
  );
};

export default ImageUploader;
