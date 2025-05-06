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
<<<<<<< HEAD
import { generateSlides, setOutline } from '../store/presentationSlice';
=======
import { generateSlides } from '../store/presentationSlice';
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)

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
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const hasSlides = slides && slides.length > 0;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<{ topicId: string; index: number; text: string } | null>(null);

  const handleEditPoint = (topicId: string, index: number, text: string) => {
    setEditingPoint({ topicId, index, text });
    setEditDialogOpen(true);
  };

  const handleSavePoint = (newText: string) => {
<<<<<<< HEAD
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
=======
    if (editingPoint) {
      // Removed updateTopicPoint call
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
    }
  };

  const handleDeletePoint = (topicId: string, index: number) => {
<<<<<<< HEAD
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
=======
    // Removed deleteTopicPoint call
  };

  const handleAddPoint = (topicId: string) => {
    // Removed addTopicPoint call
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
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
    <Paper key={topic.id || `topic-${index}`} sx={{ mb: 2, p: 2, bgcolor: '#18181b', borderRadius: 4 }}>
      <Typography variant="h6" sx={{ color: '#60a5fa' }}>{topic.title}</Typography>
      {topic.description && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <DescriptionIcon sx={{ mr: 1, color: '#60a5fa' }} />
          <Typography variant="body2" sx={{ color: '#60a5fa' }}>
            {topic.description}
          </Typography>
        </Box>
      )}
      <List dense>
        {topic.key_points.map((point: string | BulletPoint, i) => (
          <ListItem key={`point-${index}-${i}`}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <ArrowRightIcon sx={{ color: '#fff' }} />
            </ListItemIcon>
            <ListItemText 
              primary={typeof point === 'string' ? point : point.text} 
              primaryTypographyProps={{ sx: { color: '#fff' } }}
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
                sx={{ mr: 1, color: '#60a5fa' }}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={() => handleDeletePoint(topic.id!, i)}
                sx={{ color: '#60a5fa' }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        <ListItem>
          <Button
            startIcon={<AddIcon sx={{ color: '#60a5fa' }} />}
            onClick={() => handleAddPoint(topic.id!)}
            sx={{ mt: 1, color: '#60a5fa' }}
          >
            Add Point
          </Button>
        </ListItem>
      </List>
      {topic.image_prompt && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <ImageIcon sx={{ mr: 1, color: '#60a5fa' }} />
          <Typography variant="body2" sx={{ color: '#60a5fa' }}>
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
<<<<<<< HEAD
      {/* Show Generate All Slides button if there is an outline and no slides yet */}
      {outline && outline.length > 0 && !hasSlides && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<PresentationIcon />}
            onClick={handleGenerateSlides}
            sx={{ minWidth: 200, fontWeight: 700, fontSize: '1.05rem', borderRadius: 3, background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)', boxShadow: '0 2px 16px 0 #6366f188', textTransform: 'none', letterSpacing: 0.5, '&:hover': { background: 'linear-gradient(90deg, #6366f1 10%, #a855f7 80%)', boxShadow: '0 4px 24px 0 #6366f1cc', transform: 'scale(1.03)' } }}
          >
            Generate All Slides
          </Button>
        </Box>
=======
      {outline.length > 0 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PresentationIcon />}
              onClick={handleGenerateSlides}
              disabled={isGeneratingSlides}
              sx={{ minWidth: 200 }}
            >
              Generate All Slides
            </Button>
            <ErrorDisplay error={error} />
          </Box>
          {outline.map((topic, index) => renderTopic(topic, index))}
        </>
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
      )}
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
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
