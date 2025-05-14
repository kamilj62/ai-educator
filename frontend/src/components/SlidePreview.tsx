import React from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper,
  List,
  ListItem,
  ListItemText,
  NavigateNext, 
  NavigateBefore, 
  Fullscreen, 
  FullscreenExit 
} from '@/utils/mui';
import { API_BASE_URL } from '../../config';
import { Slide } from '../components/types';
import Image from 'next/image';

interface SlidePreviewProps {
  slides: Slide[];
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({
  slides = [],
  currentIndex = 0,
  onPrevious,
  onNext,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const slideRef = React.useRef<HTMLDivElement>(null);

  // Check if fullscreen is supported
  const isFullscreenSupported = document.fullscreenEnabled || 
    (document as any).webkitFullscreenEnabled || 
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled;

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreenSupported) {
        console.warn('Fullscreen mode is not supported in this browser');
        return;
      }

      if (!document.fullscreenElement) {
        if (slideRef.current) {
          // Try different vendor prefixes for better browser support
          if (slideRef.current.requestFullscreen) {
            await slideRef.current.requestFullscreen();
          } else if ((slideRef.current as any).webkitRequestFullscreen) {
            await (slideRef.current as any).webkitRequestFullscreen();
          } else if ((slideRef.current as any).mozRequestFullScreen) {
            await (slideRef.current as any).mozRequestFullScreen();
          } else if ((slideRef.current as any).msRequestFullscreen) {
            await (slideRef.current as any).msRequestFullscreen();
          }
          setIsFullscreen(true);
        }
      } else {
        // Try different vendor prefixes for exiting fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      // Some browsers may not support fullscreen or may deny the request
      console.error('Fullscreen error:', err instanceof Error ? err.message : 'Fullscreen mode not supported');
      // Continue in non-fullscreen mode
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isInFullscreen);
    };

    // Add event listeners for all vendor prefixes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      // Clean up event listeners
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  if (!slides || slides.length === 0 || !slides[currentIndex]) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No slide content available. Please generate slides first.
        </Typography>
      </Box>
    );
  }

  const currentSlide = slides[currentIndex];

  // Helper to get image URL and caption (fix type errors)
  const getImageUrl = (image?: any) => {
    if (!image) return undefined;
    // If image is a string (legacy), treat as URL
    if (typeof image === 'string') {
      // If it's already a full URL, return as is
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
      }
      // Remove leading slash if present
      const cleanPath = image.startsWith('/') ? image.slice(1) : image;
      // If it starts with static/images, use API_BASE_URL
      if (cleanPath.startsWith('static/images/')) {
        return `${API_BASE_URL}/api/images/${cleanPath.replace('static/images/', '')}`;
      }
      return `${API_BASE_URL}/${cleanPath}`;
    }
    // If image is an object with url
    if (image.url) {
      if (image.url.startsWith('http://') || image.url.startsWith('https://')) {
        return image.url;
      }
      const cleanPath = image.url.startsWith('/') ? image.url.slice(1) : image.url;
      if (cleanPath.startsWith('static/images/')) {
        return `${API_BASE_URL}/api/images/${cleanPath.replace('static/images/', '')}`;
      }
      return `${API_BASE_URL}/${cleanPath}`;
    }
    return undefined;
  };

  const getImageCaption = (image?: any) => {
    if (!image) return '';
    if (typeof image === 'string') return '';
    return image.caption || image.alt || '';
  };

  // Helper to safely get array fields
  const getArray = (field: any) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    // If field is a string of bullet HTML, extract <li>...</li> as bullet points
    if (typeof field === 'string' && field.trim().startsWith('<ul')) {
      // Extract text between <li>...</li>
      const matches = Array.from(field.matchAll(/<li>(.*?)<\/li>/g)).map(m => ({ text: m[1] }));
      return matches.length > 0 ? matches : [];
    }
    return [];
  };

  return (
    <Box sx={{ 
      p: 2,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      ...(isFullscreen && {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        p: 0,
        zIndex: 1000,
        bgcolor: 'background.paper',
        height: '100vh',
        overflow: 'hidden'
      })
    }}>
      <Paper 
        ref={slideRef}
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: 'background.paper',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease-in-out',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)'
          },
          ...(isFullscreen && {
            width: '100%',
            height: '100%',
            m: 0,
            p: 4,
            borderRadius: 0,
            position: 'static',
            '&:hover': {
              transform: 'none',
              boxShadow: 'none'
            }
          })
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'rgba(0, 0, 0, 0.02)',
          backdropFilter: 'blur(8px)',
          ...(isFullscreen ? {
            position: 'fixed',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 1001,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
            p: 2
          } : {})
        }}>
          <IconButton onClick={onPrevious} disabled={currentIndex === 0}>
            <NavigateBefore />
          </IconButton>
          <Typography variant="body1">
            Slide {currentIndex + 1} of {slides.length}
          </Typography>
          <Box>
            <IconButton onClick={toggleFullscreen} sx={{ mr: 1 }}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
            <IconButton onClick={onNext} disabled={currentIndex === slides.length - 1}>
              <NavigateNext />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ 
          flex: '1 1 auto',
          overflowY: 'auto',
          pr: 1,
          pb: 8, // Extra bottom padding
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(0,0,0,0.3)'
            }
          },
          ...(isFullscreen ? {
            mt: 2,
            pr: 2,
            height: 'calc(100vh - 120px)'
          } : {
            maxHeight: 'calc(100vh - 180px)'
          })
        }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '1.8rem', md: '2.2rem' },
              lineHeight: 1.2,
              letterSpacing: '-0.5px',
              position: 'relative',
              '&:after': {
                content: '""',
                display: 'block',
                width: '60px',
                height: '4px',
                background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)',
                mt: 1.5,
                borderRadius: '2px'
              }
            }}
          >
            {currentSlide.content.title}
          </Typography>

          {/* BODY CONTENT: Render HTML or plain text */}
          {currentSlide.content?.body && (
            currentSlide.content.body.trim().startsWith('<') ? (
              <Box
                sx={{
                  mt: 3,
                  mb: 4,
                  fontSize: '1.25rem',
                  color: 'text.secondary',
                  lineHeight: 1.7,
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    color: 'text.primary',
                    mt: 3,
                    mb: 2,
                    fontWeight: 600
                  },
                  '& p': {
                    mb: 2,
                    lineHeight: 1.7
                  },
                  '& ul, & ol': {
                    pl: 3,
                    mb: 2,
                    '& li': {
                      mb: 1
                    }
                  }
                }}
                dangerouslySetInnerHTML={{ __html: currentSlide.content.body }}
              />
            ) : (
              <Typography sx={{
                mt: 3,
                mb: 4,
                fontSize: '1.25rem',
                color: 'text.secondary',
                whiteSpace: 'pre-line',
                lineHeight: 1.7
              }}>
                {currentSlide.content.body}
              </Typography>
            )
          )}

          {(currentSlide.content?.image) && (
            <Box sx={{
              my: 4,
              textAlign: 'center',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)'
              },
              maxWidth: '100%',
              mx: 'auto',
              position: 'relative',
              bgcolor: 'background.paper',
              p: 1
            }}>
              <Image
                src={getImageUrl(currentSlide.content.image)}
                alt={getImageCaption(currentSlide.content.image) || 'Slide illustration'}
                width={800}
                height={600}
                style={{
                  objectFit: 'contain',
                  maxHeight: isFullscreen ? '60vh' : '400px',
                  width: '100%',
                  borderRadius: '8px',
                }}
                onError={(e) => {
                  // Fallback for broken images
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/placeholder-image.png';
                }}
              />
              {getImageCaption(currentSlide.content.image) && (
                <Typography 
                  variant="caption" 
                  display="block" 
                  sx={{
                    mt: 1.5,
                    p: 1,
                    fontStyle: 'italic',
                    color: 'text.secondary',
                    fontSize: '0.8rem',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    width: '100%',
                    textAlign: 'center'
                  }}
                >
                  {getImageCaption(currentSlide.content.image)}
                </Typography>
              )}
            </Box>
          )}

          {getArray(currentSlide.content?.bullets).length > 0 && (
            <List sx={{
              mb: 4,
              '& .MuiListItem-root': {
                alignItems: 'flex-start',
                p: 0,
                mb: 1.5,
                '&:last-child': { mb: 0 }
              },
              '& .MuiListItemText-root': {
                m: 0,
                '& .MuiTypography-root': {
                  display: 'flex',
                  alignItems: 'flex-start',
                  lineHeight: 1.6,
                  '&:before': {
                    content: '""',
                    display: 'inline-block',
                    minWidth: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    mt: '0.6em',
                    mr: 2,
                    flexShrink: 0
                  }
                }
              },
              '& li': {
                padding: '4px 0'
              }
            }}>
              {getArray(currentSlide.content.bullets).map((point: any, index: number) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={point.text} 
                    primaryTypographyProps={{
                      variant: 'body1',
                      color: 'text.primary',
                      lineHeight: 1.6
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}

          {getArray(currentSlide.content?.examples).length > 0 && (
            <Box sx={{
              mt: 3,
              mb: 4,
              p: 3,
              borderRadius: 2,
              bgcolor: 'rgba(99, 102, 241, 0.05)',
              borderLeft: '4px solid',
              borderColor: 'primary.main'
            }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  '&:before': {
                    content: '""',
                    display: 'inline-block',
                    width: '24px',
                    height: '24px',
                    background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%236366f1\'%3E%3Cpath d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z\'/%3E%3C/svg%3E") no-repeat center',
                    mr: 1.5
                  }
                }}
              >
                Examples
              </Typography>
              <List disablePadding>
                {getArray(currentSlide.content.examples).map((example: any, index: number) => (
                  <ListItem 
                    key={index}
                    sx={{
                      alignItems: 'flex-start',
                      p: 0,
                      mb: 1.5,
                      '&:last-child': { mb: 0 }
                    }}
                  >
                    <ListItemText 
                      primary={example.text || example} 
                      primaryTypographyProps={{
                        variant: 'body1',
                        color: 'text.primary',
                        lineHeight: 1.6
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {getArray(currentSlide.content?.discussion_questions).length > 0 && (
            <Box sx={{
              mt: 3,
              p: 3,
              borderRadius: 2,
              bgcolor: 'rgba(16, 185, 129, 0.05)',
              borderLeft: '4px solid',
              borderColor: 'success.main'
            }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  color: 'success.main',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  '&:before': {
                    content: '""',
                    display: 'inline-block',
                    width: '24px',
                    height: '24px',
                    background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%2310B981\'%3E%3Cpath d=\'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z\'/%3E%3C/svg%3E") no-repeat center',
                    mr: 1.5
                  }
                }}
              >
                Discussion Questions
              </Typography>
              <List disablePadding>
                {getArray(currentSlide.content.discussion_questions).map((question: any, index: number) => (
                  <ListItem 
                    key={index}
                    sx={{
                      alignItems: 'flex-start',
                      p: 0,
                      mb: 1.5,
                      '&:last-child': { mb: 0 }
                    }}
                  >
                    <ListItemText 
                      primary={question} 
                      primaryTypographyProps={{
                        variant: 'body1',
                        color: 'text.primary',
                        lineHeight: 1.6,
                        fontWeight: 500
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SlidePreview;
