import React from 'react';
import { useAppSelector } from './store/hooks';
import InputSection from './components/InputSection';
import OutlineDisplay from './components/OutlineDisplay';
import SlideEditor from './components/SlideEditor/SlideEditor';

const App: React.FC = () => {
  const slides = useAppSelector(state => state.presentation.slides);
  
  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        background: '#1976d2',
        margin: 0,
        padding: 0,
        borderRadius: 0,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#212121' }}>
            Marvel AI Presentation Generator
          </h1>
          <p style={{ marginTop: 8, color: '#616161' }}>
            Create engaging presentations with AI-powered content generation
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: 8, padding: 24 }}>
              <InputSection />
            </div>
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: 8, padding: 24 }}>
              <OutlineDisplay />
            </div>
          </div>
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: 8, padding: 24 }}>
            <SlideEditor />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
