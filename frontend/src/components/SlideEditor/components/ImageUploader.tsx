import React, { useCallback, useState } from 'react';
import { Box, Button, Typography, styled, CircularProgress } from '@mui/material';
import { AddPhotoAlternate as AddPhotoIcon, Refresh as RefreshIcon } from '@mui/icons-material';

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
  imageUrl?: string;
  onImageChange: (imageUrl: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string) => Promise<string>;
  generatePrompt?: string;
  maxWidth?: number;
  maxHeight?: number;
  acceptedTypes?: string[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUrl,
  onImageChange,
  onImageUpload,
  onImageGenerate,
  generatePrompt,
  maxWidth = 1920,
  maxHeight = 1080,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif'],
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        throw new Error(`Please select a valid image file (${acceptedTypes.map(type => type.split('/')[1]).join(', ')})`);
      }

      // Create a URL for the selected file
      const tempUrl = URL.createObjectURL(file);

      // Load the image to check dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = tempUrl;
      });

      // Clean up the temporary URL
      URL.revokeObjectURL(tempUrl);

      // Check dimensions
      if (img.width > maxWidth || img.height > maxHeight) {
        throw new Error(`Image dimensions should not exceed ${maxWidth}x${maxHeight} pixels`);
      }

      // Upload the image if a handler is provided
      if (onImageUpload) {
        const uploadedUrl = await onImageUpload(file);
        onImageChange(uploadedUrl);
      } else {
        // Convert to base64 for local storage
        const reader = new FileReader();
        const base64String = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        onImageChange(base64String);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      console.error('Image upload error:', err);
    } finally {
      setLoading(false);
    }
  }, [onImageChange, onImageUpload, maxWidth, maxHeight, acceptedTypes]);

  const handleRetry = () => {
    setError(null);
    document.getElementById('image-upload')?.click();
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {imageUrl ? (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <ImagePreview src={imageUrl} alt="Slide content" />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<RefreshIcon />}
            >
              Change Image
              <input
                id="image-upload"
                type="file"
                accept={acceptedTypes.join(',')}
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
            </Button>
            {onImageGenerate && generatePrompt && (
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError(null);
                    const url = await onImageGenerate(generatePrompt);
                    onImageChange(url);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to generate image');
                    console.error('Image generation error:', err);
                  } finally {
                    setLoading(false);
                  }
                }}
                startIcon={<RefreshIcon />}
              >
                Generate New
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <UploadContainer>
          <input
            id="image-upload"
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          {loading ? (
            <>
              <CircularProgress size={40} />
              <Typography variant="body1" color="text.secondary">
                {onImageGenerate ? 'Generating image...' : 'Uploading image...'}
              </Typography>
            </>
          ) : error ? (
            <>
              <Typography variant="body1" color="error" align="center">
                {error}
              </Typography>
              <Button
                variant="outlined"
                onClick={handleRetry}
                startIcon={<RefreshIcon />}
              >
                Try Again
              </Button>
            </>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AddPhotoIcon />}
                sx={{ p: 2 }}
              >
                Upload Image
                <input
                  type="file"
                  accept={acceptedTypes.join(',')}
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </Button>
              {onImageGenerate && generatePrompt && (
                <Button
                  variant="outlined"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError(null);
                      const url = await onImageGenerate(generatePrompt);
                      onImageChange(url);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to generate image');
                      console.error('Image generation error:', err);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Generate Image
                </Button>
              )}
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" align="center">
            Supported formats: {acceptedTypes.map(type => type.split('/')[1]).join(', ')}
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center">
            Max size: {maxWidth}x{maxHeight}px
          </Typography>
        </UploadContainer>
      )}
    </Box>
  );
};

export default ImageUploader;
