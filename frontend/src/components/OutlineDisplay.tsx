import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { SlideTopic, InstructionalLevel } from './types';

// Local type for bullet points in this component
type LocalBulletPoint = {
  id: string;
  text: string;
};

interface EditDialogProps {
  open: boolean;
  text: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PresentationIcon from '@mui/icons-material/Slideshow';
import { generateSlides, updateOutline } from '../store/presentationSlice';

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

const OutlineDisplay: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const error = useSelector((state: RootState) => state.presentation.error);
  const outline = useSelector((state: RootState) => state.presentation.outline);
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const instructionalLevel = useSelector((state: RootState) => state.presentation.instructionalLevel);
  const hasSlides = slides && slides.length > 0;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<{ topicId: string; index: number; text: string } | null>(null);

  // Convert string array to BulletPoint array with robust type checking
  const toBulletPoints = (points: any): LocalBulletPoint[] => {
    try {
      console.log('toBulletPoints input:', points);
      
      // Handle null/undefined
      if (points == null) {
        console.warn('Received null or undefined points, returning empty array');
        return [];
      }
      
      // Handle non-array inputs
      if (!Array.isArray(points)) {
        console.warn('Expected an array but got:', typeof points, points);
        // If it's a string, split by newlines
        if (typeof points === 'string') {
          console.log('Converting string to array by splitting on newlines');
          points = points.split('\n').filter(Boolean);
        } else {
          // For other non-array types, wrap in array
          points = [points];
        }
      }
      
      // Ensure we have an array of strings
      return points
        .map((item, index) => {
          // Handle null/undefined items
          if (item == null) {
            console.warn(`Skipping null/undefined item at index ${index}`);
            return null;
          }
          
          // Convert to string and trim
          const text = String(item).trim();
          if (!text) {
            console.warn(`Skipping empty string item at index ${index}`);
            return null;
          }
          
          return {
            id: `point-${index}-${Math.random().toString(36).substr(2, 4)}`,
            text
          };
        })
        .filter((item): item is LocalBulletPoint => item !== null);
    } catch (error) {
      console.error('Error in toBulletPoints:', error);
      return [];
    }
  };

  // Convert BulletPoint array back to string array
  const toStringArray = (points: LocalBulletPoint[] | undefined | null): string[] => {
    if (!points) return [];
    return points.map(p => p?.text || '');
  };

  const handleEditPoint = (topicId: string, index: number, text: string) => {
    setEditingPoint({ topicId, index, text });
    setEditDialogOpen(true);
  };

  const handleSavePoint = (newText: string) => {
    if (editingPoint && outline) {
      // Find the topic and update the point
      const updatedOutline = outline.map((topic: SlideTopic) => {
        if (topic.id === editingPoint.topicId) {
          const bulletPoints = toBulletPoints(topic.bullet_points);
          bulletPoints[editingPoint.index] = {
            ...bulletPoints[editingPoint.index],
            text: newText
          };
          return { 
            ...topic, 
            bullet_points: toStringArray(bulletPoints) 
          };
        }
        return topic;
      });
      dispatch(updateOutline(updatedOutline));
    }
    setEditDialogOpen(false);
  };

  const handleDeletePoint = (topicId: string, index: number) => {
    if (outline) {
      const updatedOutline = outline.map((topic: SlideTopic) => {
        if (topic.id === topicId) {
          const bulletPoints = toBulletPoints(topic.bullet_points);
          bulletPoints.splice(index, 1);
          return { 
            ...topic, 
            bullet_points: toStringArray(bulletPoints) 
          };
        }
        return topic;
      });
      dispatch(updateOutline(updatedOutline));
    }
  };

  const handleAddPoint = (topicId: string) => {
    if (outline) {
      const updatedOutline = outline.map((topic: SlideTopic) => {
        if (topic.id === topicId) {
          // Create a new bullet point with a unique ID
          const newPoint: LocalBulletPoint = {
            id: `point-${Math.random().toString(36).substr(2, 9)}`,
            text: 'New point'
          };
          
          // Convert existing points to BulletPoint array
          const bulletPoints = toBulletPoints(topic.bullet_points);
          
          // Add the new point
          const updatedBulletPoints = [...bulletPoints, newPoint];
          
          // Convert back to string array for storage
          return { 
            ...topic, 
            bullet_points: toStringArray(updatedBulletPoints)
          };
        }
        return topic;
      });
      dispatch(updateOutline(updatedOutline));
    }
  };

  const handleGenerateSlides = () => {
    if (outline && outline.length > 0) {
      // Use the instructional level from Redux store
      const level = instructionalLevel || 'elementary';
      
      // Create a properly typed topics array
      const topics: SlideTopic[] = outline.map(topic => ({
        id: topic.id,
        title: topic.title,
        bullet_points: topic.bullet_points || [],
        description: topic.description || `A presentation about ${topic.title}`,
        image_prompt: topic.image_prompt || `An illustration representing ${topic.title}`,
        subtopics: (topic.subtopics || []).map(subtopic => ({
          id: subtopic.id,
          title: subtopic.title,
          bullet_points: subtopic.bullet_points || [],
          description: subtopic.description || `Details about ${subtopic.title}`,
          image_prompt: subtopic.image_prompt || `An illustration for ${subtopic.title}`
        }))
      }));
      
      dispatch(generateSlides({
        topics,
        instructionalLevel: level
      }) as any);
    }
  };

  const renderTopic = (topic: SlideTopic, index: number) => {
    console.log('Rendering topic:', { 
      id: topic.id, 
      title: topic.title, 
      bullet_points: topic.bullet_points 
    });
    
    return (
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
          {toBulletPoints(topic.bullet_points || []).map((point: LocalBulletPoint, i) => (
            <ListItem key={`point-${index}-${i}`}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <ArrowRightIcon sx={{ color: '#fff' }} />
              </ListItemIcon>
              <ListItemText 
                primary={point.text} 
                primaryTypographyProps={{ style: { color: '#e2e8f0' } }} 
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" size="small" onClick={() => handleEditPoint(topic.id!, i, point.text)}>
                  <EditIcon sx={{ color: '#60a5fa' }} />
                </IconButton>
                <IconButton edge="end" size="small" onClick={() => handleDeletePoint(topic.id!, i)}>
                  <DeleteIcon sx={{ color: '#ef4444' }} />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleAddPoint(topic.id!)}
              sx={{ color: '#60a5fa', borderColor: '#60a5fa', '&:hover': { borderColor: '#3b82f6' } }}
            >
              Add Point
            </Button>
          </Box>
        </List>
        {topic.image_prompt && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
            <ImageIcon sx={{ mr: 1, color: '#60a5fa' }} />
            <Typography variant="caption" sx={{ color: '#60a5fa' }}>
              Image: {topic.image_prompt}
            </Typography>
          </Box>
        )}
        {topic.subtopics && topic.subtopics.length > 0 && (
          <Box sx={{ ml: 3, mt: 2 }}>
            {topic.subtopics.map((subtopic: SlideTopic, subIndex: number) => renderTopic(subtopic, subIndex))}
          </Box>
        )}
      </Paper>
    );
  };

  console.log('Rendering outline:', { outline, hasSlides });
  
  return (
    <Box sx={{ p: 3 }}>
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
      )}
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {Array.isArray(outline) && outline.map((topic, index) => 
        renderTopic(topic, index)
      )}
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
