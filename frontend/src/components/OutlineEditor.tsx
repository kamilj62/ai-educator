import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { generateSlides, SlideTopic } from '../store/presentationSlice';

const OutlineEditor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { presentation, loading } = useSelector((state: RootState) => state.presentation);
  const topics = presentation?.topics || [];

  const handleGenerateSlides = async () => {
    if (topics.length > 0 && presentation?.instructional_level) {
      try {
        await dispatch(generateSlides({ 
          topics, 
          instructional_level: presentation.instructional_level
        })).unwrap();
      } catch (error) {
        console.error('Failed to generate slides:', error);
      }
    }
  };

  if (!presentation || topics.length === 0) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Presentation Outline
      </Typography>
      <List>
        {topics.map((topic: SlideTopic, index: number) => (
          <ListItem
            key={index}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                disabled={loading}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={`${index + 1}. ${topic.title}`}
              secondary={topic.description}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateSlides}
          disabled={loading || topics.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Generating...' : 'Generate Slides'}
        </Button>
      </Box>
    </Box>
  );
};

export default OutlineEditor;
