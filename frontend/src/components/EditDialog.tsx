import React, { useState } from 'react';
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
  ListItemSecondaryAction,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { Slide, SlideContent } from './SlideEditor/types';

interface EditDialogProps {
  slide: Slide;
  onSave: (updatedSlide: Slide) => void;
  onClose: () => void;
  open?: boolean;
}

const EditDialog: React.FC<EditDialogProps> = ({
  slide,
  onSave,
  onClose,
  open = true,
}) => {
  const [editedSlide, setEditedSlide] = useState<Slide>(slide);
  const [newBulletPoint, setNewBulletPoint] = useState('');

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        title: event.target.value,
      },
    });
  };

  const handleBodyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        body: event.target.value,
      },
    });
  };

  const handleAddBulletPoint = () => {
    if (!newBulletPoint.trim()) return;

    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: [
          ...(editedSlide.content.bullets || []),
          { text: newBulletPoint.trim() }
        ],
      },
    });
    setNewBulletPoint('');
  };

  const handleDeleteBulletPoint = (index: number) => {
    const updatedBulletPoints = editedSlide.content.bullets?.filter((_, i) => i !== index) || [];
    setEditedSlide({
      ...editedSlide,
      content: {
        ...editedSlide.content,
        bullets: updatedBulletPoints,
      },
    });
  };

  const handleMoveBulletPoint = (index: number, direction: 'up' | 'down') => {
    if (!editedSlide.content.bullets) return;

    const updatedBulletPoints = [...editedSlide.content.bullets];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < updatedBulletPoints.length) {
      const temp = updatedBulletPoints[index];
      updatedBulletPoints[index] = updatedBulletPoints[newIndex];
      updatedBulletPoints[newIndex] = temp;

      setEditedSlide({
        ...editedSlide,
        content: {
          ...editedSlide.content,
          bullets: updatedBulletPoints,
        },
      });
    }
  };

  const handleSave = () => {
    onSave(editedSlide);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Slide</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Title"
          value={editedSlide.content.title}
          onChange={handleTitleChange}
          margin="normal"
        />

        {editedSlide.content.body !== undefined && (
          <TextField
            fullWidth
            label="Body"
            value={editedSlide.content.body || ''}
            onChange={handleBodyChange}
            margin="normal"
            multiline
            rows={4}
          />
        )}

        {editedSlide.content.bullets !== undefined && (
          <>
            <List>
              {editedSlide.content.bullets.map((point, index: number) => (
                <ListItem key={index}>
                  <TextField
                    value={point.text}
                    onChange={e => {
                      const updatedBullets = [...(editedSlide.content.bullets || [])];
                      updatedBullets[index] = { ...updatedBullets[index], text: e.target.value };
                      setEditedSlide({
                        ...editedSlide,
                        content: {
                          ...editedSlide.content,
                          bullets: updatedBullets,
                        },
                      });
                    }}
                    fullWidth
                    margin="dense"
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleMoveBulletPoint(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleMoveBulletPoint(index, 'down')}
                      disabled={index === (editedSlide.content.bullets?.length || 0) - 1}
                    >
                      ↓
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteBulletPoint(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            <TextField
              fullWidth
              label="New Bullet Point"
              value={newBulletPoint}
              onChange={(e) => setNewBulletPoint(e.target.value)}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleAddBulletPoint}
                    disabled={!newBulletPoint.trim()}
                  >
                    <AddIcon />
                  </IconButton>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBulletPoint();
                }
              }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;
