<<<<<<< HEAD
import React from 'react';
import { useCallback, useState, useEffect } from 'react';
=======
<<<<<<< HEAD
import React, { useCallback, useState } from 'react';
>>>>>>> 70d1487b (Update Procfile for Heroku deployment)
import { Box, Button, Typography, styled, CircularProgress, TextField } from '@mui/material';
import { AddPhotoAlternate as AddPhotoIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import type { SlideImage, ImageService } from '../types';

const UploadContainer = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  minHeight: 200,
=======
import { Box, Button, styled } from '@mui/material';
import { ChangeEvent, useCallback, useState } from 'react';
import ImageIcon from '@mui/icons-material/Image';

const ImageContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '300px',
  border: `2px dashed ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
>>>>>>> dd7ecbd (added imagen images)
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
<<<<<<< HEAD
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(['border-color', 'background-color']),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
=======
  cursor: 'pointer',
  transition: 'border-color 0.2s ease',
  '&:hover': {
>>>>>>> dd7ecbd (added imagen images)
    borderColor: theme.palette.primary.main,
  },
}));

<<<<<<< HEAD
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
  prompt?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  image,
  onImageChange,
  onImageUpload,
  onImageGenerate,
  maxWidth = 1920,
  maxHeight = 1080,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif'],
  prompt: initialPrompt = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(initialPrompt);

  // DEBUG: Log if onImageGenerate is present
  useEffect(() => {
    console.log('[ImageUploader] onImageGenerate present:', typeof onImageGenerate === 'function');
  }, [onImageGenerate]);

  // When the initialPrompt changes, update the prompt state
  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

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
=======
const PreviewImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
});

interface ImageUploaderProps {
  imageUrl?: string;
  onImageChange: (url: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

const ImageUploader = ({ imageUrl, onImageChange, onImageUpload }: ImageUploaderProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImageUpload) return;

    try {
      setIsLoading(true);
      const url = await onImageUpload(file);
      onImageChange(url);
    } catch (error) {
      console.error('Failed to upload image:', error);
>>>>>>> dd7ecbd (added imagen images)
    } finally {
      setIsLoading(false);
    }
  }, [onImageUpload, onImageChange]);

<<<<<<< HEAD
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
        <Box sx={{ textAlign: 'center', position: 'relative', display: 'inline-block', width: '100%' }}>
          <ImagePreview src={imageUrl} alt="Slide image" style={{ opacity: isLoading ? 0.3 : 1, filter: isLoading ? 'blur(2px)' : 'none', transition: 'opacity 0.2s, filter 0.2s' }} />
          {/* Overlay spinner and message when generating */}
          {isLoading && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.7)',
              zIndex: 20,
              borderRadius: 2,
            }}>
              <CircularProgress size={48} />
              <Typography variant="subtitle1" sx={{ mt: 2, color: 'text.secondary' }}>
                Generating image...
              </Typography>
            </Box>
          )}
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
                    label="image_prompt"
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
<<<<<<< HEAD
      {/* Move re-generate button below image preview */}
      {imageUrl && onImageGenerate && !isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<RefreshIcon />}
            disabled={isLoading}
            onClick={handleImageGenerate}
          >
            Re-generate
          </Button>
        </Box>
      )}
=======
=======
  return (
    <Box>
      <input
        accept="image/*"
        type="file"
        id="image-upload"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <label htmlFor="image-upload">
        <ImageContainer>
          {imageUrl ? (
            <PreviewImage src={imageUrl} alt="Slide content" />
          ) : (
            <>
              <ImageIcon sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
              <Button
                variant="outlined"
                component="span"
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </>
          )}
        </ImageContainer>
      </label>
>>>>>>> dd7ecbd (added imagen images)
>>>>>>> 70d1487b (Update Procfile for Heroku deployment)
    </Box>
  );
};

export default ImageUploader;
