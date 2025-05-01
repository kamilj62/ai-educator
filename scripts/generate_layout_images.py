from PIL import Image, ImageDraw, ImageFont
import os

def create_layout_image(name, draw_func, output_dir):
    # Create a new image with a white background
    width = 800
    height = 600
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Draw the layout
    draw_func(draw, width, height)
    
    # Save the image
    output_path = os.path.join(output_dir, f"{name}.png")
    image.save(output_path)
    print(f"Created {output_path}")

def draw_title_slide(draw, width, height):
    # Title box
    draw.rectangle([width*0.1, height*0.3, width*0.9, height*0.4], outline='gray', width=2)
    # Subtitle box
    draw.rectangle([width*0.2, height*0.5, width*0.8, height*0.6], outline='lightgray', width=2)

def draw_title_image(draw, width, height):
    # Title box
    draw.rectangle([width*0.1, height*0.1, width*0.9, height*0.2], outline='gray', width=2)
    # Image box
    draw.rectangle([width*0.25, height*0.3, width*0.75, height*0.8], outline='gray', width=2)
    draw.line([width*0.25, height*0.3, width*0.75, height*0.8], fill='lightgray', width=1)
    draw.line([width*0.75, height*0.3, width*0.25, height*0.8], fill='lightgray', width=1)

def draw_title_body(draw, width, height):
    # Title box
    draw.rectangle([width*0.1, height*0.1, width*0.9, height*0.2], outline='gray', width=2)
    # Body box
    draw.rectangle([width*0.1, height*0.3, width*0.9, height*0.8], outline='gray', width=2)
    # Text lines
    for y in range(int(height*0.35), int(height*0.75), 20):
        draw.line([width*0.15, y, width*0.85, y], fill='lightgray', width=1)

def draw_title_body_image(draw, width, height):
    # Title box
    draw.rectangle([width*0.1, height*0.1, width*0.9, height*0.2], outline='gray', width=2)
    # Body box
    draw.rectangle([width*0.1, height*0.3, width*0.5, height*0.8], outline='gray', width=2)
    # Text lines
    for y in range(int(height*0.35), int(height*0.75), 20):
        draw.line([width*0.15, y, width*0.45, y], fill='lightgray', width=1)
    # Image box
    draw.rectangle([width*0.6, height*0.3, width*0.9, height*0.8], outline='gray', width=2)
    draw.line([width*0.6, height*0.3, width*0.9, height*0.8], fill='lightgray', width=1)
    draw.line([width*0.9, height*0.3, width*0.6, height*0.8], fill='lightgray', width=1)

def draw_title_bullets(draw, width, height):
    # Title box
    draw.rectangle([width*0.1, height*0.1, width*0.9, height*0.2], outline='gray', width=2)
    # Bullets
    bullet_start_y = height * 0.35
    for i in range(5):
        y = bullet_start_y + i * 80
        # Bullet point
        draw.ellipse([width*0.15-5, y-5, width*0.15+5, y+5], outline='gray', width=2)
        # Bullet line
        draw.line([width*0.2, y, width*0.85, y], fill='lightgray', width=1)

def draw_title_bullets_image(draw, width, height):
    # Title box
    draw.rectangle([width*0.1, height*0.1, width*0.9, height*0.2], outline='gray', width=2)
    # Bullets
    bullet_start_y = height * 0.35
    for i in range(5):
        y = bullet_start_y + i * 80
        # Bullet point
        draw.ellipse([width*0.15-5, y-5, width*0.15+5, y+5], outline='gray', width=2)
        # Bullet line
        draw.line([width*0.2, y, width*0.45, y], fill='lightgray', width=1)
    # Image box
    draw.rectangle([width*0.6, height*0.3, width*0.9, height*0.8], outline='gray', width=2)
    draw.line([width*0.6, height*0.3, width*0.9, height*0.8], fill='lightgray', width=1)
    draw.line([width*0.9, height*0.3, width*0.6, height*0.8], fill='lightgray', width=1)

def draw_two_column(draw, width, height):
    # Title box
    draw.rectangle([width*0.1, height*0.1, width*0.9, height*0.2], outline='gray', width=2)
    # Left column
    draw.rectangle([width*0.1, height*0.3, width*0.45, height*0.8], outline='gray', width=2)
    # Right column
    draw.rectangle([width*0.55, height*0.3, width*0.9, height*0.8], outline='gray', width=2)
    # Text lines
    for y in range(int(height*0.35), int(height*0.75), 20):
        draw.line([width*0.15, y, width*0.4, y], fill='lightgray', width=1)
        draw.line([width*0.6, y, width*0.85, y], fill='lightgray', width=1)

def draw_two_column_image(draw, width, height):
    # Title box
    draw.rectangle([width*0.1, height*0.1, width*0.9, height*0.2], outline='gray', width=2)
    # Left column
    draw.rectangle([width*0.1, height*0.3, width*0.45, height*0.8], outline='gray', width=2)
    # Text lines
    for y in range(int(height*0.35), int(height*0.75), 20):
        draw.line([width*0.15, y, width*0.4, y], fill='lightgray', width=1)
    # Right column (image)
    draw.rectangle([width*0.55, height*0.3, width*0.9, height*0.8], outline='gray', width=2)
    draw.line([width*0.55, height*0.3, width*0.9, height*0.8], fill='lightgray', width=1)
    draw.line([width*0.9, height*0.3, width*0.55, height*0.8], fill='lightgray', width=1)

def main():
    # Get the absolute path to the frontend/public directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_dir = os.path.join(project_root, "frontend", "public")  # Remove assets/layouts
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate all layout images
    layouts = {
        'title-slide': draw_title_slide,
        'title-image': draw_title_image,
        'title-body': draw_title_body,
        'title-body-image': draw_title_body_image,
        'title-bullets': draw_title_bullets,
        'title-bullets-image': draw_title_bullets_image,
        'two-column': draw_two_column,
        'two-column-image': draw_two_column_image,
    }
    
    for name, draw_func in layouts.items():
        create_layout_image(name, draw_func, output_dir)

if __name__ == "__main__":
    main()
