import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { 
  SlideContent, 
  exportPresentation, 
  ExportFormat,
  setExportFormat,
  BulletPoint,
  Example 
} from '../store/presentationSlice';
import { AppDispatch } from '../store/store';

const SlidePreview: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const presentation = useSelector((state: RootState) => state.presentation.presentation);
  const loading = useSelector((state: RootState) => state.presentation.loading);
  const error = useSelector((state: RootState) => state.presentation.error);
  const exportStatus = useSelector((state: RootState) => state.presentation.exportStatus);
  const exportError = useSelector((state: RootState) => state.presentation.exportError);
  const [format, setFormat] = useState<ExportFormat>('pdf');

  const handleExport = async () => {
    try {
      dispatch(setExportFormat(format));
      await dispatch(exportPresentation()).unwrap();
      alert('Export successful!');
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const renderBulletPoints = (bulletPoints: BulletPoint[] = []) => {
    if (!Array.isArray(bulletPoints) || bulletPoints.length === 0) return null;
    
    return (
      <ul>
        {bulletPoints.map((point, index) => {
          if (!point?.text) return null;
          
          return (
            <li key={index}>
              {point.text}
              {Array.isArray(point.sub_points) && point.sub_points.length > 0 && (
                <ul>
                  {point.sub_points.map((subPoint, subIndex) => (
                    subPoint ? <li key={subIndex}>{subPoint}</li> : null
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderExamples = (examples: Example[] = []) => {
    if (!Array.isArray(examples) || examples.length === 0) return null;

    return (
      <div>
        <h3>Examples</h3>
        {examples.map((example, index) => {
          if (!example?.description) return null;

          return (
            <div key={index}>
              <h4>{example.description}</h4>
              {Array.isArray(example.details) && example.details.length > 0 && (
                <ul>
                  {example.details.map((detail, detailIndex) => (
                    detail ? <li key={detailIndex}>{detail}</li> : null
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!presentation?.slides || !Array.isArray(presentation.slides) || presentation.slides.length === 0) {
    return <div>No slides available</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <select 
          value={format} 
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
        >
          <option value="pdf">PDF</option>
          <option value="pptx">PowerPoint</option>
          <option value="google_slides">Google Slides</option>
        </select>
        <button 
          onClick={handleExport}
          disabled={exportStatus === 'loading'}
          style={{ marginLeft: '0.5rem' }}
        >
          {exportStatus === 'loading' ? 'Exporting...' : 'Export'}
        </button>
        {exportError && <div style={{ color: 'red', marginTop: '0.5rem' }}>{exportError}</div>}
      </div>

      <div>
        {presentation.slides.map((slide, index) => {
          if (!slide?.title) return null;

          return (
            <div key={index} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
              <h2>{slide.title}</h2>
              {slide.subtitle && <h3>{slide.subtitle}</h3>}
              {slide.introduction && <p>{slide.introduction}</p>}
              
              {renderBulletPoints(slide.bullet_points)}
              {renderExamples(slide.examples)}

              {slide.key_takeaway && (
                <div>
                  <h3>Key Takeaway</h3>
                  <p>{slide.key_takeaway}</p>
                </div>
              )}

              {Array.isArray(slide.discussion_questions) && slide.discussion_questions.length > 0 && (
                <div>
                  <h3>Discussion Questions</h3>
                  <ul>
                    {slide.discussion_questions.map((question, questionIndex) => (
                      question ? <li key={questionIndex}>{question}</li> : null
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SlidePreview;
