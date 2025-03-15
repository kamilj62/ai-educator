import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Drawer,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store/store';
import {
  selectPresentation,
  selectLoading,
  selectError,
  updateTopics,
  updateSlides,
  generateSlides,
  SlideTopic,
  SlideContent,
} from '../store/presentationSlice';
import EditDialog from './EditDialog';
import SlidePreview from './SlidePreview';

const OutlineEditor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const presentation = useSelector(selectPresentation);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const topics = presentation?.topics || [];

  const [editingTopic, setEditingTopic] = useState<{ index: number; topic: SlideTopic } | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleEditTopic = (index: number, topic: SlideTopic) => {
    console.log('Editing topic:', { index, topic });
    console.log('Current slide:', presentation?.slides?.[index]);
    setEditingTopic({ index, topic });
  };

  const handleSaveTopic = (updatedTopic: SlideTopic, updatedSlide?: SlideContent) => {
    if (editingTopic === null) return;
    
    console.log('Saving topic:', { updatedTopic, updatedSlide });
    
    const updatedTopics = [...topics];
    updatedTopics[editingTopic.index] = updatedTopic;
    
    if (updatedSlide && presentation?.slides) {
      const updatedSlides = [...presentation.slides];
      updatedSlides[editingTopic.index] = updatedSlide;
      dispatch(updateSlides(updatedSlides));
    }
    
    dispatch(updateTopics(updatedTopics));
    setEditingTopic(null);
  };

  const handleDeleteTopic = (index: number) => {
    const updatedTopics = topics.filter((_, i) => i !== index);
    dispatch(updateTopics(updatedTopics));
    
    if (presentation?.slides) {
      const updatedSlides = presentation.slides.filter((_, i) => i !== index);
      dispatch(updateSlides(updatedSlides));
    }

    if (currentSlideIndex >= updatedTopics.length) {
      setCurrentSlideIndex(Math.max(0, updatedTopics.length - 1));
    }
  };

  const handleGenerateSlides = async () => {
    if (topics.length > 0 && presentation?.instructional_level) {
      try {
        console.log('Starting slide generation...');
        const promises = topics.map(topic => 
          dispatch(generateSlides({ 
            topic,
            instructional_level: presentation.instructional_level 
          })).unwrap()
        );
        
        const results = await Promise.all(promises);
        console.log('All slides generated successfully:', results);
        
        // Extract slides from the nested response structure
        const allSlides = results.map(result => result.data.slide);
        dispatch(updateSlides(allSlides));
        
        // Show first slide after generation
        setCurrentSlideIndex(0);
        setIsPreviewOpen(true);
      } catch (error) {
        console.error('Failed to generate slides:', error);
        // Error is already handled by the Redux store
      }
    } else {
      console.error('Cannot generate slides: missing topics or instructional level', {
        topicsLength: topics.length,
        instructionalLevel: presentation?.instructional_level
      });
    }
  };

  const handleViewSlide = (index: number) => {
    if (presentation?.slides?.length) {
      setCurrentSlideIndex(index);
      setIsPreviewOpen(true);
    }
  };

  if (!presentation || topics.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No presentation content available. Please generate an outline first.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', width: '100%', gap: 2, p: 2 }}>
      {/* Left side - Outline */}
      <Box sx={{ width: '50%' }}>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            Error: {error}
          </Typography>
        )}
        <Typography variant="h6" gutterBottom>
          Presentation Outline
        </Typography>
        <List sx={{ width: '100%' }}>
          {topics.map((topic: SlideTopic, index: number) => (
            <ListItem
              key={index}
              onClick={() => handleViewSlide(index)}
              sx={{ 
                mb: 1,
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: 1,
                cursor: presentation?.slides?.length ? 'pointer' : 'default',
                '&:hover': presentation?.slides?.length ? { bgcolor: 'action.hover' } : undefined,
                bgcolor: currentSlideIndex === index ? 'action.selected' : undefined
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {`${index + 1}. ${topic.title}`}
                      </Typography>
                    }
                    secondary={topic.description}
                    sx={{ pr: 2 }}
                  />
                  <Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTopic(index, topic);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTopic(index);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                {presentation?.slides?.[index]?.bullet_points && presentation.slides[index].bullet_points.length > 0 && (
                  <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid rgba(0, 0, 0, 0.12)' }}>
                    {presentation.slides[index].bullet_points.slice(0, 3).map((bullet, idx) => (
                      <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        • {bullet.text}
                      </Typography>
                    ))}
                    {presentation.slides[index].bullet_points.length > 3 && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        + {presentation.slides[index].bullet_points.length - 3} more points...
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateSlides}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Generating...' : 'Generate Slides'}
          </Button>
        </Box>
      </Box>

      {/* Right side - Slide Preview */}
      <Box sx={{ width: '50%' }}>
        {presentation?.slides && presentation.slides.length > 0 && (
          <SlidePreview
            slides={presentation.slides}
            currentIndex={currentSlideIndex}
            onPrevious={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            onNext={() => setCurrentSlideIndex(Math.min((presentation?.slides?.length ?? 1) - 1, currentSlideIndex + 1))}
          />
        )}
      </Box>

      {/* Edit Dialog */}
      {editingTopic && presentation?.slides && (
        <EditDialog
          open={true}
          topic={editingTopic.topic}
          slide={presentation.slides[editingTopic.index]}
          onClose={() => setEditingTopic(null)}
          onSave={handleSaveTopic}
        />
      )}
    </Box>
  );
};

export default OutlineEditor;
