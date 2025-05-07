import React from 'react';
import { Box } from '@mui/material';
import { Paper, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ErrorDisplayProps {
  error: string | { message?: string; [key: string]: any } | null;
  onClose?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClose }) => {
  if (!error) return null;

  // Determine the error message to display
  let errorMessage = typeof error === 'string' ? error : error.message || String(error);

  return (
    <Paper elevation={3} sx={{ p: 2, my: 2, background: '#ffeaea', border: '1px solid #f44336' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body1" color="error" sx={{ fontWeight: 600 }}>
          {errorMessage}
        </Typography>
        {onClose && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
};

export default ErrorDisplay;
