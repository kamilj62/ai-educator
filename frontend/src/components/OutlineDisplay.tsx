import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
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

// Icons
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PresentationIcon from '@mui/icons-material/Slideshow';

// Redux actions
import { generateSlides, updateOutline } from '../store/presentationSlice';

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
          fullWidth
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
        />
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

const toBulletPoints = (points: string[] | { text: string }[]): LocalBulletPoint[] => {
  if (!points || !Array.isArray(points)) return [];
  
  return points.map((point, index) => ({
    id: `point-${index}-${Date.now()}`,
    text: typeof point === 'string' ? point : point.text || ''
  }));
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

  // Debug logging
  React.useEffect(() => {
    console.log('OutlineDisplay - outline data:', { 
      outline, 
      isArray: Array.isArray(outline),
      length: outline?.length,
      hasSlides,
      instructionalLevel
    });
  }, [outline, hasSlides, instructionalLevel]);

  const handleEditPoint = (topicId: string, index: number, text: string) => {
    setEditingPoint({ topicId, index, text });
    setEditDialogOpen(true);
  };

  const handleSavePoint = (newText: string) => {
    if (!editingPoint) return;
    
    const updatedOutline = [...(outline || [])].map(topic => {
      if (topic.id !== editingPoint.topicId) return topic;
      
      // Ensure key_points is an array of strings
      const updatedKeyPoints: string[] = [];
      
      if (Array.isArray(topic.key_points)) {
        // Process each key point to ensure it's a string
        topic.key_points.forEach((kp: unknown) => {
          if (typeof kp === 'string') {
            updatedKeyPoints.push(kp);
          } else if (kp && typeof kp === 'object' && kp !== null && 'text' in kp && 
                    typeof (kp as { text: unknown }).text === 'string') {
            updatedKeyPoints.push((kp as { text: string }).text);
          } else if (kp !== null && kp !== undefined) {
            updatedKeyPoints.push(String(kp));
          }
        });
      }
      
      // Ensure we have a valid index
      if (editingPoint.index >= 0 && editingPoint.index < updatedKeyPoints.length) {
        updatedKeyPoints[editingPoint.index] = newText;
      } else {
        // If index is out of bounds, add the new text to the end
        updatedKeyPoints.push(newText);
      }
      
      // Create a new topic with the updated key_points
      const updatedTopic: SlideTopic = {
        id: topic.id || `topic-${Math.random().toString(36).substr(2, 9)}`,
        title: topic.title || 'Untitled Topic',
        key_points: updatedKeyPoints,
        bullet_points: Array.isArray(topic.bullet_points) ? topic.bullet_points : [],
        description: topic.description || '',
        image_prompt: topic.image_prompt || '',
        subtopics: Array.isArray(topic.subtopics) ? topic.subtopics : [],
        instructionalLevel: topic.instructionalLevel || 'high_school',
      };
      
      return updatedTopic;
    });
    
    // Ensure the updated outline matches the SlideTopic[] type
    const typedOutline: SlideTopic[] = updatedOutline.map(topic => ({
      id: topic.id || `topic-${Math.random().toString(36).substr(2, 9)}`,
      title: topic.title || 'Untitled Topic',
      key_points: Array.isArray(topic.key_points) 
        ? topic.key_points.map(kp => 
            typeof kp === 'string' ? kp : 
            (kp && typeof kp === 'object' && 'text' in kp) ? String((kp as any).text) : 
            String(kp)
          ) 
        : [],
      bullet_points: Array.isArray(topic.bullet_points) ? topic.bullet_points : [],
      description: topic.description || '',
      image_prompt: topic.image_prompt || '',
      subtopics: Array.isArray(topic.subtopics) ? topic.subtopics : [],
      instructionalLevel: topic.instructionalLevel || 'high_school',
    }));
    
    dispatch(updateOutline(typedOutline));
    setEditDialogOpen(false);
    setEditingPoint(null);
  };

  const handleDeletePoint = (topicId: string, index: number) => {
    const updatedOutline = [...(outline || [])].map(topic => {
      if (topic.id !== topicId) return topic;
      
      // Ensure key_points is an array of strings
      const updatedKeyPoints = Array.isArray(topic.key_points) 
        ? [...topic.key_points].filter((_, i) => i !== index)
        : [];
      
      // Create a new topic with the updated key_points
      return {
        ...topic,
        key_points: updatedKeyPoints,
      };
    });
    
    // Ensure the updated outline matches the SlideTopic[] type
    const typedOutline: SlideTopic[] = updatedOutline.map(topic => ({
      id: topic.id || `topic-${Math.random().toString(36).substr(2, 9)}`,
      title: topic.title || 'Untitled Topic',
      key_points: Array.isArray(topic.key_points) 
        ? topic.key_points.map(kp => 
            typeof kp === 'string' ? kp : 
            (kp && typeof kp === 'object' && 'text' in kp) ? String((kp as any).text) : 
            String(kp)
          ) 
        : [],
      bullet_points: Array.isArray(topic.bullet_points) ? topic.bullet_points : [],
      description: topic.description || '',
      image_prompt: topic.image_prompt || '',
      subtopics: Array.isArray(topic.subtopics) ? topic.subtopics : [],
      instructionalLevel: topic.instructionalLevel || 'high_school',
    }));
    
    dispatch(updateOutline(typedOutline));
  };

  const handleAddPoint = (topicId: string) => {
    const newPoint = 'New point';
    const updatedOutline = [...(outline || [])].map(topic => {
      if (topic.id !== topicId) return topic;
      
      // Ensure key_points is an array of strings
      const currentKeyPoints = Array.isArray(topic.key_points) 
        ? [...topic.key_points]
        : [];
      
      // Add the new point
      currentKeyPoints.push(newPoint);
      
      // Create a new topic with the updated key_points
      return {
        ...topic,
        key_points: currentKeyPoints,
      };
    });
    
    // Ensure the updated outline matches the SlideTopic[] type
    const typedOutline: SlideTopic[] = updatedOutline.map(topic => ({
      id: topic.id || `topic-${Math.random().toString(36).substr(2, 9)}`,
      title: topic.title || 'Untitled Topic',
      key_points: Array.isArray(topic.key_points) 
        ? topic.key_points.map(kp => 
            typeof kp === 'string' ? kp : 
            (kp && typeof kp === 'object' && 'text' in kp) ? String((kp as any).text) : 
            String(kp)
          ) 
        : [],
      bullet_points: Array.isArray(topic.bullet_points) ? topic.bullet_points : [],
      description: topic.description || '',
      image_prompt: topic.image_prompt || '',
      subtopics: Array.isArray(topic.subtopics) ? topic.subtopics : [],
      instructionalLevel: topic.instructionalLevel || 'high_school',
    }));
    
    dispatch(updateOutline(typedOutline));
  };

  const handleGenerateSlides = () => {
    if (!outline || outline.length === 0) return;
    
    dispatch(generateSlides({
      topics: outline,
      instructionalLevel
    }) as any);
  };

  const handleGenerateSlidesForTopic = (topic: SlideTopic) => {
    if (!topic) return;
    
    const level = instructionalLevel || 'middle_school';
    
    dispatch(generateSlides({
      topics: [topic],
      instructionalLevel: level
    }) as any);
  };

  // Render a single topic with its details
  const renderTopic = (topic: SlideTopic, index: number) => {
    if (!topic) return null;
    
    console.log('Rendering topic:', { 
      id: topic.id, 
      title: topic.title, 
      key_points: topic.key_points 
    });
    
    return (
      <React.Fragment key={topic.id || `topic-${index}`}>
        <Paper sx={{ mb: 2, p: 2, bgcolor: '#18181b', borderRadius: 4 }}>
          <Typography variant="h6" sx={{ color: '#60a5fa' }}>
            {topic.title || 'Untitled Topic'}
          </Typography>
          
          {topic.description && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <DescriptionIcon sx={{ mr: 1, color: '#60a5fa' }} />
              <Typography variant="body2" sx={{ color: '#60a5fa' }}>
                {topic.description}
              </Typography>
            </Box>
          )}
          
          <List dense>
            {toBulletPoints(topic.key_points || []).map((point: LocalBulletPoint, i) => (
              <ListItem key={`point-${index}-${i}`}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ArrowRightIcon sx={{ color: '#fff' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={point.text} 
                  primaryTypographyProps={{ style: { color: '#e2e8f0' } }} 
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    size="small" 
                    onClick={() => handleEditPoint(topic.id!, i, point.text)}
                    sx={{ color: '#60a5fa' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    size="small" 
                    onClick={() => handleDeletePoint(topic.id!, i)}
                    sx={{ color: '#ef4444' }}
                  >
                    <DeleteIcon />
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
                sx={{ 
                  color: '#60a5fa', 
                  borderColor: '#60a5fa', 
                  '&:hover': { borderColor: '#3b82f6' } 
                }}
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
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PresentationIcon />}
              onClick={() => handleGenerateSlidesForTopic(topic)}
              sx={{ 
                background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)',
                '&:hover': { 
                  background: 'linear-gradient(90deg, #6366f1 10%, #a855f7 80%)',
                  boxShadow: '0 4px 12px 0 #6366f1cc'
                } 
              }}
            >
              Generate Slide
            </Button>
          </Box>
          
          {Array.isArray(topic.subtopics) && topic.subtopics.length > 0 && (
            <Box sx={{ ml: 3, mt: 2 }}>
              {topic.subtopics.map((subtopic, subIndex) => 
                renderTopic(subtopic, subIndex)
              )}
            </Box>
          )}
        </Paper>
      </React.Fragment>
    );
  };

  console.log('Rendering outline:', { outline, hasSlides });
  
  // Show loading state only when there's no outline yet
  if (outline === undefined) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading outline...
        </Typography>
      </Box>
    );
  }
  
  // Show error state if there's an error
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="body1">
          Error: {error}
        </Typography>
      </Box>
    );
  }
  
  // Show empty state if there's no outline
  if (!outline || outline.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">
          No outline available. Please generate an outline first.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Show Generate All Slides button if there is an outline and no slides yet */}
      {outline && outline.length > 0 && !hasSlides && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<PresentationIcon />}
            onClick={handleGenerateSlides}
            sx={{ 
              minWidth: 200, 
              fontWeight: 700, 
              fontSize: '1.05rem', 
              borderRadius: 3, 
              background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)', 
              boxShadow: '0 2px 16px 0 #6366f188', 
              textTransform: 'none', 
              letterSpacing: 0.5, 
              '&:hover': { 
                background: 'linear-gradient(90deg, #6366f1 10%, #a855f7 80%)', 
                boxShadow: '0 4px 24px 0 #6366f1cc', 
                transform: 'scale(1.03)' 
              } 
            }}
          >
            Generate All Slides
          </Button>
        </Box>
      )}
      
      {/* Render topics */}
      {Array.isArray(outline) && outline.map((topic, index) => 
        renderTopic(topic, index)
      )}
      
      {/* Edit Dialog */}
      <EditDialog
        open={editDialogOpen}
        text={editingPoint?.text || ''}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingPoint(null);
        }}
        onSave={handleSavePoint}
      />
    </Box>
  );
};

export default OutlineDisplay;
