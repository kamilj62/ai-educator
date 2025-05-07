import React from 'react';
import {
  useState,
  useEffect
} from 'react';
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
import type { Slide, SlideContent, BulletPoint, SlideTopic } from '../components/types';

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
  const [editedTopic, setEditedTopic] = useState<SlideTopic>(topic);
  const [editedSlide, setEditedSlide] = useState<SlideContent | undefined>(
    slide ? { ...slide } : undefined
  );
  const [newBulletPoint, setNewBulletPoint] = useState('');

  // Reset state when dialog opens with new topic/slide
  useEffect(() => {
    console.log('[EditDialog] useEffect: topic/slide changed', { topic, slide });
    setEditedTopic(topic);
    setEditedSlide(slide ? { ...slide } : undefined);
    setNewBulletPoint('');
  }, [topic, slide]);

  const handleSave = () => {
    console.log('[EditDialog] handleSave: Saving changes', { editedTopic, editedSlide });
    onSave(editedTopic, editedSlide);
    onClose();
  };

  const handleAddBulletPoint = () => {
    console.log('[EditDialog] handleAddBulletPoint: Adding bullet', newBulletPoint);
    if (!newBulletPoint.trim()) return;

    // Parse bullets HTML string into array
    const bulletsArr = (editedSlide?.bullets || '').replace(/<\/?ul>/g, '').split(/<li>|<\/li>/).filter(Boolean);
    bulletsArr.push(newBulletPoint.trim());
    const bulletsHtml = `<ul>${bulletsArr.map(b => `<li>${b}</li>`).join('')}</ul>`;

    if (!editedSlide) {
      setEditedSlide({
        title: editedTopic.title,
        bullets: bulletsHtml,
      });
      console.log('[EditDialog] handleAddBulletPoint: Created new editedSlide with bullet');
    } else {
      setEditedSlide({
        ...editedSlide,
        bullets: bulletsHtml,
      });
      console.log('[EditDialog] handleAddBulletPoint: Added bullet to existing editedSlide');
    }
    setNewBulletPoint('');
  };

  const handleDeleteBulletPoint = (index: number) => {
    console.log('[EditDialog] handleDeleteBulletPoint: Deleting bullet at', index);
    if (!editedSlide) return;
    const bulletsArr = (editedSlide.bullets || '').replace(/<\/?ul>/g, '').split(/<li>|<\/li>/).filter(Boolean);
    bulletsArr.splice(index, 1);
    const bulletsHtml = `<ul>${bulletsArr.map(b => `<li>${b}</li>`).join('')}</ul>`;
    setEditedSlide({
      ...editedSlide,
      bullets: bulletsHtml,
    });
  };

  const handleEditBulletPoint = (index: number, newText: string) => {
    console.log('[EditDialog] handleEditBulletPoint: Editing bullet', { index, newText });
    if (!editedSlide) return;
    const bulletsArr = (editedSlide.bullets || '').replace(/<\/?ul>/g, '').split(/<li>|<\/li>/).filter(Boolean);
    bulletsArr[index] = newText;
    const bulletsHtml = `<ul>${bulletsArr.map(b => `<li>${b}</li>`).join('')}</ul>`;
    setEditedSlide({
      ...editedSlide,
      bullets: bulletsHtml,
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
            value={editedTopic.description || ''}
            onChange={(e) => {
              const newDescription = e.target.value;
              setEditedTopic({ ...editedTopic, description: newDescription });
            }}
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
 HEAD


 22dd14f6 (Add /api/generate/image endpoint and enhancements)
        {editedSlide?.bullets && (
          <List>
            {editedSlide.bullets.replace(/<\/?ul>/g, '').split(/<li>|<\/li>/).filter(Boolean).map((bullet: string, index: number) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={bullet}
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
