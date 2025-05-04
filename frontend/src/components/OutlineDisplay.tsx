import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { SlideTopic, BulletPoint } from './SlideEditor/types';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PresentationIcon from '@mui/icons-material/Slideshow';
import { generateSlides, setOutline } from '../store/presentationSlice';

interface EditDialogProps {
  open: boolean;
  text: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

const EditDialog: React.FC<EditDialogProps> = ({ open, text, onClose, onSave }) => {
  const [editedText, setEditedText] = useState(text);

  const handleSave = () => {
    onSave(editedText);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Point</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Point"
          fullWidth
          multiline
          rows={3}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
        />
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

const ErrorDisplay: React.FC<{ error: string | null }> = ({ error }) => {
  if (!error) return null;
  return (
    <div style={{ color: 'red', margin: '1rem 0' }}>
      <strong>Error:</strong> {error}
    </div>
  );
};

const OutlineDisplay: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const error = useSelector((state: RootState) => state.presentation.error);
  const outline = useSelector((state: RootState) => state.presentation.outline);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<{ topicId: string; index: number; text: string } | null>(null);

  const handleEditPoint = (topicId: string, index: number, text: string) => {
    setEditingPoint({ topicId, index, text });
    setEditDialogOpen(true);
  };

  const handleSavePoint = (newText: string) => {
    if (editingPoint && outline) {
      // Find the topic and update the point
      const updatedOutline = outline.map(topic => {
        if (topic.id === editingPoint.topicId) {
          const updatedPoints = [...topic.key_points];
          updatedPoints[editingPoint.index] = newText;
          return { ...topic, key_points: updatedPoints };
        }
        return topic;
      });
      dispatch(setOutline(updatedOutline));
    }
  };

  const handleDeletePoint = (topicId: string, index: number) => {
    if (outline) {
      const updatedOutline = outline.map(topic => {
        if (topic.id === topicId) {
          const updatedPoints = topic.key_points.filter((_, i) => i !== index);
          return { ...topic, key_points: updatedPoints };
        }
        return topic;
      });
      dispatch(setOutline(updatedOutline));
    }
  };

  const handleAddPoint = (topicId: string) => {
    if (outline) {
      const updatedOutline = outline.map(topic => {
        if (topic.id === topicId) {
          return { ...topic, key_points: [...topic.key_points, 'New point'] };
        }
        return topic;
      });
      dispatch(setOutline(updatedOutline));
    }
  };

  const handleGenerateSlides = () => {
    console.log('Clicked Generate All Slides');
    // Collect all topics in order
    const topicsToGenerate: SlideTopic[] = [];
    const collectTopics = (topics: SlideTopic[]) => {
      topics.forEach(topic => {
        topicsToGenerate.push(topic);
        if (topic.subtopics) {
          collectTopics(topic.subtopics);
        }
      });
    };
    if (outline) {
      collectTopics(outline);
      console.log('Topics to generate:', topicsToGenerate);
      // Set topicsToGenerate on window so SlideEditor can access it
      (window as any).topicsToGenerate = topicsToGenerate;
      dispatch(generateSlides(topicsToGenerate));
    } else {
      console.warn('No outline found when trying to generate slides.');
    }
  };

  const renderTopic = (topic: SlideTopic, index: number) => (
    <Paper key={topic.id || `topic-${index}`} sx={{ mb: 2, p: 2 }}>
      <Typography variant="h6">{topic.title}</Typography>
      
      {topic.description && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {topic.description}
          </Typography>
        </Box>
      )}
  
      <List dense>
        {topic.key_points.map((point: string | BulletPoint, i) => (
          <ListItem key={`point-${index}-${i}`}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <ArrowRightIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={typeof point === 'string' ? point : point.text} 
            />
            <ListItemSecondaryAction>
              <IconButton 
                edge="end" 
                aria-label="edit"
                onClick={() => handleEditPoint(
                  topic.id!, 
                  i, 
                  typeof point === 'string' ? point : point.text
                )}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={() => handleDeletePoint(topic.id!, i)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        <ListItem>
          <Button
            startIcon={<AddIcon />}
            onClick={() => handleAddPoint(topic.id!)}
            sx={{ mt: 1 }}
          >
            Add Point
          </Button>
        </ListItem>
      </List>
  
      {topic.image_prompt && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <ImageIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            Image: {topic.image_prompt}
          </Typography>
        </Box>
      )}
  
      {topic.subtopics && topic.subtopics.length > 0 && (
        <Box sx={{ ml: 3, mt: 2 }}>
          {topic.subtopics.map((subtopic, subIndex) => renderTopic(subtopic, subIndex))}
        </Box>
      )}
    </Paper>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<PresentationIcon />}
          onClick={handleGenerateSlides}
          sx={{ minWidth: 200 }}
        >
          Generate All Slides
        </Button>
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </Box>
      {outline && outline.map((topic, index) => renderTopic(topic, index))}
      <EditDialog
        open={editDialogOpen}
        text={editingPoint?.text || ''}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSavePoint}
      />
    </Box>
  );
};

export default OutlineDisplay;
