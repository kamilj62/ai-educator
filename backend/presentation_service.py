from typing import List, Optional
from pptx import Presentation as PPTXPresentation
from pptx.util import Inches, Pt
from models import SlideContent, ExportFormat
import os

class PresentationService:
    def create_pptx(self, slides: List[SlideContent], output_path: str) -> str:
        """Create a PowerPoint presentation from slide content."""
        prs = PPTXPresentation()
        
        # Create title slide
        title_slide_layout = prs.slide_layouts[0]
        slide = prs.slides.add_slide(title_slide_layout)
        title = slide.shapes.title
        subtitle = slide.placeholders[1]
        title.text = slides[0].title
        subtitle.text = "Generated with MarvelAI"
        
        # Create content slides
        for slide_content in slides[1:]:
            content_slide_layout = prs.slide_layouts[1]
            slide = prs.slides.add_slide(content_slide_layout)
            
            # Set title
            title = slide.shapes.title
            title.text = slide_content.title
            
            # Add bullet points
            content = slide.placeholders[1]
            tf = content.text_frame
            
            for point in slide_content.bullet_points:
                p = tf.add_paragraph()
                p.text = point
                p.level = 0
        
        # Save the presentation
        prs.save(output_path)
        return output_path
    
    def create_google_slides(self, slides: List[SlideContent]) -> str:
        """Create a Google Slides presentation (placeholder for future implementation)."""
        # This would integrate with Google Slides API
        # For now, we'll return a message
        return "Google Slides integration coming soon"
    
    def create_pdf(self, slides: List[SlideContent], output_path: str) -> str:
        """Create a PDF presentation (placeholder for future implementation)."""
        # This would use a PDF generation library
        # For now, we'll create a PPTX and note that PDF conversion would be added
        pptx_path = self.create_pptx(slides, output_path.replace('.pdf', '.pptx'))
        return f"PDF conversion coming soon. Created PPTX at: {pptx_path}"
    
    def export_presentation(self, slides: List[SlideContent], format: ExportFormat) -> str:
        """Export the presentation in the specified format."""
        base_path = "presentations"
        os.makedirs(base_path, exist_ok=True)
        
        output_path = os.path.join(base_path, f"presentation.{format.value}")
        
        if format == ExportFormat.PPTX:
            return self.create_pptx(slides, output_path)
        elif format == ExportFormat.GOOGLE_SLIDES:
            return self.create_google_slides(slides)
        elif format == ExportFormat.PDF:
            return self.create_pdf(slides, output_path)
        else:
            raise ValueError(f"Unsupported export format: {format}")
