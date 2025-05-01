import React from 'react';
import { useAppSelector } from './store/hooks';
import InputSection from './components/InputSection';
import OutlineDisplay from './components/OutlineDisplay';
import SlideEditor from './components/SlideEditor/SlideEditor';

const App: React.FC = () => {
  const slides = useAppSelector(state => state.presentation.slides);
  
  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Marvel AI Presentation Generator
          </h1>
          <p className="mt-2 text-gray-600">
            Create engaging presentations with AI-powered content generation
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <InputSection />
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <OutlineDisplay />
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <SlideEditor />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
