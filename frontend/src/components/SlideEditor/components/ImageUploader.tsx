import { Box, Button, styled } from '@mui/material';
import { ChangeEvent, useCallback, useState } from 'react';
import ImageIcon from '@mui/icons-material/Image';

const ImageContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '300px',
  border: `2px dashed ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

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
    } finally {
      setIsLoading(false);
    }
  }, [onImageUpload, onImageChange]);

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
    </Box>
  );
};

export default ImageUploader;
