import React from 'react';
import { Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { API_BASE_URL } from '../../config';

interface ExportButtonProps {
  presentation: any;
}

const ExportButton: React.FC<ExportButtonProps> = ({ presentation }) => {
  const handleExport = async () => {
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}/static/exports/renewable_energy_presentation.pptx`;
      link.download = 'renewable_energy_presentation.pptx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export presentation. Please try again.');
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<FileDownloadIcon />}
      onClick={handleExport}
      sx={{ mt: 2 }}
    >
      Export to PowerPoint
    </Button>
  );
};

export default ExportButton;
