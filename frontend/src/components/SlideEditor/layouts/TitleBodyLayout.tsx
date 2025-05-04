import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import { Rnd } from 'react-rnd';

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  gap: theme.spacing(2),
}));

const TitleContainer = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: theme.palette.text.primary
}));

interface TitleBodyLayoutProps {
  slide: any;
  onChange: (slide: any) => void;
}

const TitleBodyLayout: React.FC<TitleBodyLayoutProps> = ({ 
  slide, 
  onChange
}) => {
  return (
    <BaseLayout>
      <ContentContainer>
        <TitleContainer>
          <span
            style={{ fontSize: '2.2rem', fontWeight: 600, color: '#222', display: 'block', marginBottom: '1rem' }}
            dangerouslySetInnerHTML={{ __html: typeof slide.content.title === 'string' ? (slide.content.title.trim().startsWith('<') ? slide.content.title : `<p>${slide.content.title}</p>`) : '' }}
          />
        </TitleContainer>
        <span
          style={{ fontSize: '1.25rem', color: '#333', display: 'block', marginTop: '1.5rem' }}
          dangerouslySetInnerHTML={{ __html: typeof slide.content.body === 'string' ? (slide.content.body.trim().startsWith('<') ? slide.content.body : `<p>${slide.content.body}</p>`) : '' }}
        />
        {/* Draggable/Resizable image below body for title-body-image layout */}
        {slide.content.image && slide.content.image.url && (
          <Rnd
            default={{
              x: slide.content.image.x || 100,
              y: slide.content.image.y || 420,
              width: slide.content.image.width || 300,
              height: slide.content.image.height || 200,
            }}
            bounds="parent"
            enableResizing={true}
            dragHandleClassName="draggable-image-handle"
            disableDragging={false}
            style={{ zIndex: 2, marginTop: 32, transition: 'box-shadow 0.2s, transform 0.1s' }}
            onDragStart={() => {
              // Optional: add visual feedback for dragging
            }}
            onDragStop={(e: any, d: any) => {
              if (!slide.content.image) return;
              onChange({
                ...slide,
                content: {
                  ...slide.content,
                  image: {
                    ...slide.content.image,
                    x: d.x,
                    y: d.y,
                    url: slide.content.image.url || '',
                    alt: slide.content.image.alt || '',
                    service: slide.content.image.service || 'upload',
                  },
                },
              });
            }}
            onResizeStop={(e: any, direction: any, ref: any, delta: any, position: any) => {
              if (!slide.content.image) return;
              onChange({
                ...slide,
                content: {
                  ...slide.content,
                  image: {
                    ...slide.content.image,
                    width: parseInt(ref.style.width, 10),
                    height: parseInt(ref.style.height, 10),
                    x: position.x,
                    y: position.y,
                    url: slide.content.image.url || '',
                    alt: slide.content.image.alt || '',
                    service: slide.content.image.service || 'upload',
                  },
                },
              });
            }}
          >
            <img
              src={slide.content.image.url}
              alt={slide.content.image.alt || 'Slide image'}
              style={{ width: '100%', height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', cursor: 'grab', transition: 'box-shadow 0.2s, transform 0.1s' }}
              className="draggable-image-handle"
              draggable={false}
            />
          </Rnd>
        )}
      </ContentContainer>
    </BaseLayout>
  );
};

export default TitleBodyLayout;
