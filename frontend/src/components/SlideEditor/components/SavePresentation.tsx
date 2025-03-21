import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import pptxgen from 'pptxgenjs';
import { Slide } from '../types';

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
    for (const slide of slides) {
      const pptSlide = pptx.addSlide();

      // Add title
      pptSlide.addText(slide.content.title, {
        x: 0.5,
        y: 0.5,
        w: '90%',
        fontSize: 24,
        bold: true,
      });

      // Add content based on layout
      if (slide.content.body) {
        pptSlide.addText(slide.content.body, {
          x: 0.5,
          y: 1.5,
          w: '90%',
          fontSize: 14,
        });
      }

      if (slide.content.bullets) {
        pptSlide.addText(slide.content.bullets.map(b => ({ text: b.text })), {
          x: 0.5,
          y: 1.5,
          w: '90%',
          bullet: true,
          fontSize: 14,
        });
      }

      if (slide.content.image?.url) {
        try {
          pptSlide.addImage({
            path: slide.content.image.url,
            x: 0.5,
            y: slide.content.bullets || slide.content.body ? 3 : 1.5,
            w: '90%',
            h: 3,
          });
        } catch (error) {
          console.error('Error adding image:', error);
        }
      }

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
      // Create a file handle with native file picker
      const handle = await window.showSaveFilePicker({
        suggestedName: `${filename}${getFileExtension(format)}`,
        types: [{
          description: format === 'pptx' ? 'PowerPoint Presentation' : 'JSON Files',
          accept: {
            [getMimeType(format)]: [getFileExtension(format)],
          },
        }],
      });

      // Create a writable stream
      const writable = await handle.createWritable();

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
