import { Box, Button, Menu, MenuItem, Typography, styled } from '@mui/material';
import { useState } from 'react';
import LayoutIcon from '@mui/icons-material/ViewQuilt';
import { SlideLayout } from '../types';

const LayoutButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  padding: theme.spacing(1, 2),
  gap: theme.spacing(1),
}));

const LayoutPreview = styled(Box)(({ theme }) => ({
  width: '120px',
  height: '80px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(1),
  gap: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const layoutOptions: { [key in SlideLayout]: string } = {
  'title': 'Title Only',
  'title-image': 'Title with Image',
  'title-body': 'Title and Body',
  'title-body-image': 'Title and Body with Image',
  'title-bullets': 'Title and Bullets',
  'title-bullets-image': 'Title and Bullets with Image',
  'two-column': 'Two Columns',
  'two-column-image': 'Two Columns with Image',
};

interface LayoutSwitcherProps {
  currentLayout: SlideLayout;
  onLayoutChange: (layout: SlideLayout) => void;
}

const LayoutSwitcher = ({ currentLayout, onLayoutChange }: LayoutSwitcherProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLayoutSelect = (layout: SlideLayout) => {
    onLayoutChange(layout);
    handleClose();
  };

  return (
    <Box>
      <LayoutButton
        variant="outlined"
        onClick={handleClick}
        startIcon={<LayoutIcon />}
      >
        {layoutOptions[currentLayout]}
      </LayoutButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: '80vh',
            width: '300px',
            p: 1,
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Select Layout
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1,
            }}
          >
            {Object.entries(layoutOptions).map(([layout, label]) => (
              <MenuItem
                key={layout}
                onClick={() => handleLayoutSelect(layout as SlideLayout)}
                selected={currentLayout === layout}
                sx={{ p: 0 }}
              >
                <Box sx={{ p: 1, width: '100%' }}>
                  <LayoutPreview>
                    <Box
                      sx={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'primary.main',
                        opacity: 0.2,
                        mb: 0.5,
                      }}
                    />
                    {layout.includes('image') && (
                      <Box
                        sx={{
                          width: layout.includes('two-column') ? '45%' : '30%',
                          height: '30px',
                          backgroundColor: 'primary.main',
                          opacity: 0.1,
                          alignSelf: layout.includes('two-column')
                            ? 'flex-end'
                            : 'center',
                        }}
                      />
                    )}
                  </LayoutPreview>
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                    {label}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Box>
        </Box>
      </Menu>
    </Box>
  );
};

export default LayoutSwitcher;
