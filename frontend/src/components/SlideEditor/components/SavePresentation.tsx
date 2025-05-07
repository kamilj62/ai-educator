import React from 'react';
import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import pptxgen from 'pptxgenjs';
import { Slide } from '../types';

// Add this at the top or in a global.d.ts file, but for now add here for the error:
declare global {
  interface Window {
    showSaveFilePicker?: (<T>(options?: SaveFilePickerOptions) => Promise<T>) | undefined;
  }
}

interface SavePresentationProps {
  open: boolean;
  onClose: () => void;
  onSave: (filename: string) => void;
  slides: Slide[];
}

type FileFormat = 'pptx' | 'json';

const SavePresentation: React.FC<SavePresentationProps> = ({
  open,
  onClose,
  onSave,
  slides,
}) => {
  const [filename, setFilename] = useState('presentation');
  const [format, setFormat] = useState<FileFormat>('pptx');

  const createPowerPoint = async () => {
    const pptx = new pptxgen();

    // Convert each slide to PowerPoint format
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const pptSlide = pptx.addSlide();

      // Add title
      if (slide.content.title) {
        pptSlide.addText(slide.content.title, {
          x: 0.5,
          y: 0.5,
          w: '90%',
          fontSize: 24,
          bold: true,
        });
      }

      // Add subtitle if present
      if (slide.content.subtitle) {
        pptSlide.addText(slide.content.subtitle, {
          x: 0.5,
          y: 1.1,
          w: '90%',
          fontSize: 16,
          italic: true,
          color: '666666',
        });
      }

      // Add content based on layout
      if (slide.layout === 'two-column' && slide.content.columnLeft && slide.content.columnRight) {
        pptSlide.addText(slide.content.columnLeft, {
          x: 0.5,
          y: 1.5,
          w: '45%',
          fontSize: 14,
        });
        pptSlide.addText(slide.content.columnRight, {
          x: 5.5,
          y: 1.5,
          w: '45%',
          fontSize: 14,
        });
      } else if (slide.content.bullets && slide.content.bullets.length > 0) {
        // Parse HTML bullet string to array of text
        const bulletsArr = slide.content.bullets.replace(/<\/?ul>/g, '').split(/<li>|<\/li>/).filter(Boolean).map(text => ({ text }));
        pptSlide.addText(bulletsArr, {
          x: 0.5,
          y: 1.5,
          w: '90%',
          bullet: true,
          fontSize: 14,
        });
      } else if (slide.content.body) {
        pptSlide.addText(slide.content.body, {
          x: 0.5,
          y: 1.5,
          w: '90%',
          fontSize: 14,
        });
      }

      // Add image if present
      if (slide.content.image?.url) {
        try {
          pptSlide.addImage({
            path: slide.content.image.url,
            x: 0.5,
            y: 3.2,
            w: '90%',
            h: 3,
          });
        } catch (error) {
          console.error('Error adding image:', error);
        }
      }
    }

    return pptx;
  };

  const getMimeType = (fmt: FileFormat) => {
    return fmt === 'pptx' 
      ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      : 'application/json';
  };

  const getFileExtension = (fmt: FileFormat) => fmt === 'pptx' ? '.pptx' : '.json';

  const handleSave = async () => {
    try {
      if (window.showSaveFilePicker) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: `${filename}${getFileExtension(format)}`,
          types: [{
            description: format === 'pptx' ? 'PowerPoint Presentation' : 'JSON Files',
            accept: {
              [getMimeType(format)]: [getFileExtension(format)],
            },
          }],
        }) as FileSystemFileHandle;
        const writable = await fileHandle.createWritable();

        if (format === 'pptx') {
          // Generate PowerPoint file
          const pptx = await createPowerPoint();
          // Export as binary data
          const data = await pptx.stream();
          const blob = new Blob([data], { type: getMimeType('pptx') });
          // Write the blob to the file
          await writable.write(blob);
        } else {
          // Write JSON content
          const presentationData = {
            slides,
            version: '1.0',
            savedAt: new Date().toISOString(),
          };
          await writable.write(JSON.stringify(presentationData, null, 2));
        }

        // Close the stream
        await writable.close();
      } else {
        // Fallback logic for browsers that do not support showSaveFilePicker
        let blob;
        if (format === 'pptx') {
          // Generate PowerPoint file
          const pptx = await createPowerPoint();
          // Export as binary data
          const data = await pptx.stream();
          blob = new Blob([data], { type: getMimeType('pptx') });
        } else {
          // Write JSON content
          const presentationData = {
            slides,
            version: '1.0',
            savedAt: new Date().toISOString(),
          };
          blob = new Blob([JSON.stringify(presentationData, null, 2)], { type: getMimeType('json') });
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}${getFileExtension(format)}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
      }

      onSave(filename);
      onClose();
    } catch (err) {
      // User cancelled or error occurred
      console.error('Error saving file:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Save Presentation</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Filename"
          type="text"
          fullWidth
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
          helperText="Choose a name for your presentation"
        />
        <FormControl fullWidth>
          <InputLabel>Format</InputLabel>
          <Select
            value={format}
            label="Format"
            onChange={(e) => setFormat(e.target.value as FileFormat)}
          >
            <MenuItem value="pptx">PowerPoint (.pptx)</MenuItem>
            <MenuItem value="json">JSON (.json)</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Choose Location & Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SavePresentation;
