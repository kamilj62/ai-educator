import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { SlideTopic, SlideContent, BulletPoint } from '../store/presentationSlice';

interface EditDialogProps {
  open: boolean;
  topic: SlideTopic;
  slide?: SlideContent;
  onClose: () => void;
  onSave: (topic: SlideTopic, slide?: SlideContent) => void;
}

const EditDialog: React.FC<EditDialogProps> = ({
  open,
  topic,
  slide,
  onClose,
  onSave,
}) => {
  const [editedTopic, setEditedTopic] = useState<SlideTopic>({ ...topic });
  const [editedSlide, setEditedSlide] = useState<SlideContent | undefined>(
    slide ? { ...slide } : undefined
  );
  const [newBulletPoint, setNewBulletPoint] = useState('');

  // Reset state when dialog opens with new topic/slide
  useEffect(() => {
    setEditedTopic({ ...topic });
    setEditedSlide(slide ? { ...slide } : undefined);
    setNewBulletPoint('');
  }, [topic, slide]);

  const handleSave = () => {
    console.log('Saving changes:', { editedTopic, editedSlide });
    onSave(editedTopic, editedSlide);
    onClose();
  };

  const handleAddBulletPoint = () => {
    if (!newBulletPoint.trim()) return;
    
    if (!editedSlide) {
      setEditedSlide({
        title: editedTopic.title,
        bullet_points: [{ text: newBulletPoint, sub_points: [], emphasis: false }],
        examples: [],
        discussion_questions: [],
      });
    } else {
      setEditedSlide({
        ...editedSlide,
        bullet_points: [
          ...editedSlide.bullet_points,
          { text: newBulletPoint, sub_points: [], emphasis: false },
        ],
      });
    }
    setNewBulletPoint('');
  };

  const handleDeleteBulletPoint = (index: number) => {
    if (!editedSlide) return;
    
    const updatedBulletPoints = editedSlide.bullet_points.filter((_, i) => i !== index);
    setEditedSlide({
      ...editedSlide,
      bullet_points: updatedBulletPoints,
    });
  };

  const handleEditBulletPoint = (index: number, newText: string) => {
    if (!editedSlide) return;
    
    const updatedBulletPoints = [...editedSlide.bullet_points];
    updatedBulletPoints[index] = {
      ...updatedBulletPoints[index],
      text: newText,
    };
    
    setEditedSlide({
      ...editedSlide,
      bullet_points: updatedBulletPoints,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Slide</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Title"
            value={editedTopic.title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setEditedTopic({ ...editedTopic, title: newTitle });
              if (editedSlide) {
                setEditedSlide({ ...editedSlide, title: newTitle });
              }
            }}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={editedTopic.description}
            onChange={(e) => setEditedTopic({ ...editedTopic, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
        </Box>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Bullet Points
        </Typography>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            label="New Bullet Point"
            value={newBulletPoint}
            onChange={(e) => setNewBulletPoint(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newBulletPoint.trim()) {
                handleAddBulletPoint();
              }
            }}
            fullWidth
            size="small"
            sx={{ mr: 1 }}
          />
          <IconButton
            onClick={handleAddBulletPoint}
            color="primary"
            disabled={!newBulletPoint.trim()}
          >
            <AddIcon />
          </IconButton>
        </Box>

        {editedSlide?.bullet_points && (
          <List>
            {editedSlide.bullet_points.map((bullet: BulletPoint, index: number) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={bullet.text}
                  onChange={(e) => handleEditBulletPoint(index, e.target.value)}
                  sx={{ mr: 1 }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleDeleteBulletPoint(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;
